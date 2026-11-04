(() => {
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.addEventListener('stoka:ready',async({detail})=>{
    const id=detail.member.empresa_id,db=window.stoka;
    try{
      const [empresa,prod,mov]=await Promise.all([
        db.from('empresas').select('nome').eq('id',id).single(),
        db.from('produtos').select('id,codigo,nome,quantidade,estoque_minimo,criado_em').eq('empresa_id',id).eq('ativo',true).order('criado_em',{ascending:false}).limit(10000),
        db.from('movimentacoes').select('id',{count:'exact',head:true}).eq('empresa_id',id)
      ]);
      if(empresa.error)throw empresa.error;if(prod.error)throw prod.error;if(mov.error)throw mov.error;
      const products=prod.data||[];
      $('#dashboard-empresa').textContent=empresa.data?.nome||'Empresa';
      $('#total-produtos').textContent=products.length===10000?'10.000+':products.length.toLocaleString('pt-BR');
      $('#total-unidades').textContent=products.reduce((a,p)=>a+p.quantidade,0).toLocaleString('pt-BR');
      $('#total-baixo').textContent=products.filter(p=>p.quantidade<=p.estoque_minimo).length.toLocaleString('pt-BR');
      $('#total-movimentos').textContent=(mov.count??0).toLocaleString('pt-BR');
      $('#dashboard-recentes').innerHTML=products.length?'<ul class="divide-y">'+products.slice(0,5).map(p=>`<li class="py-3 flex justify-between gap-3"><span><strong>${esc(p.nome)}</strong><span class="block text-xs text-slate-500">${esc(p.codigo)}</span></span><span class="font-semibold">${p.quantidade} un.</span></li>`).join('')+'</ul>':'<p class="py-10 text-center">Nenhum produto cadastrado. <a class="text-teal-700 underline" href="produtos.html">Cadastrar agora</a></p>';
      if(products.length===10000)console.warn('Dashboard limitado a 10.000 produtos; implementar agregação no banco para catálogos maiores.');
    }catch(e){$('#dashboard-recentes').textContent='Erro ao carregar indicadores: '+e.message;}
  });
})();
