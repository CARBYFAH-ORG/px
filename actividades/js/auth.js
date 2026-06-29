/* =========================================================
   FA-2 ACTIVIDADES · Autenticación
   ========================================================= */
APP.Auth = (function(){
  const KEY = 'fa2_act_session';

  function session(){
    try { return JSON.parse(localStorage.getItem(KEY)); } catch(e){ return null; }
  }
  function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  function clear(){ localStorage.removeItem(KEY); }

  async function login(usuario, password){
    const r = await APP.API.call('login', {usuario, password});
    if (!r.ok) return r;
    save({usuario:r.user.usuario, token:r.token, user:r.user});
    return r;
  }

  function logout(){
    clear();
    location.reload();
  }

  function user(){ const s = session(); return s ? s.user : null; }

  function isJefeDepto(){ const u = user(); return u && u.rol === 'jefe_depto'; }
  function isJefeSeccion(){ const u = user(); return u && u.rol === 'jefe_seccion'; }
  function isUsuario(){ const u = user(); return u && u.rol === 'usuario'; }
  function puedeCrear(){ return isJefeDepto() || isJefeSeccion(); }

  // ---- UI Login ----
  function mountLogin(){
    const root = document.getElementById('login');
    root.classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');

    const form = document.getElementById('login-form');
    const err = document.getElementById('login-err');
    const btn = document.getElementById('login-btn');

    form.onsubmit = async function(ev){
      ev.preventDefault();
      err.classList.remove('show');
      btn.disabled = true;
      const original = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span> Ingresando…';
      const usuario = document.getElementById('login-user').value.trim();
      const password = document.getElementById('login-pass').value;
      const r = await login(usuario, password);
      btn.disabled = false;
      btn.innerHTML = original;
      if (!r.ok) {
        err.textContent = r.error || 'Error';
        err.classList.add('show');
        return;
      }
      APP.boot();
    };
  }

  return { session, login, logout, user, mountLogin,
           isJefeDepto, isJefeSeccion, isUsuario, puedeCrear };
})();
