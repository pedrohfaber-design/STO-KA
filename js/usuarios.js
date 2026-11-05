(() => {
 const $=s=>document.querySelector(s), api=()=>window.stoka;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={criar_produtos:'Cadastrar produtos',editar_produtos:'Editar produtos',excluir_produtos:'Desativar produtos',criar_categorias:'Criar categorias',editar_categorias:'Editar categorias',excluir_categorias:'Excluir categorias',ajustar_estoque:'Ajustar estoque',importar_excel:'Importar Excel'};
 let empresaId, membros=[];
 const message=(msg)=>$('#status').textContent=msg;
 async function call(fn,args){const {data,error}=await api().rpc(fn,args);if(error)throw error;return data;}
 async function load(){
  const {data,error}=await api().from('membros_empresa').select('usuario_id,papel,permissoes,criado_em').eq('empresa_id',empresaId).order('criado_em');
  if(error)throw error; membros=data||[];
  const ids=membros.map(m=>m.usuario_id);
  let profiles=[];
  if(ids.length){const res=await api().from('perfis').select('id,nome').in('id',ids);if(!res.error)profiles=res.data||[];}
  const names=new Map(profiles.map(v=>[v.id,v.nome]));
  $('#users').innerHTML=membros.map(m=>{
    const admin=m.papel==='administrador';
    return `<article class="border rounded-xl p-4" data-user="${esc(m.usuario_id)}"><div class="flex justify-between flex-wrap gap-2 mb-3"><div><strong>${esc(names.get(m.usuario_id)||'Usuário cadastrado')}</strong><p class="text-xs text-slate-500 break-all">${esc(m.usuario_id)}</p></div><span class="font-semibold text-sm">${admin?'Gestor':'Analista'}</span></div>${admin?'<p class="text-sm text-slate-600">Acesso administrativo completo.</p>':`<div class="grid sm:grid-cols-2 gap-3">${Object.entries(labels).map(([key,label])=>`<label class="flex gap-2 items-center text-sm"><input type="checkbox" data-key="${key}" ${m.permissoes?.[key]===true?'checked':''}><span>${label}</span></label>`).join('')}</div><div class="flex gap-3 flex-wrap mt-4"><button class="btn btn-primary" data-save="${esc(m.usuario_id)}">Salvar permissões</button><button class="btn btn-outline" data-remove="${esc(m.usuario_id)}">Remover da empresa</button></div>`}</article>`;
  }).join('')||'<p>Nenhum usuário vinculado.</p>';
  message(`${membros.length} usuário(s) vinculado(s).`);
 }
 window.addEventListener('stoka:ready',async ({detail})=>{
  if(detail.member.papel!=='administrador'){message('Acesso restrito ao Gestor.');$('#add-form').hidden=true;return;}
  empresaId=detail.member.empresa_id;
  $('#add-form').addEventListener('submit',async e=>{e.preventDefault();if(!e.target.reportValidity())return;const b=e.target.querySelector('button');b.disabled=true;
   try{await call('stoka_vincular_operador',{p_empresa_id:empresaId,p_email:e.target.elements.email.value.trim()});e.target.reset();await load();await Swal.fire('Funcionário vinculado','Configure as permissões antes de liberar o trabalho.','success');}
   catch(err){await Swal.fire('Não foi possível vincular',err.message,'error');}finally{b.disabled=false;}
  });
  $('#users').addEventListener('click',async e=>{
   const save=e.target.closest('[data-save]'),remove=e.target.closest('[data-remove]');if(!save&&!remove)return;
   const id=(save||remove).dataset[save?'save':'remove'], card=(save||remove).closest('[data-user]');
   if(remove){const confirm=await Swal.fire({title:'Remover funcionário?',text:'O usuário perderá o vínculo com esta empresa.',icon:'warning',showCancelButton:true,confirmButtonText:'Remover',cancelButtonText:'Cancelar'});if(!confirm.isConfirmed)return;}
   const btn=save||remove;btn.disabled=true;
   try{if(save){const perms=Object.fromEntries([...card.querySelectorAll('[data-key]')].map(el=>[el.dataset.key,el.checked]));await call('stoka_definir_permissoes',{p_empresa_id:empresaId,p_usuario_id:id,p_permissoes:perms});}else await call('stoka_remover_operador',{p_empresa_id:empresaId,p_usuario_id:id});await load();await Swal.fire('Concluído',save?'Permissões atualizadas.':'Funcionário removido.','success');}
   catch(err){await Swal.fire('Erro',err.message,'error');}finally{btn.disabled=false;}
  });
  try{await load();}catch(err){message('Erro ao carregar usuários: '+err.message);}
 });
})();