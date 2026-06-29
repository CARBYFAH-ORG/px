/* =========================================================
   FA-2 ACTIVIDADES · Bootstrap principal
   ========================================================= */
APP.boot = function(){
  const ses = APP.Auth.session();
  if (!ses) { APP.Auth.mountLogin(); return; }

  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  // Registrar vistas
  APP.Router.register('dashboard', APP.Views.dashboard);
  APP.Router.register('lista', APP.Views.lista);
  APP.Router.register('kanban', APP.Views.kanban);
  APP.Router.register('calendario', APP.Views.calendario);
  APP.Router.register('usuarios', APP.Views.usuarios);
  APP.Router.register('secciones', APP.Views.secciones);
  APP.Router.register('config', APP.Views.config);

  // Sidebar
  pintarSidebar();

  // Click handlers
  document.querySelectorAll('.nav a').forEach(a => {
    a.onclick = (ev) => { ev.preventDefault(); APP.Router.go(a.dataset.view); };
  });
  document.getElementById('btn-logout').onclick = APP.Auth.logout;
  document.getElementById('menubtn').onclick = () => document.querySelector('.sidebar').classList.toggle('open');

  // Ir a dashboard y mostrar banner
  APP.Router.go('dashboard').then(()=> APP.Notif.mostrarBanner());
};

function pintarSidebar(){
  const u = APP.Auth.user();
  const items = [
    {v:'dashboard',  t:'Dashboard',   ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>'},
    {v:'kanban',     t:'Tablero',     ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="6" height="18" rx="1"/><rect x="11" y="3" width="6" height="12" rx="1"/><rect x="19" y="3" width="2" height="8" rx="1"/></svg>'},
    {v:'calendario', t:'Calendario',  ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'},
    {v:'lista',      t:'Lista',       ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>'}
  ];
  const admin = [];
  if (APP.Auth.isJefeDepto() || APP.Auth.isJefeSeccion())
    admin.push({v:'usuarios', t:'Usuarios', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'});
  if (APP.Auth.isJefeDepto())
    admin.push({v:'secciones', t:'Secciones', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>'});
  admin.push({v:'config', t:'Configuración', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'});

  const nav = document.getElementById('nav');
  let html = '<div class="grp">General</div>';
  items.forEach(i => html += `<a data-view="${i.v}">${i.ic}<span>${i.t}</span></a>`);
  html += '<div class="grp">Administración</div>';
  admin.forEach(i => html += `<a data-view="${i.v}">${i.ic}<span>${i.t}</span></a>`);
  nav.innerHTML = html;

  document.getElementById('sf-who').textContent = (u.grado?u.grado+' ':'')+u.nombre;
  document.getElementById('sf-rol').textContent = u.rol + (u.asignacion?(' · '+u.asignacion):'');
}

// Inicio
document.addEventListener('DOMContentLoaded', function(){
  APP.boot();
});
