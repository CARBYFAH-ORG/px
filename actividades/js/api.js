/* =========================================================
   FA-2 ACTIVIDADES · API client
   Para cambiar el backend: editar solo API_URL aquí abajo.
   ========================================================= */
window.APP = window.APP || {};

// ▼ Cambia esta URL cada vez que redespliegues el Apps Script ▼
const API_URL = 'https://script.google.com/macros/s/AKfycbymUdriw8CKyJwjgScvr86cCMCAqhiQAj6GGf2qU67iGb5ajWy-N7jVnKRVfKyKq60Wow/exec';

APP.API = (function () {

  /**
   * Llama al backend Apps Script.
   * @param {string} action  - nombre de la acción en ACTIONS
   * @param {object} payload - campos adicionales
   */
  async function call(action, payload) {
    const body = Object.assign({ action }, payload || {});

    // Adjuntar sesión activa si existe (claves separadas para no chocar
    // con payloads que también usan "usuario", ej. crear_usuario,
    // editar_usuario, eliminar_usuario, reset_password)
    const ses = APP.Auth && APP.Auth.session();
    if (ses) {
      body._ses_usuario = ses.usuario;
      body._ses_token   = ses.token;
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow'
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { ok: false, error: 'Error de red: ' + e.message };
    }
  }

  return { call };
})();
