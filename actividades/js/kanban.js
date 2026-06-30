/* =========================================================
   FA-2 ACTIVIDADES · Kanban
   ========================================================= */
APP.Views.kanban = {
  title:'Tablero Kanban',
  render: async function(cont){
    const r = await APP.API.call('listar_actividades');
    if (!r.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(r.error)+'</p></div>'; return; }
    const acts = r.actividades.filter(a => ['Recibida','En curso','Completada','Reportada'].indexOf(a.estado) !== -1);

    const cols = [
      {key:'Recibida',  cls:'col-recibida',  ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'},
      {key:'En curso',  cls:'col-encurso',   ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'},
      {key:'Completada',cls:'col-completada',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'},
      {key:'Reportada', cls:'col-reportada', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>'}
    ];

    let html = '';
    if (APP.Auth.puedeCrear()) html += '<div style="margin-bottom:16px;display:flex;justify-content:flex-end"><button class="btn" id="btn-nueva">+ Nueva actividad</button></div>';
    html += '<div class="kanban">';
    cols.forEach(c => {
      const items = acts.filter(a => a.estado === c.key);
      html += `<div class="kanban-col ${c.cls}">
        <h4>${c.ic} ${c.key} <span class="count">${items.length}</span></h4>
        <div class="kanban-list" data-estado="${c.key}">
          ${items.map(a => renderCard(a)).join('')}
        </div>
      </div>`;
    });
    html += '</div>';
    cont.innerHTML = html;

    const btnN = document.getElementById('btn-nueva');
    if (btnN) btnN.onclick = () => APP.Views.ficha.nueva();

    document.querySelectorAll('.kanban-card').forEach(el => {
      el.onclick = (ev) => {
        if (ev.target.closest('.no-click')) return;
        APP.Views.ficha.abrir(el.dataset.actId);
      };
    });

    // drag&drop
    document.querySelectorAll('.kanban-list').forEach(list => {
      Sortable.create(list, {
        group: 'kanban',
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: async function(ev){
          const id = ev.item.dataset.actId;
          const nuevo = ev.to.dataset.estado;
          const anterior = ev.from.dataset.estado;
          if (nuevo === anterior) return;
          if (nuevo === 'Reportada') {
            // reportar requiere texto, lo pedimos
            const txt = prompt('Texto del reporte para el Jefe (obligatorio):');
            if (!txt) {
              // revertir movimiento
              ev.from.appendChild(ev.item);
              return;
            }
            const r = await APP.API.call('cambiar_estado', {id, estado:'Reportada', reporte_texto:txt});
            if (!r.ok) { APP.U.toast(r.error,'error'); ev.from.appendChild(ev.item); return; }
            APP.U.toast('Reportada al Jefe','success');
            APP.Router.refresh();
            return;
          }
          const r = await APP.API.call('cambiar_estado', {id, estado:nuevo});
          if (!r.ok) { APP.U.toast(r.error,'error'); ev.from.appendChild(ev.item); return; }
          APP.U.toast('Estado actualizado','success');
          APP.Router.refresh();
        }
      });
    });
  }
};

function renderCard(a){
  const vence = new Date(a.fecha_limite);
  const ahora = new Date();
  const dif = (vence - ahora) / 3600000;
  let venceCls = '';
  if (dif < 0 && a.estado !== 'Reportada') venceCls = 'style="color:var(--red)"';
  else if (dif < 24 && a.estado !== 'Reportada') venceCls = 'style="color:var(--amber)"';
  return `<div class="kanban-card" data-act-id="${APP.U.esc(a.id)}">
    <div class="kt">${APP.U.esc(a.titulo)}</div>
    <div class="kd" ${venceCls}><svg class="ic-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${APP.U.fmtFechaHora(a.fecha_limite)}</div>
    <div class="km">
      <span>${APP.U.esc(a.asignado_a)}</span>
      <span class="badge ${a.prioridad.toLowerCase()}">${APP.U.esc(a.prioridad)}</span>
    </div>
  </div>`;
}
