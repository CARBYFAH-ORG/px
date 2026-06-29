/* =========================================================
   FA-2 ACTIVIDADES · Usuarios, Secciones, Configuración
   ========================================================= */
APP.Views.usuarios = {
  title:'Usuarios',
  render: async function(cont){
    if (!APP.Auth.isJefeDepto() && !APP.Auth.isJefeSeccion()) {
      cont.innerHTML = '<div class="empty"><p>Sin permiso</p></div>'; return;
    }
    const [r, secs] = await Promise.all([APP.API.call('listar_usuarios'), APP.U.getSecciones()]);
    if (!r.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(r.error)+'</p></div>'; return; }
    const usrs = r.usuarios;

    let html = '<div style="display:flex;justify-content:flex-end;margin-bottom:14px">';
    if (APP.Auth.isJefeDepto()) html += '<button class="btn" id="btn-nuevo-u">+ Nuevo usuario</button>';
    html += '</div>';
    html += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Usuario</th><th>Nombre</th><th>Grado</th><th>Sección</th><th>Rol</th><th>Activo</th><th></th></tr></thead><tbody>';
    usrs.forEach(u => {
      html += `<tr>
        <td><b>${APP.U.esc(u.usuario)}</b></td>
        <td>${APP.U.esc(u.nombre)}</td>
        <td>${APP.U.esc(u.grado)}</td>
        <td>${APP.U.esc(u.asignacion)||'<span style="color:var(--text-soft)">—</span>'}</td>
        <td><span class="badge ${u.rol==='jefe_depto'?'alta':u.rol==='jefe_seccion'?'media':'baja'}">${APP.U.esc(u.rol)}</span></td>
        <td>${u.activo?'<span class="badge reportada">Sí</span>':'<span class="badge vencida">No</span>'}</td>
        <td>${APP.Auth.isJefeDepto()?`<button class="btn sm sec" data-u="${APP.U.esc(u.usuario)}">Editar</button>`:''}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    cont.innerHTML = html;

    const btnN = document.getElementById('btn-nuevo-u');
    if (btnN) btnN.onclick = () => abrirFormUsuario(null, secs);
    document.querySelectorAll('[data-u]').forEach(b => {
      b.onclick = () => {
        const u = usrs.find(x => x.usuario === b.dataset.u);
        abrirFormUsuario(u, secs);
      };
    });
  }
};

function abrirFormUsuario(usr, secs){
  const isNew = !usr;
  const html = `<div class="modal" onclick="event.stopPropagation()">
    <div class="mh"><h3>${isNew?'Nuevo':'Editar'} usuario</h3><button class="x" onclick="APP.U.closeModal()">×</button></div>
    <div class="mb">
      <form autocomplete="off" onsubmit="return false">
      <input type="text" name="fake-user" autocomplete="username" style="display:none">
      <input type="password" name="fake-pass" autocomplete="new-password" style="display:none">
      <div class="row2">
        <div><label>Usuario *</label><input id="u-usuario" autocomplete="off" value="${APP.U.esc(usr?usr.usuario:'')}" ${isNew?'':'disabled'}></div>
        <div><label>${isNew?'Contraseña *':'Contraseña (vacío = sin cambio)'}</label><input id="u-pass" type="password" autocomplete="new-password" placeholder="${isNew?'mínimo 6':'••••••'}"></div>
      </div>
      <div class="row2">
        <div><label>Nombre *</label><input id="u-nombre" value="${APP.U.esc(usr?usr.nombre:'')}"></div>
        <div><label>Grado</label><input id="u-grado" value="${APP.U.esc(usr?usr.grado:'')}" placeholder="Cap, Sgto, etc"></div>
      </div>
      <div class="row2">
        <div><label>Asignación (Sección)</label>
          <select id="u-asig">
            <option value="">— Sin sección (solo jefe depto) —</option>
            ${secs.map(s => `<option value="${APP.U.esc(s.codigo)}" ${usr&&usr.asignacion===s.codigo?'selected':''}>${APP.U.esc(s.nombre)}</option>`).join('')}
          </select>
        </div>
        <div><label>Rol *</label>
          <select id="u-rol">
            <option value="usuario" ${usr&&usr.rol==='usuario'?'selected':''}>usuario</option>
            <option value="jefe_seccion" ${usr&&usr.rol==='jefe_seccion'?'selected':''}>jefe_seccion</option>
            <option value="jefe_depto" ${usr&&usr.rol==='jefe_depto'?'selected':''}>jefe_depto</option>
          </select>
        </div>
      </div>
      <div class="row2">
        <div><label>Teléfono WhatsApp (formato 504XXXXXXXX:APIKEY)</label><input id="u-tel" value="${APP.U.esc(usr?usr.telefono:'')}" placeholder="50499999999:123456"></div>
        <div><label>Activo</label><select id="u-act"><option value="true" ${!usr||usr.activo?'selected':''}>Sí</option><option value="false" ${usr&&!usr.activo?'selected':''}>No</option></select></div>
      </div>
      <p style="font-size:.74rem;color:var(--text-soft);margin-top:10px">
        El teléfono se usa para notificaciones diarias por WhatsApp a las 06:30. Formato: número (con código país sin +) seguido de dos puntos y la API key de CallMeBot. Dejar vacío para no recibir notificaciones.
      </p>
      </form>
    </div>
    <div class="mf">
      ${!isNew && usr.usuario !== 'admin' ? '<button class="btn danger" id="u-del">Eliminar</button>' : ''}
      ${!isNew ? '<button class="btn warn" id="u-reset">Reset contraseña</button>' : ''}
      <div style="flex:1"></div>
      <button class="btn sec" onclick="APP.U.closeModal()">Cancelar</button>
      <button class="btn" id="u-save">Guardar</button>
    </div>
  </div>`;
  APP.U.openModal(html);

  document.getElementById('u-save').onclick = async function(){
    const data = {
      usuario: document.getElementById('u-usuario').value.trim(),
      password: document.getElementById('u-pass').value,
      nombre: document.getElementById('u-nombre').value.trim(),
      grado: document.getElementById('u-grado').value.trim(),
      asignacion: document.getElementById('u-asig').value,
      rol: document.getElementById('u-rol').value,
      telefono: document.getElementById('u-tel').value.trim(),
      activo: document.getElementById('u-act').value === 'true'
    };
    let r;
    if (isNew) {
      if (!data.usuario || !data.password || !data.nombre) { APP.U.toast('Faltan campos','error'); return; }
      r = await APP.API.call('crear_usuario', data);
    } else {
      r = await APP.API.call('editar_usuario', data);
    }
    if (!r.ok) { APP.U.toast(r.error,'error'); return; }
    APP.U.invalidar('usuarios');
    APP.U.closeModal();
    APP.U.toast('Guardado','success');
    APP.Router.refresh();
  };

  const bD = document.getElementById('u-del');
  if (bD) bD.onclick = async function(){
    if (!APP.U.confirmar('¿Eliminar usuario '+usr.usuario+'?')) return;
    const r = await APP.API.call('eliminar_usuario', {usuario: usr.usuario});
    if (!r.ok) { APP.U.toast(r.error,'error'); return; }
    APP.U.invalidar('usuarios');
    APP.U.closeModal();
    APP.U.toast('Eliminado','warn');
    APP.Router.refresh();
  };

  const bR = document.getElementById('u-reset');
  if (bR) bR.onclick = async function(){
    const p = prompt('Nueva contraseña (mínimo 6):');
    if (!p || p.length < 6) return;
    const r = await APP.API.call('reset_password', {usuario: usr.usuario, password: p});
    if (!r.ok) { APP.U.toast(r.error,'error'); return; }
    APP.U.toast('Contraseña restablecida','success');
  };
}

// =========================================================
// SECCIONES
// =========================================================
APP.Views.secciones = {
  title:'Secciones',
  render: async function(cont){
    if (!APP.Auth.isJefeDepto()) { cont.innerHTML = '<div class="empty"><p>Sin permiso</p></div>'; return; }
    const secs = await APP.U.getSecciones(true);
    let html = '<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn" id="btn-ns">+ Nueva sección</button></div>';
    html += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Nombre</th><th>Activa</th><th></th></tr></thead><tbody>';
    secs.forEach(s => {
      html += `<tr>
        <td><b class="mono">${APP.U.esc(s.codigo)}</b></td>
        <td>${APP.U.esc(s.nombre)}</td>
        <td>${s.activo?'<span class="badge reportada">Sí</span>':'<span class="badge vencida">No</span>'}</td>
        <td>
          <button class="btn sm sec" data-edit="${APP.U.esc(s.codigo)}">Editar</button>
          <button class="btn sm danger" data-del="${APP.U.esc(s.codigo)}">Eliminar</button>
        </td>
      </tr>`;
    });
    if (!secs.length) html += '<tr><td colspan="4"><div class="empty"><p>Sin secciones</p></div></td></tr>';
    html += '</tbody></table></div>';
    cont.innerHTML = html;

    document.getElementById('btn-ns').onclick = () => formSeccion(null);
    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => formSeccion(secs.find(s=>s.codigo===b.dataset.edit)));
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!APP.U.confirmar('¿Eliminar sección '+b.dataset.del+'?')) return;
      const r = await APP.API.call('eliminar_seccion', {codigo: b.dataset.del});
      if (!r.ok) { APP.U.toast(r.error,'error'); return; }
      APP.U.invalidar('secciones');
      APP.U.toast('Eliminada','warn');
      APP.Router.refresh();
    });
  }
};

function formSeccion(s){
  const isNew = !s;
  const html = `<div class="modal" onclick="event.stopPropagation()">
    <div class="mh"><h3>${isNew?'Nueva':'Editar'} sección</h3><button class="x" onclick="APP.U.closeModal()">×</button></div>
    <div class="mb">
      <label>Código (corto, ej: ANL) *</label>
      <input id="s-cod" value="${APP.U.esc(s?s.codigo:'')}" ${isNew?'':'disabled'}>
      <label>Nombre *</label>
      <input id="s-nom" value="${APP.U.esc(s?s.nombre:'')}">
      ${isNew?'':`<label>Activa</label><select id="s-act"><option value="true" ${s.activo?'selected':''}>Sí</option><option value="false" ${!s.activo?'selected':''}>No</option></select>`}
    </div>
    <div class="mf">
      <button class="btn sec" onclick="APP.U.closeModal()">Cancelar</button>
      <button class="btn" id="s-save">Guardar</button>
    </div>
  </div>`;
  APP.U.openModal(html);
  document.getElementById('s-save').onclick = async function(){
    const data = {
      codigo: document.getElementById('s-cod').value.trim().toUpperCase(),
      nombre: document.getElementById('s-nom').value.trim()
    };
    if (!isNew) data.activo = document.getElementById('s-act').value === 'true';
    if (!data.codigo || !data.nombre) { APP.U.toast('Faltan campos','error'); return; }
    const r = await APP.API.call(isNew?'crear_seccion':'editar_seccion', data);
    if (!r.ok) { APP.U.toast(r.error,'error'); return; }
    APP.U.invalidar('secciones');
    APP.U.closeModal();
    APP.U.toast('Guardado','success');
    APP.Router.refresh();
  };
}

// =========================================================
// CONFIGURACIÓN PERSONAL (mi perfil / mi teléfono / URL backend)
// =========================================================
APP.Views.config = {
  title:'Configuración',
  render: async function(cont){
    const u = APP.Auth.user();
    const html = `
      <div class="panel">
        <h3>Mi perfil</h3>
        <div class="detalle-grid">
          <div class="dg"><span class="l">Usuario</span><span class="v">${APP.U.esc(u.usuario)}</span></div>
          <div class="dg"><span class="l">Nombre</span><span class="v">${APP.U.esc(u.nombre)}</span></div>
          <div class="dg"><span class="l">Grado</span><span class="v">${APP.U.esc(u.grado)||'—'}</span></div>
          <div class="dg"><span class="l">Asignación</span><span class="v">${APP.U.esc(u.asignacion)||'—'}</span></div>
          <div class="dg"><span class="l">Rol</span><span class="v">${APP.U.esc(u.rol)}</span></div>
        </div>
      </div>

      <div class="panel">
        <h3>Notificaciones WhatsApp (06:30 AM)</h3>
        <p style="font-size:.85rem;color:var(--text-dim);margin-bottom:12px">
          Para recibir un resumen diario por WhatsApp con tus pendientes:
        </p>
        <ol style="font-size:.85rem;color:var(--text-dim);margin:0 0 14px 20px;line-height:1.7">
          <li>Agrega el contacto <b>+34 644 51 95 23</b> a tu agenda como "CallMeBot".</li>
          <li>Desde tu WhatsApp, envíale el mensaje: <code>I allow callmebot to send me messages</code></li>
          <li>Recibirás una API key como respuesta.</li>
          <li>Pega abajo en formato: <code class="mono">TUNUMERO:APIKEY</code> (ej: <code class="mono">50499999999:123456</code>)</li>
        </ol>
        <label>Mi teléfono WhatsApp + API key</label>
        <input id="cfg-tel" value="${APP.U.esc(u.telefono)}" placeholder="50499999999:123456" style="width:100%;background:var(--card);border:1px solid var(--border);border-radius:9px;padding:10px 12px">
        <button class="btn" id="cfg-tel-save" style="margin-top:10px">Guardar teléfono</button>
      </div>

      <div class="panel">
        <h3>Cambiar contraseña</h3>
        <div class="row2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label>Contraseña actual</label><input type="password" id="cfg-p1" style="width:100%;background:var(--card);border:1px solid var(--border);border-radius:9px;padding:10px 12px"></div>
          <div><label>Contraseña nueva</label><input type="password" id="cfg-p2" style="width:100%;background:var(--card);border:1px solid var(--border);border-radius:9px;padding:10px 12px"></div>
        </div>
        <button class="btn" id="cfg-pass-save" style="margin-top:14px">Cambiar contraseña</button>
      </div>

      ${APP.Auth.isJefeDepto()?`
      <div class="panel">
        <h3>Backend</h3>
        <p style="font-size:.85rem;color:var(--text-dim);margin-bottom:10px">
          URL del Apps Script conectado. Para cambiarla hay que editar <code class="mono">js/api.js</code> en el repositorio.
        </p>
        <div style="background:var(--soft);border:1px solid var(--border);border-radius:9px;padding:10px 12px;font-family:monospace;font-size:.78rem;color:var(--text-dim);word-break:break-all">${APP.U.esc(API_URL)}</div>
      </div>`:''}
    `;
    cont.innerHTML = html;

    document.getElementById('cfg-tel-save').onclick = async function(){
      const tel = document.getElementById('cfg-tel').value.trim();
      const r = await APP.API.call('guardar_telefono', {telefono: tel});
      if (!r.ok) { APP.U.toast(r.error,'error'); return; }
      const s = APP.Auth.session(); s.user.telefono = tel; localStorage.setItem('fa2_act_session', JSON.stringify(s));
      APP.U.toast('Teléfono guardado','success');
    };

    document.getElementById('cfg-pass-save').onclick = async function(){
      const p1 = document.getElementById('cfg-p1').value;
      const p2 = document.getElementById('cfg-p2').value;
      if (!p1 || !p2) { APP.U.toast('Llena ambos campos','error'); return; }
      const r = await APP.API.call('cambiar_password', {password_actual:p1, password_nueva:p2});
      if (!r.ok) { APP.U.toast(r.error,'error'); return; }
      APP.U.toast('Contraseña cambiada, vuelve a entrar','success');
      setTimeout(()=>APP.Auth.logout(), 1500);
    };
  }
};
