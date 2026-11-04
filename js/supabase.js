// Cliente Supabase carregado por CDN (sem frameworks JavaScript).
(() => {
  const cfg = window.STOKA_CONFIG;
  if (!cfg || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.supabaseUrl) || !cfg.supabaseAnonKey || cfg.supabaseAnonKey === 'SUA_CHAVE_PUBLICA') {
    window.stokaConfigError = 'Configure js/config.js com a Project URL e a Publishable key do Supabase.';
    return;
  }
  if (!window.supabase?.createClient) {
    window.stokaConfigError = 'Biblioteca Supabase indisponível. Verifique sua conexão com a internet.';
    return;
  }
  window.stoka = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
})();
