/* =========================================================
   FA-2 ACTIVIDADES · Utilidades
   ========================================================= */
APP.U = (function(){
  function fmtFecha(d){
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return '—';
    return dt.toLocaleDateString('es-HN',{day:'2-digit',month:'2-digit',year:'numeric'});
  }
  function fmtFechaHora(d){
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return '—';
    return dt.toLocaleString('es-HN',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
  }
  function fmtFechaInput(d){
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    const pad = n => String(n).padStart(2,'0');
    return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate())+'T'+pad(dt.getHours())+':'+pad(dt.getMinutes());
  }
  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function estadoCls(e){
    return ({'Recibida':'recibida','En curso':'encurso','Completada':'completada',
             'Reportada':'reportada','Vencida':'vencida','Cancelada':'cancelada'})[e]||'';
  }
  function toast(msg, type){
    type = type || 'success';
    const cont = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast '+type;
    el.textContent = msg;
    cont.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(20px)'; }, 2800);
    setTimeout(()=>el.remove(), 3200);
  }
  function loader(show){
    document.getElementById('fullload').classList.toggle('show', !!show);
  }
  function openModal(html){
    const bg = document.getElementById('modal-bg');
    bg.innerHTML = html;
    bg.classList.add('show');
    bg.onclick = function(ev){ if (ev.target === bg) closeModal(); };
  }
  function closeModal(){
    const bg = document.getElementById('modal-bg');
    bg.classList.remove('show');
    bg.innerHTML = '';
  }
  function confirmar(msg){ return window.confirm(msg); }

  // caché en memoria
  const cache = {secciones:null, usuarios:null};
  async function getSecciones(force){
    if (cache.secciones && !force) return cache.secciones;
    const r = await APP.API.call('listar_secciones');
    cache.secciones = r.ok ? r.secciones : [];
    return cache.secciones;
  }
  async function getUsuarios(force){
    if (cache.usuarios && !force) return cache.usuarios;
    const r = await APP.API.call('listar_usuarios');
    cache.usuarios = r.ok ? r.usuarios : [];
    return cache.usuarios;
  }
  function invalidar(k){ cache[k] = null; }

  return { fmtFecha, fmtFechaHora, fmtFechaInput, esc, estadoCls,
           toast, loader, openModal, closeModal, confirmar,
           getSecciones, getUsuarios, invalidar };
})();
