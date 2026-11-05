-- STO KA - Etapa 7. Executar no SQL Editor do Supabase após revisar o backup.
-- Migração idempotente, sem excluir dados; executa em uma transação.
BEGIN;
ALTER TABLE public.membros_empresa ADD COLUMN IF NOT EXISTS permissoes jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.stoka_tem_permissao(p_empresa_id uuid, p_permissao text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
 SELECT EXISTS (
  SELECT 1 FROM public.membros_empresa m
  WHERE m.empresa_id = p_empresa_id AND m.usuario_id = (SELECT auth.uid())
  AND (m.papel = 'administrador' OR (m.papel = 'operador' AND m.permissoes ->> p_permissao = 'true'))
 );
$fn$;
REVOKE ALL ON FUNCTION public.stoka_tem_permissao(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.stoka_tem_permissao(uuid,text) TO authenticated;

-- Apenas administradores vinculam contas já cadastradas, identificadas pelo e-mail exato.
-- Não permite que a mesma conta seja vinculada a empresas distintas (fluxo atual do app é de uma empresa por usuário).
CREATE OR REPLACE FUNCTION public.stoka_vincular_operador(p_empresa_id uuid,p_email text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_id uuid;
BEGIN
 IF NOT public.stoka_eh_admin(p_empresa_id) THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
 IF p_email IS NULL OR length(trim(p_email)) > 254 OR position('@' in p_email)=0 THEN RAISE EXCEPTION 'E-mail inválido'; END IF;
 SELECT id INTO v_id FROM auth.users WHERE lower(email)=lower(trim(p_email)) LIMIT 1;
 IF v_id IS NULL THEN RAISE EXCEPTION 'Conta não encontrada. Solicite ao funcionário que se cadastre primeiro.'; END IF;
 IF EXISTS (SELECT 1 FROM public.membros_empresa WHERE usuario_id=v_id) THEN
   RAISE EXCEPTION 'Este usuário já possui vínculo com uma empresa';
 END IF;
 INSERT INTO public.membros_empresa(empresa_id,usuario_id,papel,permissoes)
 VALUES(p_empresa_id,v_id,'operador','{}'::jsonb);
 RETURN v_id;
END;$fn$;

CREATE OR REPLACE FUNCTION public.stoka_definir_permissoes(p_empresa_id uuid,p_usuario_id uuid,p_permissoes jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_key text; v_value jsonb;
BEGIN
 IF NOT public.stoka_eh_admin(p_empresa_id) THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
 IF p_permissoes IS NULL OR jsonb_typeof(p_permissoes)<>'object' THEN RAISE EXCEPTION 'Permissões inválidas'; END IF;
 FOR v_key,v_value IN SELECT key,value FROM jsonb_each(p_permissoes) LOOP
   IF v_key NOT IN ('criar_produtos','editar_produtos','excluir_produtos','criar_categorias','editar_categorias','excluir_categorias','ajustar_estoque','importar_excel')
      OR jsonb_typeof(v_value)<>'boolean' THEN RAISE EXCEPTION 'Permissão inválida: %',v_key; END IF;
 END LOOP;
 UPDATE public.membros_empresa SET permissoes=p_permissoes
 WHERE empresa_id=p_empresa_id AND usuario_id=p_usuario_id AND papel='operador';
 IF NOT FOUND THEN RAISE EXCEPTION 'Analista não encontrado nesta empresa'; END IF;
END;$fn$;

CREATE OR REPLACE FUNCTION public.stoka_remover_operador(p_empresa_id uuid,p_usuario_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
 IF NOT public.stoka_eh_admin(p_empresa_id) THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
 DELETE FROM public.membros_empresa WHERE empresa_id=p_empresa_id AND usuario_id=p_usuario_id AND papel='operador';
 IF NOT FOUND THEN RAISE EXCEPTION 'Analista não encontrado nesta empresa'; END IF;
END;$fn$;

REVOKE ALL ON FUNCTION public.stoka_vincular_operador(uuid,text),public.stoka_definir_permissoes(uuid,uuid,jsonb),public.stoka_remover_operador(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.stoka_vincular_operador(uuid,text),public.stoka_definir_permissoes(uuid,uuid,jsonb),public.stoka_remover_operador(uuid,uuid) TO authenticated;

-- Consulta de perfis pela empresa: gestor pode listar; operador não pode consultar lista de funcionários.
-- A política SELECT existente de membros_empresa já permite a leitura pelo administrador.

-- stoka_criar_produto: preserva corpo e validações originais, alterando apenas a verificação de autorização.
DO $migration$
DECLARE v_oid oid; v_def text; v_updated text;
BEGIN
 SELECT p.oid INTO v_oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='stoka_criar_produto' LIMIT 1;
 IF v_oid IS NULL THEN RAISE EXCEPTION 'Função stoka_criar_produto não encontrada'; END IF;
 v_def:=pg_get_functiondef(v_oid);
 IF position('public.stoka_eh_admin(p_empresa_id)' in v_def)=0
    AND position('public.stoka_tem_permissao(p_empresa_id, ''criar_produtos'')' in v_def)=0
 THEN RAISE EXCEPTION 'Verificação esperada não encontrada em stoka_criar_produto'; END IF;
 v_updated:=replace(v_def,'public.stoka_eh_admin(p_empresa_id)',
  'public.stoka_tem_permissao(p_empresa_id, ''criar_produtos'')');
 EXECUTE v_updated;
END;$migration$;

-- stoka_editar_categoria: preserva corpo e validações originais, alterando apenas a verificação de autorização.
DO $migration$
DECLARE v_oid oid; v_def text; v_updated text;
BEGIN
 SELECT p.oid INTO v_oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='stoka_editar_categoria' LIMIT 1;
 IF v_oid IS NULL THEN RAISE EXCEPTION 'Função stoka_editar_categoria não encontrada'; END IF;
 v_def:=pg_get_functiondef(v_oid);
 IF position('public.stoka_eh_admin(p_empresa_id)' in v_def)=0
    AND position('public.stoka_tem_permissao(p_empresa_id, ''editar_categorias'')' in v_def)=0
 THEN RAISE EXCEPTION 'Verificação esperada não encontrada em stoka_editar_categoria'; END IF;
 v_updated:=replace(v_def,'public.stoka_eh_admin(p_empresa_id)',
  'public.stoka_tem_permissao(p_empresa_id, ''editar_categorias'')');
 EXECUTE v_updated;
END;$migration$;

-- stoka_editar_produto: preserva corpo e validações originais, alterando apenas a verificação de autorização.
DO $migration$
DECLARE v_oid oid; v_def text; v_updated text;
BEGIN
 SELECT p.oid INTO v_oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='stoka_editar_produto' LIMIT 1;
 IF v_oid IS NULL THEN RAISE EXCEPTION 'Função stoka_editar_produto não encontrada'; END IF;
 v_def:=pg_get_functiondef(v_oid);
 IF position('public.stoka_eh_admin(p_empresa_id)' in v_def)=0
    AND position('public.stoka_tem_permissao(p_empresa_id, ''editar_produtos'')' in v_def)=0
 THEN RAISE EXCEPTION 'Verificação esperada não encontrada em stoka_editar_produto'; END IF;
 v_updated:=replace(v_def,'public.stoka_eh_admin(p_empresa_id)',
  'public.stoka_tem_permissao(p_empresa_id, ''editar_produtos'')');
 EXECUTE v_updated;
END;$migration$;

-- stoka_excluir_categoria: preserva corpo e validações originais, alterando apenas a verificação de autorização.
DO $migration$
DECLARE v_oid oid; v_def text; v_updated text;
BEGIN
 SELECT p.oid INTO v_oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='stoka_excluir_categoria' LIMIT 1;
 IF v_oid IS NULL THEN RAISE EXCEPTION 'Função stoka_excluir_categoria não encontrada'; END IF;
 v_def:=pg_get_functiondef(v_oid);
 IF position('public.stoka_eh_admin(p_empresa_id)' in v_def)=0
    AND position('public.stoka_tem_permissao(p_empresa_id, ''excluir_categorias'')' in v_def)=0
 THEN RAISE EXCEPTION 'Verificação esperada não encontrada em stoka_excluir_categoria'; END IF;
 v_updated:=replace(v_def,'public.stoka_eh_admin(p_empresa_id)',
  'public.stoka_tem_permissao(p_empresa_id, ''excluir_categorias'')');
 EXECUTE v_updated;
END;$migration$;

-- stoka_excluir_produto: preserva corpo e validações originais, alterando apenas a verificação de autorização.
DO $migration$
DECLARE v_oid oid; v_def text; v_updated text;
BEGIN
 SELECT p.oid INTO v_oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='stoka_excluir_produto' LIMIT 1;
 IF v_oid IS NULL THEN RAISE EXCEPTION 'Função stoka_excluir_produto não encontrada'; END IF;
 v_def:=pg_get_functiondef(v_oid);
 IF position('public.stoka_eh_admin(p_empresa_id)' in v_def)=0
    AND position('public.stoka_tem_permissao(p_empresa_id, ''excluir_produtos'')' in v_def)=0
 THEN RAISE EXCEPTION 'Verificação esperada não encontrada em stoka_excluir_produto'; END IF;
 v_updated:=replace(v_def,'public.stoka_eh_admin(p_empresa_id)',
  'public.stoka_tem_permissao(p_empresa_id, ''excluir_produtos'')');
 EXECUTE v_updated;
END;$migration$;

-- stoka_importar_planilha: preserva corpo e validações originais, alterando apenas a verificação de autorização.
DO $migration$
DECLARE v_oid oid; v_def text; v_updated text;
BEGIN
 SELECT p.oid INTO v_oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='stoka_importar_planilha' LIMIT 1;
 IF v_oid IS NULL THEN RAISE EXCEPTION 'Função stoka_importar_planilha não encontrada'; END IF;
 v_def:=pg_get_functiondef(v_oid);
 IF position('public.stoka_eh_admin(p_empresa_id)' in v_def)=0
    AND position('public.stoka_tem_permissao(p_empresa_id, ''importar_excel'')' in v_def)=0
 THEN RAISE EXCEPTION 'Verificação esperada não encontrada em stoka_importar_planilha'; END IF;
 v_updated:=replace(v_def,'public.stoka_eh_admin(p_empresa_id)',
  'public.stoka_tem_permissao(p_empresa_id, ''importar_excel'')');
 EXECUTE v_updated;
END;$migration$;

-- ATENÇÃO: stoka_criar_categoria e stoka_ajustar_estoque não constavam do CSV fornecido.
-- Por segurança, somente ajustamos essas funções quando o padrão exato de checagem está presente.
DO $migration$
DECLARE v_name text; v_key text; v_oid oid; v_def text;
BEGIN
 FOR v_name,v_key IN SELECT * FROM (VALUES
 ('stoka_criar_categoria','criar_categorias'),('stoka_ajustar_estoque','ajustar_estoque')) AS x(nome,chave)
 LOOP
  SELECT p.oid INTO v_oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname=v_name LIMIT 1;
  IF v_oid IS NULL THEN RAISE EXCEPTION 'Função % não encontrada; interrompendo migração',v_name; END IF;
  v_def:=pg_get_functiondef(v_oid);
  IF position('public.stoka_eh_admin(p_empresa_id)' in v_def)>0 THEN
    EXECUTE replace(v_def,'public.stoka_eh_admin(p_empresa_id)',
      format('public.stoka_tem_permissao(p_empresa_id, %L)',v_key));
  ELSIF position('public.stoka_tem_permissao(p_empresa_id' in v_def)>0 THEN
    NULL; -- já migrada
  ELSE
    RAISE EXCEPTION 'Autorização de % precisa de revisão manual: checagem de administrador não encontrada',v_name;
  END IF;
 END LOOP;
END;$migration$;
COMMIT;
