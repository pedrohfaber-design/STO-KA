// STO KA - Categorias, produtos e ajustes com RPC autenticada.
(() => {
  const $ = s => document.querySelector(s);
  const client = () => window.stoka;
  let empresaId = null, papel = null, categorias = [], produtos = [];
  const can = key => window.stokaCan?.(key) === true;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const feedback = (message, error=false) => { $('#feedback').textContent=message; $('#feedback').className=`text-sm mb-5 ${error?'text-red-700':'text-slate-500'}`; };
  const alertar = (icon,title,text) => Swal.fire({icon,title,text,confirmButtonColor:'#0d9488'});
  const setBusy = (form, busy) => { const b=form.querySelector('[type=submit]'); b.disabled=busy; b.setAttribute('aria-busy',String(busy)); };
  const inteiro = value => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : NaN;
  async function load() {
    const [cats, prods] = await Promise.all([
      client().from('categorias').select('id,nome').eq('empresa_id',empresaId).order('nome'),
      client().from('produtos').select('id,codigo,nome,categoria_id,descricao,quantidade,estoque_minimo,preco_custo,preco_venda').eq('empresa_id',empresaId).eq('ativo',true).order('nome')
    ]);
    if(cats.error) throw cats.error;
    if(prods.error) throw prods.error;
    categorias=cats.data||[]; produtos=prods.data||[];
    render(); feedback(`${produtos.length} produto(s) cadastrado(s).`);
  }
  function render() {
    const sel=$('#categoria'); const selected=sel.value;
    sel.innerHTML='<option value="">Sem categoria</option>'+categorias.map(c=>`<option value="${escape(c.id)}">${escape(c.nome)}</option>`).join('');
    sel.value=categorias.some(c=>c.id===selected)?selected:'';
    $('#categorias-lista').innerHTML=categorias.length ? categorias.map(c=>`<li class="py-3 flex items-center justify-between gap-2"><span>${escape(c.nome)}</span><span class="flex gap-2">${can('editar_categorias')?`<button type="button" class="text-teal-700 underline" data-cat-edit="${escape(c.id)}">Editar</button>`:''}${can('excluir_categorias')?`<button type="button" class="text-red-700 underline" data-cat-del="${escape(c.id)}">Excluir</button>`:''}</span></li>`).join('') : '<li class="py-3 text-slate-500">Nenhuma categoria cadastrada.</li>';
    const query=$('#pesquisa').value.toLocaleLowerCase('pt-BR').trim();
    const filtered=produtos.filter(p=>(p.codigo+' '+p.nome).toLocaleLowerCase('pt-BR').includes(query));
    $('#produtos-lista').innerHTML=filtered.length ? filtered.map(p=>`<tr class="border-b"><td class="p-3">${escape(p.codigo)}</td><td class="p-3 font-medium">${escape(p.nome)}</td><td class="p-3">${escape(categorias.find(c=>c.id===p.categoria_id)?.nome||'—')}</td><td class="p-3 ${p.quantidade<=p.estoque_minimo?'text-amber-700 font-semibold':''}">${p.quantidade}</td><td class="p-3">${p.estoque_minimo}</td><td class="p-3"><span class="inline-flex flex-wrap gap-3">${can('ajustar_estoque')?`<button type="button" class="text-teal-700 underline" data-ajuste="${escape(p.id)}">Ajustar</button>`:''}${can('editar_produtos')?`<button type="button" class="text-blue-700 underline" data-prod-edit="${escape(p.id)}">Editar</button>`:''}${can('excluir_produtos')?`<button type="button" class="text-red-700 underline" data-prod-del="${escape(p.id)}">Excluir</button>`:''}</span></td></tr>`).join('') : '<tr><td colspan="6" class="p-6 text-center text-slate-500">Nenhum produto encontrado.</td></tr>';
    $('#categoria-form').hidden=!can('criar_categorias'); $('#produto-form').hidden=!can('criar_produtos');
  }
  async function rpc(name,args) { const {error}=await client().rpc(name,args); if(error) throw error; }
  async function submitCategoria(e) {
    e.preventDefault(); const form=e.currentTarget; if(!form.reportValidity())return;
    setBusy(form,true);
    try { await rpc('stoka_criar_categoria',{p_empresa_id:empresaId,p_nome:form.elements.nome.value.trim()});form.reset();await load();await alertar('success','Categoria criada','Categoria salva no Supabase.'); }
    catch(err){await alertar('error','Erro ao cadastrar categoria',err.message);} finally{setBusy(form,false);}
  }
  async function submitProduto(e) {
    e.preventDefault(); const form=e.currentTarget; if(!form.reportValidity())return;
    const quantidade=inteiro(form.elements.quantidade.value), minimo=inteiro(form.elements.estoque_minimo.value);
    if(!Number.isInteger(quantidade)||!Number.isInteger(minimo)||quantidade>2147483647||minimo>2147483647)return alertar('warning','Quantidade inválida','Use números inteiros não negativos.');
    const money = name => form.elements[name].value===''?null:Number(form.elements[name].value);
    setBusy(form,true);
    try {
      await rpc('stoka_criar_produto',{p_empresa_id:empresaId,p_codigo:form.elements.codigo.value.trim(),p_nome:form.elements.nome.value.trim(),p_categoria_id:form.elements.categoria.value||null,p_descricao:form.elements.descricao.value.trim()||null,p_quantidade:quantidade,p_estoque_minimo:minimo,p_preco_custo:money('preco_custo'),p_preco_venda:money('preco_venda')});
      form.reset();await load();await alertar('success','Produto cadastrado','O estoque inicial foi registrado no histórico.');
    }catch(err){await alertar('error','Erro ao cadastrar produto',err.code==='23505'?'Já existe um produto com este código nesta empresa.':err.message);}finally{setBusy(form,false);}
  }
  async function action(e) {
    const edit=e.target.closest('[data-cat-edit]'), del=e.target.closest('[data-cat-del]'), adjust=e.target.closest('[data-ajuste]'), prodEdit=e.target.closest('[data-prod-edit]'), prodDel=e.target.closest('[data-prod-del]');
    if(edit && can('editar_categorias')){const cat=categorias.find(c=>c.id===edit.dataset.catEdit);if(!cat)return;
      const result=await Swal.fire({title:'Renomear categoria',input:'text',inputValue:cat.nome,showCancelButton:true,confirmButtonText:'Salvar',cancelButtonText:'Cancelar',inputValidator:v=>!v||v.trim().length<2?'Informe pelo menos 2 caracteres.':undefined});if(!result.isConfirmed)return;
      try{await rpc('stoka_editar_categoria',{p_empresa_id:empresaId,p_categoria_id:cat.id,p_nome:result.value.trim()});await load();}catch(err){await alertar('error','Erro ao editar',err.message);} }
    if(del && can('excluir_categorias')){const cat=categorias.find(c=>c.id===del.dataset.catDel);if(!cat)return;
      const result=await Swal.fire({icon:'warning',title:'Excluir categoria?',text:`${cat.nome} — categorias utilizadas por produtos não podem ser excluídas.`,showCancelButton:true,confirmButtonText:'Excluir',cancelButtonText:'Cancelar',confirmButtonColor:'#b91c1c'});if(!result.isConfirmed)return;
      try{await rpc('stoka_excluir_categoria',{p_empresa_id:empresaId,p_categoria_id:cat.id});await load();}catch(err){await alertar('error','Erro ao excluir','Confira se existem produtos vinculados. '+err.message);} }
    if(prodEdit){
      if(!can('editar_produtos'))return;
      const prod=produtos.find(p=>p.id===prodEdit.dataset.prodEdit);if(!prod)return;
      const field=(id,label,value,type='text')=>`<label for="${id}" class="block text-sm text-left mt-3 mb-1">${label}</label><input id="${id}" class="swal2-input !m-0 !w-full" type="${type}" value="${escape(value??'')}" ${type==='number'?'min="0" step="0.01"':''}>`;
      const catOptions='<option value="">Sem categoria</option>'+categorias.map(c=>`<option value="${escape(c.id)}" ${c.id===prod.categoria_id?'selected':''}>${escape(c.nome)}</option>`).join('');
      const html=`<div class="text-left">${field('edit-codigo','Código',prod.codigo)}${field('edit-nome','Nome',prod.nome)}<label for="edit-categoria" class="block text-sm mt-3 mb-1">Categoria</label><select id="edit-categoria" class="swal2-select !m-0 !w-full">${catOptions}</select>${field('edit-minimo','Estoque mínimo',prod.estoque_minimo,'number')}${field('edit-custo','Preço de custo (R$)',prod.preco_custo,'number')}${field('edit-venda','Preço de venda (R$)',prod.preco_venda,'number')}<label for="edit-descricao" class="block text-sm mt-3 mb-1">Descrição</label><textarea id="edit-descricao" class="swal2-textarea !m-0 !w-full">${escape(prod.descricao)}</textarea><p class="text-xs text-slate-500 mt-3">A quantidade é alterada exclusivamente em Ajustar.</p></div>`;
      const result=await Swal.fire({title:'Editar produto',html,width:580,showCancelButton:true,confirmButtonText:'Salvar alterações',cancelButtonText:'Cancelar',focusConfirm:false,preConfirm:()=>{
        const val=id=>document.getElementById(id).value.trim();const codigo=val('edit-codigo'),nome=val('edit-nome'),minimo=inteiro(val('edit-minimo'));
        const preco=id=>val(id)===''?null:Number(val(id));const custo=preco('edit-custo'),venda=preco('edit-venda');
        if(!codigo||codigo.length>60||nome.length<2||nome.length>200||!Number.isInteger(minimo)||minimo>2147483647||[custo,venda].some(v=>v!==null&&(!Number.isFinite(v)||v<0))){Swal.showValidationMessage('Confira código, nome, estoque mínimo e preços.');return false;}
        return {p_empresa_id:empresaId,p_produto_id:prod.id,p_codigo:codigo,p_nome:nome,p_categoria_id:val('edit-categoria')||null,p_descricao:val('edit-descricao')||null,p_estoque_minimo:minimo,p_preco_custo:custo,p_preco_venda:venda};
      }});
      if(!result.isConfirmed)return;
      try{await rpc('stoka_editar_produto',result.value);await load();await alertar('success','Produto atualizado','Os dados cadastrais foram salvos.');}catch(err){await alertar('error','Erro ao editar',err.code==='23505'?'Código já utilizado nesta empresa.':err.message);}
    }
    if(prodDel){
      if(!can('excluir_produtos'))return;
      const prod=produtos.find(p=>p.id===prodDel.dataset.prodDel);if(!prod)return;
      const result=await Swal.fire({icon:'warning',title:'Desativar produto?',text:`${prod.codigo} — ${prod.nome}. O produto sairá do catálogo ativo, mas o histórico será preservado.`,showCancelButton:true,confirmButtonText:'Desativar produto',cancelButtonText:'Cancelar',confirmButtonColor:'#b91c1c'});
      if(!result.isConfirmed)return;
      try{await rpc('stoka_excluir_produto',{p_empresa_id:empresaId,p_produto_id:prod.id});await load();await alertar('success','Produto desativado','O histórico de movimentações foi preservado.');}catch(err){await alertar('error','Erro ao desativar',err.message);}
    }
    if(adjust && can('ajustar_estoque')){const prod=produtos.find(p=>p.id===adjust.dataset.ajuste);if(!prod)return;
      const result=await Swal.fire({title:`Ajustar: ${prod.nome}`,html:`<label for="swal-qty" class="block text-sm mb-1">Nova quantidade</label><input id="swal-qty" class="swal2-input" type="number" min="0" step="1" value="${prod.quantidade}"><label for="swal-obs" class="block text-sm mb-1">Observação</label><input id="swal-obs" class="swal2-input" maxlength="300" placeholder="Motivo do ajuste">`,showCancelButton:true,confirmButtonText:'Confirmar ajuste',cancelButtonText:'Cancelar',preConfirm:()=>{const q=inteiro($('#swal-qty').value);if(!Number.isInteger(q)||q>2147483647||q===prod.quantidade){Swal.showValidationMessage('Informe uma quantidade inteira diferente da atual.');return false;}return {q,obs:$('#swal-obs').value.trim()};}});if(!result.isConfirmed)return;
      try{await rpc('stoka_ajustar_estoque',{p_empresa_id:empresaId,p_produto_id:prod.id,p_quantidade_nova:result.value.q,p_observacao:result.value.obs||null});await load();await alertar('success','Estoque atualizado','A movimentação foi registrada.');}catch(err){await alertar('error','Erro no ajuste',err.message);} }
  }
  window.addEventListener('stoka:ready',async ({detail})=>{
    empresaId=detail.member.empresa_id;papel=detail.member.papel;
    $('#categoria-form').addEventListener('submit',submitCategoria);$('#produto-form').addEventListener('submit',submitProduto);
    $('#pesquisa').addEventListener('input',render);document.addEventListener('click',action);
    try{const {data}=await client().from('empresas').select('nome').eq('id',empresaId).single();$('#empresa-atual').textContent=data?.nome||'';await load();}catch(err){feedback('Falha ao carregar dados: '+err.message,true);}
  });
})();
