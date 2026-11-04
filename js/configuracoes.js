(() => {
  const $ = selector => document.querySelector(selector);
  const date = value => value ? new Date(value).toLocaleDateString('pt-BR') : '—';
  window.addEventListener('stoka:ready', async ({ detail: { user, member } }) => {
    $('#usuario-email').textContent = user.email || '—';
    $('#usuario-papel').textContent = member.papel || '—';
    try {
      const [empresa, perfil] = await Promise.all([
        window.stoka.from('empresas').select('nome,criado_em').eq('id',member.empresa_id).single(),
        window.stoka.from('perfis').select('nome').eq('id',user.id).maybeSingle()
      ]);
      if (empresa.error) throw empresa.error;
      if (perfil.error) throw perfil.error;
      $('#empresa-nome').textContent = empresa.data.nome;
      $('#empresa-data').textContent = date(empresa.data.criado_em);
      $('#usuario-nome').textContent = perfil.data?.nome || user.user_metadata?.nome || '—';
      $('#config-status').textContent = 'Informações atualizadas.';
    } catch (error) {
      $('#config-status').textContent = 'Não foi possível carregar todas as informações: ' + error.message;
    }
  });
})();
