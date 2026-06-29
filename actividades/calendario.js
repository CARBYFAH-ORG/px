/* =========================================================
   FA-2 ACTIVIDADES · Calendario
   ========================================================= */
APP.Views.calendario = {
  title:'Calendario',
  render: async function(cont){
    const r = await APP.API.call('listar_actividades');
    if (!r.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(r.error)+'</p></div>'; return; }
    const colores = {'Recibida':'#3b82f6','En curso':'#8b5cf6','Completada':'#f59e0b',
                     'Reportada':'#16a34a','Vencida':'#ef4444','Cancelada':'#94a3b8'};
    const events = r.actividades.filter(a => a.fecha_limite).map(a => ({
      id: a.id,
      title: a.titulo + (a.asignado_a ? ' · '+a.asignado_a : ''),
      start: a.fecha_limite,
      backgroundColor: colores[a.estado] || '#465fff',
      borderColor: colores[a.estado] || '#465fff'
    }));

    let html = '';
    if (APP.Auth.puedeCrear()) html += '<div style="margin-bottom:14px;display:flex;justify-content:flex-end;gap:8px"><button class="btn" id="btn-nueva">+ Nueva actividad</button></div>';
    html += '<div class="panel"><div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px;font-size:.78rem">';
    Object.keys(colores).forEach(k => {
      html += `<span style="display:flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:${colores[k]};display:inline-block"></span>${k}</span>`;
    });
    html += '</div><div id="calendar"></div></div>';
    cont.innerHTML = html;

    const btnN = document.getElementById('btn-nueva');
    if (btnN) btnN.onclick = () => APP.Views.ficha.nueva();

    const cal = new FullCalendar.Calendar(document.getElementById('calendar'), {
      initialView: 'dayGridMonth',
      locale: 'es',
      headerToolbar: {left:'prev,next today',center:'title',right:'dayGridMonth,timeGridWeek,listWeek'},
      buttonText: {today:'Hoy', month:'Mes', week:'Semana', list:'Lista'},
      height: 650,
      events: events,
      eventClick: function(info){
        APP.Views.ficha.abrir(info.event.id);
      }
    });
    cal.render();
  }
};
