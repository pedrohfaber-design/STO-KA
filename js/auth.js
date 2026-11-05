// STO KA - Autenticacao e controle de sessao (JavaScript Vanilla).
(() => {
  const client = () => window.stoka;
  const notify = (icon, title, text) => window.Swal ? Swal.fire({ icon, title, text, confirmButtonColor:'#0d9488' }) : alert(title + ': ' + text);
  const buttonBusy = (button, busy, label) => { if (!button) return; button.disabled = busy; button.textContent = busy ? 'Aguarde...' : label; button.setAttribute('aria-busy', String(busy)); };
  const next = (page) => window.location.replace(page);
  const checkConfig = () => { if (!client()) { notify('error','Configuração pendente', window.stokaConfigError || 'Supabase não configurado'); return false; } return true; };

  // Cada usuario pode participar de varias empresas, com papeis independentes.
  async function memberships(user) {
    const { data, error } = await client().from('membros_empresa')
      .select('empresa_id,papel,permissoes').eq('usuario_id', user.id);
    if (error) throw error;
    return data || [];
  }
  const storageKey = user => `stoka:empresa:${user.id}`;
  function membershipFor(user, members) {
    const saved = sessionStorage.getItem(storageKey(user));
    return members.find(m => m.empresa_id === saved) || members[0] || null;
  }
  async function renderCompanySelector(user, members, active) {
    if (members.length < 2) return;
    const ids = members.map(m => m.empresa_id);
    const { data, error } = await client().from('empresas').select('id,nome').in('id', ids);
    if (error) throw error;
    const names = new Map((data || []).map(c => [c.id, c.nome]));
    const section = document.createElement('div');
    section.className = 'stoka-company-switcher';
    const label = document.createElement('label');
    label.htmlFor = 'stoka-empresa-selecionada';
    label.textContent = 'Empresa ativa';
    const select = document.createElement('select');
    select.id = 'stoka-empresa-selecionada';
    select.className = 'field';
    select.setAttribute('aria-label', 'Trocar empresa ativa');
    members.forEach(member => {
      const option = document.createElement('option');
      option.value = member.empresa_id;
      option.textContent = `${names.get(member.empresa_id) || 'Empresa'} — ${member.papel === 'administrador' ? 'Gestor' : 'Analista'}`;
      select.appendChild(option);
    });
    select.value = active.empresa_id;
    select.addEventListener('change', () => {
      if (!members.some(m => m.empresa_id === select.value)) return;
      sessionStorage.setItem(storageKey(user), select.value);
      // Recarregar garante que todas as consultas e permissoes usem a nova empresa.
      window.location.assign('index.html');
    });
    section.append(label, select);
    const header = document.querySelector('header');
    if (header) header.insertAdjacentElement('afterend', section);
    else document.body.prepend(section);
  }
  async function protectPage() {
    if (!checkConfig()) return;
    const { data: { user }, error } = await client().auth.getUser();
    if (error || !user) { next('login.html'); return; }
    try {
      const members = await memberships(user);
      const member = membershipFor(user, members);
      if (!member) { next('empresa.html'); return; }
      await renderCompanySelector(user, members, member);
      window.stokaCan = key => member.papel === 'administrador' || member.permissoes?.[key] === true;
      document.body.hidden = false;
      document.querySelectorAll('[data-admin-only]').forEach(el => { if (member.papel !== 'administrador') el.hidden = true; });
      document.querySelectorAll('[data-permission]').forEach(el => { if (!window.stokaCan(el.dataset.permission)) el.hidden = true; });
      document.querySelectorAll('[data-user-email]').forEach(el => { el.textContent = user.email || ''; });
      document.querySelectorAll('[data-user-role]').forEach(el => { el.textContent = member.papel; });
      document.querySelectorAll('[data-logout]').forEach(el => el.addEventListener('click', logout));
      window.dispatchEvent(new CustomEvent('stoka:ready', { detail: { user, member } }));
    } catch (err) { await notify('error','Falha ao verificar acesso', err.message); }
  }
  async function logout() {
    if (!checkConfig()) return;
    const { error } = await client().auth.signOut();
    if (error) return notify('error','Erro ao sair',error.message);
    // Limpa a empresa ativa somente ao sair da conta.
    Object.keys(sessionStorage).filter(k => k.startsWith('stoka:empresa:')).forEach(k => sessionStorage.removeItem(k));
    next('login.html');
  }
  async function initLogin() {
    if (!checkConfig()) return;
    const form = document.querySelector('#login-form');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const btn = form.querySelector('button[type=submit]'); buttonBusy(btn,true,'Entrar');
      try {
        const email = form.elements.email.value.trim();
        const password = form.elements.senha.value;
        const { error } = await client().auth.signInWithPassword({ email, password });
        if (error) throw error;
        next('index.html');
      } catch (err) { await notify('error','Não foi possível entrar',err.message); }
      finally { buttonBusy(btn,false,'Entrar'); }
    });
  }
  async function initSignup() {
    if (!checkConfig()) return;
    const form = document.querySelector('#cadastro-form');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const name = form.elements.nome.value.trim();
      if (name.length < 3) return notify('warning','Nome inválido','Informe seu nome completo.');
      const password = form.elements.senha.value;
      if (password.length < 8) return notify('warning','Senha inválida','A senha deve conter pelo menos 8 caracteres.');
      const btn = form.querySelector('button[type=submit]'); buttonBusy(btn,true,'Criar conta');
      try {
        const { data, error } = await client().auth.signUp({
          email: form.elements.email.value.trim(), password,
          options: { data: { nome: name }, emailRedirectTo: new URL('login.html', window.location.href).href }
        });
        if (error) throw error;
        if (data.session) { await notify('success','Conta criada','Agora vamos cadastrar sua empresa.'); next('empresa.html'); }
        else { await notify('success','Confira seu e-mail','Se o cadastro foi aceito, você receberá um link de confirmação. Depois, entre no STO KA.'); next('login.html'); }
      } catch (err) { await notify('error','Erro no cadastro',err.message); }
      finally { buttonBusy(btn,false,'Criar conta'); }
    });
  }
  async function initEmpresa() {
    if (!checkConfig()) return;
    const { data: { user }, error } = await client().auth.getUser();
    if (error || !user) return next('login.html');
    try { if ((await memberships(user)).length) return next('index.html'); }
    catch (err) { return notify('error','Erro ao verificar empresa',err.message); }
    const form = document.querySelector('#empresa-form');
    const suggestedName = user.user_metadata?.nome || '';
    if (suggestedName) form.elements.nome.value = suggestedName;
    form?.addEventListener('submit', async event => {
      event.preventDefault(); if (!form.reportValidity()) return;
      const empresa = form.elements.empresa.value.trim();
      const nome = form.elements.nome.value.trim();
      if (empresa.length < 3 || nome.length < 2) return notify('warning','Dados incompletos','Confira os nomes informados.');
      const btn = form.querySelector('button[type=submit]'); buttonBusy(btn,true,'Criar empresa');
      try {
        const { error: rpcError } = await client().rpc('stoka_criar_empresa',{p_nome_empresa:empresa,p_nome_usuario:nome});
        if (rpcError) throw rpcError;
        await notify('success','Empresa cadastrada','Você foi registrado como administrador.');
        next('index.html');
      } catch (err) { await notify('error','Erro ao criar empresa',err.message); }
      finally { buttonBusy(btn,false,'Criar empresa'); }
    });
    document.querySelector('[data-logout]')?.addEventListener('click', logout);
  }
  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (page === 'login') initLogin();
    else if (page === 'cadastro') initSignup();
    else if (page === 'empresa') initEmpresa();
    else if (page === 'protected') protectPage();
  });
})();
