(() => {
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const limit = 50;
  let empresaId, page = 0, total = 0, movimentos = [], produtos = new Map();
  const formatDate = value => value ? new Date(value).toLocaleString('pt-BR') : '—';
  const typeLabel = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' };
  function render() {
    const search = $('#busca').value.trim().toLocaleLowerCase('pt-BR');
    const type = $('#tipo-filtro').value;
    const rows = movimentos.filter(m => {
      const p = produtos.get(m.produto_id);
      return (!type || m.tipo === type) && (!search || `${p?.codigo ?? ''} ${p?.nome ?? ''}`.toLocaleLowerCase('pt-BR').includes(search));
    });
    $('#mov-lista').innerHTML = rows.length ? rows.map(m => {
      const p = produtos.get(m.produto_id);
      return `<tr class="border-b"><td class="p-3 whitespace-nowrap">${escape(formatDate(m.criado_em))}</td><td class="p-3"><strong>${escape(p?.nome || 'Produto não disponível')}</strong><span class="block text-xs text-slate-500">${escape(p?.codigo || '—')}</span></td><td class="p-3">${escape(typeLabel[m.tipo] || m.tipo)}</td><td class="p-3">${escape(m.quantidade_anterior)}</td><td class="p-3">${escape(m.quantidade_nova)}</td><td class="p-3">${escape(m.observacao || (m.importacao_id ? 'Importação Excel' : '—'))}</td></tr>`;
    }).join('') : '<tr><td colspan="6" class="p-6 text-center text-slate-500">Nenhuma movimentação encontrada nesta página.</td></tr>';
    $('#pagina').textContent = `Página ${page + 1}`;
    $('#anterior').disabled = page === 0;
    $('#proximo').disabled = (page + 1) * limit >= total;
    $('#mov-status').textContent = `${total.toLocaleString('pt-BR')} movimentação(ões) no histórico. Exibindo até ${limit} por página.`;
  }
  async function load() {
    $('#mov-status').textContent = 'Carregando histórico...';
    $('#atualizar').disabled = true;
    try {
      const { data, count, error } = await window.stoka.from('movimentacoes')
        .select('id,produto_id,tipo,quantidade_anterior,quantidade_nova,observacao,importacao_id,criado_em', { count: 'exact' })
        .eq('empresa_id', empresaId).order('criado_em', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);
      if (error) throw error;
      movimentos = data || []; total = count ?? 0;
      const ids = [...new Set(movimentos.map(m => m.produto_id).filter(Boolean))];
      produtos = new Map();
      if (ids.length) {
        const result = await window.stoka.from('produtos').select('id,codigo,nome')
          .eq('empresa_id', empresaId).in('id', ids);
        if (result.error) throw result.error;
        produtos = new Map((result.data || []).map(p => [p.id, p]));
      }
      render();
    } catch (error) {
      $('#mov-status').textContent = 'Erro ao carregar movimentações: ' + error.message;
      $('#mov-lista').innerHTML = '';
    } finally { $('#atualizar').disabled = false; }
  }
  window.addEventListener('stoka:ready', ({ detail }) => {
    empresaId = detail.member.empresa_id;
    $('#busca').addEventListener('input', render);
    $('#tipo-filtro').addEventListener('change', render);
    $('#atualizar').addEventListener('click', load);
    $('#anterior').addEventListener('click', () => { if (page > 0) { page--; load(); } });
    $('#proximo').addEventListener('click', () => { if ((page + 1) * limit < total) { page++; load(); } });
    load();
  });
})();
