/* =========================================================
   FA-2 ACTIVIDADES · Dashboard
   ========================================================= */
APP.Views = APP.Views || {};
APP.Views.dashboard = {
  title: 'Dashboard',
  render: async function(cont){
    const r = await APP.API.call('dashboard');
    if (!r.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(r.error)+'</p></div>'; return; }
    const t = r.totales;

    const kpis = [
      {label:'Activas', value:t.activas, cls:'azul', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'},
      {label:'Completadas SIN reportar', value:t.completadas_sin_reportar, cls:'rojo', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>'},
      {label:'Vencidas', value:t.vencidas, cls:'ambar', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'},
      {label:'Reportadas hoy', value:t.reportadas_hoy, cls:'verde', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'},
      {label:'Tiempo promedio reporte', value:t.tiempo_promedio_horas+'h', cls:'morado', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>'}
    ];

    let html = '<div class="kpi-grid">';
    kpis.forEach(k => {
      html += `<div class="kpi ${k.cls}">
        <div class="ic">${k.ic}</div>
        <div class="label">${k.label}</div>
        <div class="value">${k.value}</div>
      </div>`;
    });
    html += '</div>';

    html += '<div class="panel-grid">';
    html += '<div class="panel"><h3>Distribución por estado</h3><canvas id="ch-estado" height="220"></canvas></div>';
    if (APP.Auth.isJefeDepto() && Object.keys(r.por_seccion).length) {
      html += '<div class="panel"><h3>Carga por sección</h3><canvas id="ch-seccion" height="220"></canvas></div>';
    } else {
      html += renderProximas(r.proximas_vencer);
    }
    html += '</div>';

    if (APP.Auth.isJefeDepto() && r.proximas_vencer.length) {
      html += renderProximas(r.proximas_vencer);
    }

    cont.innerHTML = html;

    // Chart estados
    const colores = {'Recibida':'#3b82f6','En curso':'#8b5cf6','Completada':'#f59e0b',
                     'Reportada':'#16a34a','Vencida':'#ef4444','Cancelada':'#94a3b8'};
    const labelsE = Object.keys(r.por_estado).filter(k => r.por_estado[k] > 0);
    new Chart(document.getElementById('ch-estado'), {
      type:'doughnut',
      data:{
        labels: labelsE,
        datasets:[{
          data: labelsE.map(k => r.por_estado[k]),
          backgroundColor: labelsE.map(k => colores[k]),
          borderWidth:0
        }]
      },
      options:{plugins:{legend:{position:'bottom',labels:{font:{size:11}}}},maintainAspectRatio:false}
    });

    if (APP.Auth.isJefeDepto() && document.getElementById('ch-seccion')) {
      const secs = Object.keys(r.por_seccion);
      new Chart(document.getElementById('ch-seccion'), {
        type:'bar',
        data:{
          labels:secs,
          datasets:[
            {label:'Total', data:secs.map(s => r.por_seccion[s].total), backgroundColor:'#465fff'},
            {label:'Reportadas', data:secs.map(s => r.por_seccion[s].reportadas), backgroundColor:'#16a34a'},
            {label:'Vencidas', data:secs.map(s => r.por_seccion[s].vencidas), backgroundColor:'#ef4444'}
          ]
        },
        options:{plugins:{legend:{position:'bottom',labels:{font:{size:11}}}},maintainAspectRatio:false,
          scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}
      });
    }

    // Click filas próximas
    document.querySelectorAll('[data-act-id]').forEach(el => {
      el.onclick = () => APP.Views.ficha.abrir(el.dataset.actId);
    });
  }
};

function renderProximas(arr){
  let h = '<div class="panel"><h3>Próximas a vencer (24h)</h3>';
  if (!arr.length) {
    h += '<div class="empty" style="padding:24px 0"><p>Sin actividades por vencer</p></div></div>';
    return h;
  }
  h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Título</th><th>Asignado</th><th>Vence</th><th>Estado</th></tr></thead><tbody>';
  arr.forEach(a => {
    h += `<tr class="row-click" data-act-id="${APP.U.esc(a.id)}">
      <td><b>${APP.U.esc(a.titulo)}</b></td>
      <td>${APP.U.esc(a.asignado_a)}</td>
      <td>${APP.U.fmtFechaHora(a.fecha_limite)}</td>
      <td><span class="badge ${APP.U.estadoCls(a.estado)}">${APP.U.esc(a.estado)}</span></td>
    </tr>`;
  });
  h += '</tbody></table></div></div>';
  return h;
}
