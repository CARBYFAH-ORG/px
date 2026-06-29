/* =========================================================
   FA-2 ACTIVIDADES · Ficha (modal CRUD + transiciones)
   ========================================================= */
APP.Views.ficha = {
  nueva: async function(){
    if (!APP.Auth.puedeCrear()) { APP.U.toast('Sin permiso','error'); return; }
    const [secs, usrs] = await Promise.all([APP.U.getSecciones(), APP.U.getUsuarios()]);
    const u = APP.Auth.user();
    const secOptions = secs.filter(s => APP.Auth.isJefeDepto() || s.codigo === u.asignacion)
      .map(s => `<option value="${APP.U.esc(s.codigo)}">${APP.U.esc(s.nombre)}</option>`).join('');

    const html = `<div class="modal lg" onclick="event.stopPropagation()">
      <div class="mh"><h3>Nueva actividad</h3><button class="x" onclick="APP.U.closeModal()">×</button></div>
      <div class="mb">
        <label>Título *</label>
        <input id="f-titulo" placeholder="Ej: Reporte semanal de novedades">
        <label>Descripción</label>
        <textarea id="f-desc" placeholder="Detalles de la orden, qué hay que hacer…"></textarea>
        <div class="row3">
          <div><label>Sección *</label><select id="f-seccion"><option value="">—</option>${secOptions}</select></div>
          <div><label>Asignado a *</label><select id="f-asig"><option value="">— Selecciona sección —</option></select></div>
          <div><label>Prioridad</label><select id="f-prio"><option>Media</option><option>Alta</option><option>Baja</option></select></div>
        </div>
        <label>Fecha y hora límite *</label>
        <input type="datetime-local" id="f-limite" value="${APP.U.fmtFechaInput(new Date(Date.now()+24*3600*1000))}">
      </div>
      <div class="mf">
        <button class="btn sec" onclick="APP.U.closeModal()">Cancelar</button>
        <button class="btn" id="f-guardar">Crear actividad</button>
      </div>
    </div>`;
    APP.U.openModal(html);

    // filtrar asignados al elegir sección
    document.getElementById('f-seccion').onchange = function(){
      const cod = this.value;
      const filt = usrs.filter(usr => usr.activo && usr.asignacion === cod);
      document.getElementById('f-asig').innerHTML = '<option value="">—</option>'+
        filt.map(usr => `<option value="${APP.U.esc(usr.usuario)}">${APP.U.esc((usr.grado?usr.grado+' ':'')+usr.nombre)} (${APP.U.esc(usr.usuario)})</option>`).join('');
    };
    // si solo hay una sección posible, autoseleccionarla
    if (!APP.Auth.isJefeDepto()) {
      document.getElementById('f-seccion').value = u.asignacion;
      document.getElementById('f-seccion').dispatchEvent(new Event('change'));
    }

    document.getElementById('f-guardar').onclick = async function(){
      const data = {
        titulo: document.getElementById('f-titulo').value.trim(),
        descripcion: document.getElementById('f-desc').value.trim(),
        seccion: document.getElementById('f-seccion').value,
        asignado_a: document.getElementById('f-asig').value,
        prioridad: document.getElementById('f-prio').value,
        fecha_limite: document.getElementById('f-limite').value
      };
      if (!data.titulo || !data.seccion || !data.asignado_a || !data.fecha_limite) {
        APP.U.toast('Faltan campos obligatorios','error'); return;
      }
      this.disabled = true; this.innerHTML = '<span class="spinner"></span> Creando…';
      const r = await APP.API.call('crear_actividad', data);
      if (!r.ok) { APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML='Crear actividad'; return; }
      APP.U.closeModal();
      APP.U.toast('Actividad creada','success');
      APP.Router.refresh();
    };
  },

  abrir: async function(id){
    APP.U.loader(true);
    const [aR, hR, usrs] = await Promise.all([
      APP.API.call('obtener_actividad', {id}),
      APP.API.call('historial_actividad', {id}),
      (APP.Auth.puedeCrear() ? APP.U.getUsuarios() : Promise.resolve([]))
    ]);
    APP.U.loader(false);
    if (!aR.ok) { APP.U.toast(aR.error,'error'); return; }
    const a = aR.actividad;
    const hist = hR.ok ? hR.historial : [];
    const u = APP.Auth.user();

    const puedeEstadoUsuario = (a.asignado_a === u.usuario) || APP.Auth.isJefeDepto() ||
      (APP.Auth.isJefeSeccion() && a.seccion === u.asignacion);
    const puedeEditar = APP.Auth.isJefeDepto() || (APP.Auth.isJefeSeccion() && a.seccion === u.asignacion);
    const puedeEliminar = APP.Auth.isJefeDepto();
    const puedeCancelar = puedeEditar;
    const finalizada = ['Reportada','Cancelada'].indexOf(a.estado) !== -1;

    let acciones = '';
    if (!finalizada && puedeEstadoUsuario) {
      if (a.estado === 'Recibida')    acciones += `<button class="btn warn" data-est="En curso">▶ Iniciar</button>`;
      if (a.estado === 'En curso')    acciones += `<button class="btn" data-est="Completada">✓ Marcar completada</button>`;
      if (a.estado === 'Completada')  acciones += `<button class="btn success" data-est="Reportada">📤 Reportar al Jefe</button>`;
      if (a.estado === 'Vencida')     acciones += `<button class="btn success" data-est="Reportada">📤 Reportar (extemporáneo)</button>`;
    }
    if (puedeEditar && !finalizada) acciones += `<button class="btn sec" id="btn-editar">Editar</button>`;
    if (puedeCancelar && !finalizada) acciones += `<button class="btn sec" id="btn-cancelar">Cancelar actividad</button>`;
    if (puedeEliminar) acciones += `<button class="btn danger" id="btn-eliminar">Eliminar</button>`;

    const html = `<div class="modal lg" onclick="event.stopPropagation()">
      <div class="mh">
        <h3>${APP.U.esc(a.titulo)} <span class="badge ${APP.U.estadoCls(a.estado)}" style="margin-left:8px">${APP.U.esc(a.estado)}</span></h3>
        <button class="x" onclick="APP.U.closeModal()">×</button>
      </div>
      <div class="mb">
        <div class="detalle-grid">
          <div class="dg"><span class="l">Sección</span><span class="v">${APP.U.esc(a.seccion)}</span></div>
          <div class="dg"><span class="l">Prioridad</span><span class="v"><span class="badge ${a.prioridad.toLowerCase()}">${APP.U.esc(a.prioridad)}</span></span></div>
          <div class="dg"><span class="l">Creado por</span><span class="v">${APP.U.esc(a.creado_por)}</span></div>
          <div class="dg"><span class="l">Asignado a</span><span class="v">${APP.U.esc(a.asignado_a)}</span></div>
          <div class="dg"><span class="l">Creada</span><span class="v">${APP.U.fmtFechaHora(a.fecha_creacion)}</span></div>
          <div class="dg"><span class="l">Vence</span><span class="v">${APP.U.fmtFechaHora(a.fecha_limite)}</span></div>
          ${a.fecha_reportada?`<div class="dg"><span class="l">Reportada</span><span class="v">${APP.U.fmtFechaHora(a.fecha_reportada)}</span></div>`:''}
          ${a.motivo_cancelacion?`<div class="dg"><span class="l">Motivo cancelación</span><span class="v">${APP.U.esc(a.motivo_cancelacion)}</span></div>`:''}
        </div>
        ${a.descripcion?`<div class="detalle-desc">${APP.U.esc(a.descripcion)}</div>`:''}
        ${a.reporte_texto?`<div class="detalle-reporte"><b>📤 Reporte:</b><br>${APP.U.esc(a.reporte_texto)}</div>`:''}

        <h3 style="margin-top:22px;margin-bottom:0;font-size:.95rem;font-weight:600">Historial</h3>
        <div class="timeline">
          ${hist.length ? hist.map(h => `
            <div class="tl-item">
              <div class="tl-acc">${APP.U.esc(h.accion)}</div>
              <div class="tl-meta">${APP.U.fmtFechaHora(h.fecha)} · ${APP.U.esc(h.usuario)}</div>
              ${h.detalle?`<div class="tl-det">${APP.U.esc(h.detalle)}</div>`:''}
            </div>`).join('') : '<div class="tl-item"><div class="tl-det">Sin movimientos</div></div>'}
        </div>
      </div>
      <div class="mf">${acciones || '<span style="color:var(--text-soft);font-size:.84rem">Sin acciones disponibles</span>'}</div>
    </div>`;
    APP.U.openModal(html);

    document.querySelectorAll('[data-est]').forEach(btn => {
      btn.onclick = () => APP.Views.ficha._cambiarEstado(a.id, btn.dataset.est);
    });
    const bE = document.getElementById('btn-editar');   if (bE) bE.onclick = () => APP.Views.ficha._editar(a, usrs);
    const bC = document.getElementById('btn-cancelar'); if (bC) bC.onclick = () => APP.Views.ficha._cancelar(a.id);
    const bD = document.getElementById('btn-eliminar'); if (bD) bD.onclick = () => APP.Views.ficha._eliminar(a.id);
  },

  _cambiarEstado: async function(id, estado){
    let reporte = '';
    if (estado === 'Reportada') {
      reporte = prompt('Texto del reporte para el Jefe (obligatorio):');
      if (!reporte) return;
    }
    const r = await APP.API.call('cambiar_estado', {id, estado, reporte_texto:reporte});
    if (!r.ok) { APP.U.toast(r.error,'error'); return; }
    APP.U.closeModal();
    APP.U.toast(estado === 'Reportada' ? 'Reportada al Jefe' : 'Estado actualizado','success');
    APP.Router.refresh();
  },

  _editar: async function(a, usrs){
    const filt = usrs.filter(u => u.activo && u.asignacion === a.seccion);
    const html = `<div class="modal" onclick="event.stopPropagation()">
      <div class="mh"><h3>Editar actividad</h3><button class="x" onclick="APP.U.closeModal()">×</button></div>
      <div class="mb">
        <label>Título</label><input id="ed-titulo" value="${APP.U.esc(a.titulo)}">
        <label>Descripción</label><textarea id="ed-desc">${APP.U.esc(a.descripcion)}</textarea>
        <div class="row3">
          <div><label>Asignado a</label><select id="ed-asig">${filt.map(u=>`<option value="${APP.U.esc(u.usuario)}" ${u.usuario===a.asignado_a?'selected':''}>${APP.U.esc((u.grado?u.grado+' ':'')+u.nombre)}</option>`).join('')}</select></div>
          <div><label>Prioridad</label><select id="ed-prio">${['Alta','Media','Baja'].map(p=>`<option ${p===a.prioridad?'selected':''}>${p}</option>`).join('')}</select></div>
          <div><label>Fecha límite</label><input type="datetime-local" id="ed-limite" value="${APP.U.fmtFechaInput(a.fecha_limite)}"></div>
        </div>
      </div>
      <div class="mf">
        <button class="btn sec" onclick="APP.U.closeModal()">Cancelar</button>
        <button class="btn" id="ed-guardar">Guardar</button>
      </div>
    </div>`;
    APP.U.openModal(html);
    document.getElementById('ed-guardar').onclick = async function(){
      const r = await APP.API.call('editar_actividad', {
        id: a.id,
        titulo: document.getElementById('ed-titulo').value.trim(),
        descripcion: document.getElementById('ed-desc').value.trim(),
        asignado_a: document.getElementById('ed-asig').value,
        prioridad: document.getElementById('ed-prio').value,
        fecha_limite: document.getElementById('ed-limite').value
      });
      if (!r.ok) { APP.U.toast(r.error,'error'); return; }
      APP.U.closeModal();
      APP.U.toast('Actualizada','success');
      APP.Router.refresh();
    };
  },

  _cancelar: async function(id){
    const motivo = prompt('Motivo de cancelación:');
    if (!motivo) return;
    const r = await APP.API.call('cancelar_actividad', {id, motivo});
    if (!r.ok) { APP.U.toast(r.error,'error'); return; }
    APP.U.closeModal();
    APP.U.toast('Actividad cancelada','warn');
    APP.Router.refresh();
  },

  _eliminar: async function(id){
    if (!APP.U.confirmar('¿Eliminar definitivamente esta actividad y su historial?')) return;
    const r = await APP.API.call('eliminar_actividad', {id});
    if (!r.ok) { APP.U.toast(r.error,'error'); return; }
    APP.U.closeModal();
    APP.U.toast('Eliminada','warn');
    APP.Router.refresh();
  }
};
