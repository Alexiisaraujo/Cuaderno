// ══════════════════════════════════════════════════════════════════
//  UTILIDADES GENERALES
// ══════════════════════════════════════════════════════════════════
//  Este archivo se carga PRIMERO porque el resto de los módulos
//  (auth, notebooks, book, diary, etc.) llaman a toast2() para
//  mostrar avisos cortos ("Guardado", "PIN actualizado", ...).
//
//  NOTA DE LA REVISIÓN: en el archivo original, la función toast2()
//  se llamaba 19 veces en distintos lugares pero nunca estaba
//  definida en ningún lado. Eso significa que cada vez que el código
//  intentaba mostrar un aviso, JavaScript tiraba un error silencioso
//  (ReferenceError) en la consola y el cartel de abajo (#toast) nunca
//  llegaba a aparecer, aunque el CSS para animarlo ya estaba listo.
//  Se agrega acá la implementación real usando el elemento #toast
//  que ya existe en el HTML.
// ══════════════════════════════════════════════════════════════════

let _toastTimer = null;

/**
 * Muestra un aviso breve en la parte inferior de la pantalla.
 * @param {string} msg  Texto a mostrar (sin emojis: el estilo de
 *                       toda la app usa solo texto + íconos SVG).
 * @param {number} [ms]  Milisegundos que queda visible (por defecto 1800).
 */
function toast2(msg, ms) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), ms || 1800);
}
