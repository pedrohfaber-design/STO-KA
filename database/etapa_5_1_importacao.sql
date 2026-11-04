-- STO KA | Etapa 5.1: importação atômica, validada e auditável.
-- Executar uma única vez no SQL Editor do Supabase, antes de importar.
BEGIN;
CREATE OR REPLACE FUNCTION public.stoka_importar_planilha(
 p_empresa_id uuid, p_tipo text, p_nome_arquivo text, p_linhas jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 v_linha jsonb; v_codigo text; v_nome text; v_categoria text; v_cat_id uuid;
 v_qtd integer; v_min integer; v_custo numeric(12,2); v_venda numeric(12,2);
 v_prod public.produtos%ROWTYPE; v_prod_id uuid; v_importacao uuid;
 v_criados integer := 0; v_atualizados integer := 0; v_inalterados integer := 0;
 v_codigos text[] := ARRAY[]::text[]; v_idx integer := 0; v_total integer;
BEGIN
 IF NOT public.stoka_eh_admin(p_empresa_id) THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
 IF p_tipo NOT IN ('cadastro','atualizacao') THEN RAISE EXCEPTION 'Tipo de importação inválido'; END IF;
 IF p_nome_arquivo IS NULL OR length(trim(p_nome_arquivo)) NOT BETWEEN 1 AND 255 THEN RAISE EXCEPTION 'Nome de arquivo inválido'; END IF;
 IF p_linhas IS NULL OR jsonb_typeof(p_linhas) <> 'array' THEN RAISE EXCEPTION 'Formato de linhas inválido'; END IF;
 v_total := jsonb_array_length(p_linhas);
 IF v_total < 1 OR v_total > 1000 THEN RAISE EXCEPTION 'Envie de 1 a 1000 linhas por importação'; END IF;
 -- Valida todas as linhas antes de qualquer escrita. Erros revertem toda a chamada.
 FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
  v_idx := v_idx + 1;
  IF jsonb_typeof(v_linha) <> 'object' THEN RAISE EXCEPTION 'Linha % inválida',v_idx; END IF;
  v_codigo := trim(v_linha->>'codigo');
  IF v_codigo IS NULL OR length(v_codigo) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Código inválido na linha %',v_idx; END IF;
  IF v_codigo = ANY(v_codigos) THEN RAISE EXCEPTION 'Código repetido na planilha: %',v_codigo; END IF;
  v_codigos := array_append(v_codigos,v_codigo);
  IF (v_linha->>'quantidade') IS NULL OR (v_linha->>'quantidade') !~ '^[0-9]{1,10}$'
    OR (v_linha->>'quantidade')::numeric > 2147483647 THEN RAISE EXCEPTION 'Quantidade inválida na linha %',v_idx; END IF;
  IF p_tipo='cadastro' THEN
   v_nome := trim(v_linha->>'nome');
   IF v_nome IS NULL OR length(v_nome) NOT BETWEEN 2 AND 200 THEN RAISE EXCEPTION 'Nome inválido na linha %',v_idx; END IF;
   IF coalesce(v_linha->>'estoque_minimo','') !~ '^[0-9]{1,10}$' OR (v_linha->>'estoque_minimo')::numeric > 2147483647 THEN
     RAISE EXCEPTION 'Estoque mínimo inválido na linha %',v_idx; END IF;
   IF length(coalesce(v_linha->>'descricao','')) > 3000 THEN RAISE EXCEPTION 'Descrição muito longa na linha %',v_idx; END IF;
   IF nullif(trim(coalesce(v_linha->>'preco_custo','')),'') IS NOT NULL AND
     ((v_linha->>'preco_custo') !~ '^[0-9]{1,10}(\.[0-9]{1,2})?$' OR (v_linha->>'preco_custo')::numeric > 9999999999.99) THEN
      RAISE EXCEPTION 'Preço de custo inválido na linha %',v_idx; END IF;
   IF nullif(trim(coalesce(v_linha->>'preco_venda','')),'') IS NOT NULL AND
     ((v_linha->>'preco_venda') !~ '^[0-9]{1,10}(\.[0-9]{1,2})?$' OR (v_linha->>'preco_venda')::numeric > 9999999999.99) THEN
      RAISE EXCEPTION 'Preço de venda inválido na linha %',v_idx; END IF;
   v_categoria := nullif(trim(v_linha->>'categoria'),'');
   IF v_categoria IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.categorias WHERE empresa_id=p_empresa_id AND nome=v_categoria) THEN
     RAISE EXCEPTION 'Categoria não cadastrada na linha %: %',v_idx,v_categoria; END IF;
  END IF;
  SELECT * INTO v_prod FROM public.produtos WHERE empresa_id=p_empresa_id AND codigo=v_codigo FOR UPDATE;
  IF FOUND AND NOT v_prod.ativo THEN RAISE EXCEPTION 'Produto desativado na linha %: %',v_idx,v_codigo; END IF;
  IF NOT FOUND AND p_tipo='atualizacao' THEN RAISE EXCEPTION 'Produto inexistente na linha %: %',v_idx,v_codigo; END IF;
 END LOOP;
 INSERT INTO public.importacoes(empresa_id,usuario_id,nome_arquivo,total_linhas)
 VALUES(p_empresa_id,(SELECT auth.uid()),trim(p_nome_arquivo),v_total) RETURNING id INTO v_importacao;
 FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
  v_codigo := trim(v_linha->>'codigo'); v_qtd := (v_linha->>'quantidade')::integer;
  SELECT * INTO v_prod FROM public.produtos WHERE empresa_id=p_empresa_id AND codigo=v_codigo FOR UPDATE;
  IF FOUND THEN
   IF v_prod.quantidade = v_qtd THEN v_inalterados := v_inalterados + 1; CONTINUE; END IF;
   UPDATE public.produtos SET quantidade=v_qtd,atualizado_em=now() WHERE id=v_prod.id;
   v_prod_id := v_prod.id; v_atualizados := v_atualizados+1;
   INSERT INTO public.movimentacoes(empresa_id,produto_id,usuario_id,importacao_id,tipo,quantidade_anterior,quantidade_nova,observacao)
   VALUES(p_empresa_id,v_prod_id,(SELECT auth.uid()),v_importacao,'ajuste',v_prod.quantidade,v_qtd,'Atualização por planilha: '||p_nome_arquivo);
  ELSE
   v_categoria := nullif(trim(v_linha->>'categoria'),''); v_cat_id := NULL;
   IF v_categoria IS NOT NULL THEN SELECT id INTO v_cat_id FROM public.categorias WHERE empresa_id=p_empresa_id AND nome=v_categoria; END IF;
   v_min := (v_linha->>'estoque_minimo')::integer;
   v_custo := nullif(trim(coalesce(v_linha->>'preco_custo','')),'')::numeric;
   v_venda := nullif(trim(coalesce(v_linha->>'preco_venda','')),'')::numeric;
   INSERT INTO public.produtos(empresa_id,categoria_id,codigo,nome,descricao,quantidade,estoque_minimo,preco_custo,preco_venda)
   VALUES(p_empresa_id,v_cat_id,v_codigo,trim(v_linha->>'nome'),nullif(trim(v_linha->>'descricao'),''),v_qtd,v_min,v_custo,v_venda)
   RETURNING id INTO v_prod_id;
   v_criados := v_criados+1;
   INSERT INTO public.movimentacoes(empresa_id,produto_id,usuario_id,importacao_id,tipo,quantidade_anterior,quantidade_nova,observacao)
   VALUES(p_empresa_id,v_prod_id,(SELECT auth.uid()),v_importacao,'ajuste',0,v_qtd,'Cadastro por planilha: '||p_nome_arquivo);
  END IF;
 END LOOP;
 RETURN jsonb_build_object('importacao_id',v_importacao,'criados',v_criados,'atualizados',v_atualizados,'inalterados',v_inalterados,'total',v_total);
END;
$$;
REVOKE ALL ON FUNCTION public.stoka_importar_planilha(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.stoka_importar_planilha(uuid,text,text,jsonb) TO authenticated;
COMMIT;
