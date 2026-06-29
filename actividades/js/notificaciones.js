/* =========================================================
   FA-2 ACTIVIDADES · Notificaciones (banner al login)
   ========================================================= */
APP.Notif = (function(){
  const KEY = 'fa2_act_banner_dismiss';

  async function mostrarBanner(){
    // mostrar solo una vez por día
    const hoy = new Date().toISOString().slice(0,10);
    if (localStorage.getItem(KEY) === hoy) return;

    const r = await APP.API.call('pendientes_login');
    if (!r.ok) return;
    const u = APP.Auth.user();

    const totales = [];
    if (r.mis_vencidas) totales.push({n:r.mis_vencidas, txt:'vencida(s)', cls:'rojo'});
    if (r.mis_completadas_sin_reportar) totales.push({n:r.mis_completadas_sin_reportar, txt:'completada(s) sin reportar', cls:'rojo'});
    if (r.mis_asignadas_activas) totales.push({n:r.mis_asignadas_activas, txt:'activa(s) pendientes', cls:'ambar'});

    if (!totales.length) return;

    const cls = totales[0].cls;
    const cont = document.getElementById('content');
    const div = document.createElement('div');
    div.className = 'banner-pendientes '+cls;
    let inner = `<b>👋 Buen día ${APP.U.esc((u.grado?u.grado+' ':'')+u.nombre)}.</b>`;
    totales.forEach(t => {
      inner += `<span class="b-item">• <b>${t.n}</b> ${t.txt}</span>`;
    });
    inner += '<button class="b-cerrar" title="Cerrar">×</button>';
    div.innerHTML = inner;
    cont.insertBefore(div, cont.firstChild);
    div.querySelector('.b-cerrar').onclick = function(){
      localStorage.setItem(KEY, hoy);
      div.remove();
    };
  }

  return { mostrarBanner };
})();
