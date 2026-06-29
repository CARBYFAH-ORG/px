/* =========================================================
   FA-2 ACTIVIDADES · Lista
   ========================================================= */
APP.Views.lista = {
  title:'Lista de actividades',
  _state: {estado:'', prioridad:'', asignado:'', seccion:'', desde:'', hasta:''},
  render: async function(cont){
    const u = APP.Auth.user();
    const [secs, usrs] = await Promise.all([
      APP.U.getSecciones(),
      (APP.Auth.isJefeDepto()||APP.Auth.isJefeSeccion()) ? APP.U.getUsuarios() : Promise.resolve([])
    ]);
    const st = this._state;

    let html = '<div class="filters">';
    html += '<div class="f"><label>Estado</label><select id="f-estado"><option value="">Todos</option>'+
      ['Recibida','En curso','Completada','Reportada','Vencida','Cancelada']
        .map(e=>`<option ${st.estado===e?'selected':''}>${e}</option>`).join('')+'</select></div>';
    html += '<div class="f"><label>Prioridad</label><select id="f-prio"><option value="">Todas</option>'+
      ['Alta','Media','Baja'].map(e=>`<option ${st.prioridad===e?'selected':''}>${e}</option>`).join('')+'</select></div>';
    if (APP.Auth.isJefeDepto()) {
      html += '<div class="f"><label>Sección</label><select id="f-seccion"><option value="">Todas</option>'+
        secs.map(s=>`<option value="${APP.U.esc(s.codigo)}" ${st.seccion===s.codigo?'selected':''}>${APP.U.esc(s.nombre)}</option>`).join('')+'</select></div>';
    }
    html += '<div class="f"><label>Desde</label><input type="date" id="f-desde" value="'+st.desde+'"></div>';
    html += '<div class="f"><label>Hasta</label><input type="date" id="f-hasta" value="'+st.hasta+'"></div>';
    html += '<button class="btn sec" id="f-clear">Limpiar</button>';
    html += '<div style="flex:1"></div>';
    if (APP.Auth.puedeCrear()) html += '<button class="btn" id="btn-nueva">+ Nueva actividad</button>';
    html += '<button class="btn sec" id="btn-export">Excel</button>';
    html += '</div>';

    html += '<div id="lista-tabla"></div>';
    cont.innerHTML = html;

    const self = this;
    const aplicar = () => {
      st.estado = document.getElementById('f-estado').value;
      st.prioridad = document.getElementById('f-prio').value;
      st.seccion = document.getElementById('f-seccion') ? document.getElementById('f-seccion').value : '';
      st.desde = document.getElementById('f-desde').value;
      st.hasta = document.getElementById('f-hasta').value;
      self.cargarTabla();
    };
    ['f-estado','f-prio','f-seccion','f-desde','f-hasta'].forEach(id => {
      const el = document.getElementById(id); if (el) el.onchange = aplicar;
    });
    document.getElementById('f-clear').onclick = () => {
      self._state = {estado:'',prioridad:'',asignado:'',seccion:'',desde:'',hasta:''};
      APP.Router.refresh();
    };
    const btnN = document.getElementById('btn-nueva');
    if (btnN) btnN.onclick = () => APP.Views.ficha.nueva();
    document.getElementById('btn-export').onclick = () => self.exportar();

    await this.cargarTabla();
  },

  cargarTabla: async function(){
    const st = this._state;
    const payload = {};
    if (st.estado) payload.estado = st.estado;
    if (st.seccion) payload.seccion = st.seccion;
    if (st.desde) payload.desde = st.desde;
    if (st.hasta) payload.hasta = st.hasta;
    const r = await APP.API.call('listar_actividades', payload);
    if (!r.ok) { document.getElementById('lista-tabla').innerHTML = '<div class="empty"><p>'+APP.U.esc(r.error)+'</p></div>'; return; }
    let acts = r.actividades;
    if (st.prioridad) acts = acts.filter(a => a.prioridad === st.prioridad);
    this._cache = acts;

    if (!acts.length) {
      document.getElementById('lista-tabla').innerHTML = '<div class="empty"><p>Sin actividades</p></div>';
      return;
    }

    acts.sort((a,b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    let html = '<div class="tbl-wrap"><table class="tbl"><thead><tr>';
    html += '<th>Título</th><th>Sección</th><th>Asignado</th><th>Prioridad</th><th>Estado</th><th>Vence</th><th>Creada</th>';
    html += '</tr></thead><tbody>';
    acts.forEach(a => {
      html += `<tr class="row-click" data-act-id="${APP.U.esc(a.id)}">
        <td><b>${APP.U.esc(a.titulo)}</b></td>
        <td>${APP.U.esc(a.seccion)}</td>
        <td>${APP.U.esc(a.asignado_a)}</td>
        <td><span class="badge ${a.prioridad.toLowerCase()}">${APP.U.esc(a.prioridad)}</span></td>
        <td><span class="badge ${APP.U.estadoCls(a.estado)}">${APP.U.esc(a.estado)}</span></td>
        <td>${APP.U.fmtFechaHora(a.fecha_limite)}</td>
        <td>${APP.U.fmtFecha(a.fecha_creacion)}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    document.getElementById('lista-tabla').innerHTML = html;

    document.querySelectorAll('[data-act-id]').forEach(el => {
      el.onclick = () => APP.Views.ficha.abrir(el.dataset.actId);
    });
  },

  exportar: function(){
    if (!this._cache || !this._cache.length) { APP.U.toast('Nada que exportar','warn'); return; }
    const rows = this._cache.map(a => ({
      ID: a.id, Titulo: a.titulo, Seccion: a.seccion,
      'Creado por': a.creado_por, 'Asignado a': a.asignado_a,
      Prioridad: a.prioridad, Estado: a.estado,
      'Creada': APP.U.fmtFechaHora(a.fecha_creacion),
      'Vence': APP.U.fmtFechaHora(a.fecha_limite),
      'Reportada': APP.U.fmtFechaHora(a.fecha_reportada),
      'Reporte': a.reporte_texto
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Actividades');
    XLSX.writeFile(wb, 'actividades_'+new Date().toISOString().slice(0,10)+'.xlsx');
  }
};
