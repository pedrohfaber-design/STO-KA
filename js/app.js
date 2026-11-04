const iconRefresh = () => window.lucide?.createIcons();
document.addEventListener('DOMContentLoaded', () => {
  iconRefresh();
  const menu = document.querySelector('[data-menu-toggle]');
  const panel = document.querySelector('[data-mobile-panel]');
  menu?.addEventListener('click', () => {
    const open = panel.classList.toggle('hidden') === false;
    menu.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
    Swal.fire({icon:'info',title:'Funcionalidade em desenvolvimento',text:'Esta é a estrutura visual da etapa 1. A integração será realizada nas próximas etapas.',confirmButtonColor:'#0d9488'});
  }));
});
