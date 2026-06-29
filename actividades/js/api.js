/* =========================================================
   FA-2 ACTIVIDADES · API client
   ========================================================= */
window.APP = window.APP || {};

// URL del backend Apps Script (cambiar aquí si se redespliega con nueva URL)
const API_URL = "https://script.google.com/macros/s/AKfycbwb78E2mWcmaW3q2Rpf1J9J_hhMbHup-w0H5y-_LlGuS6NKtNMY5sEksHkM5VZBq2InXw/exec";

APP.API = (function(){
  async function call(action, payload){
    const body = Object.assign({action}, payload||{});
    const ses = APP.Auth && APP.Auth.session();
    if (ses) { body.usuario = ses.usuario; body.token = ses.token; }
    try {
      const res = await fetch(API_URL, {
        method:'POST',
        body: JSON.stringify(body),
        headers: {'Content-Type':'text/plain;charset=utf-8'},
        redirect:'follow'
      });
      return await res.json();
    } catch(e) {
      return {ok:false, error:'Error de conexión: '+e.message};
    }
  }
  return { call };
})();
