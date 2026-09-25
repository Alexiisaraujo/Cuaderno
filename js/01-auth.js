// ══════════════════════════════════════════════════════════════════
//  AUTENTICACIÓN
// ══════════════════════════════════════════════════════════════════
//  Login/registro propio (usuario + contraseña), SIN usar Firebase
//  Authentication: las cuentas se guardan a mano en Firestore, en la
//  colección "accounts" (el id de cada documento es el nombre de
//  usuario en minúsculas). Incluye también el auto-login: si el
//  usuario ya iniciÓ sesión antes, se reconecta solo al abrir la app.
//
//  Funciones principales:
//    simpleHash(str)   → "hashea" la contraseña antes de guardarla
//                        (no es un hash criptográfico fuerte — ver
//                        nota de seguridad en el README).
//    switchTab(tab)    → cambia entre pestaña "Iniciar sesión"/"Registrarme"
//    doLogin()         → valida usuario/contraseña contra Firestore
//    doLogout()        → cierra sesión y vuelve a la pantalla de login
//    enterGuest()      → entra sin cuenta (todo se guarda en localStorage)
// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
//  AUTH — Usuario + contraseña, sin Firebase Auth
//  Las cuentas se guardan en Firestore: collection "accounts"
//  doc id = nombre de usuario (lowercase)
// ══════════════════════════════════════════════════════
let currentUser = null;
let loginMode = 'login';

function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return (h >>> 0).toString(36);
}

function switchTab(tab) {
  loginMode = tab;
  document.getElementById('tab-login').classList.toggle('on', tab==='login');
  document.getElementById('tab-reg').classList.toggle('on', tab==='reg');
  document.getElementById('l-pass2-wrap').style.display = tab==='reg' ? 'flex' : 'none';
  document.getElementById('l-btn').textContent = tab==='login' ? 'Entrar →' : 'Crear cuenta →';
  document.getElementById('l-err').textContent = '';
}

async function doLogin() {
  const username = document.getElementById('l-user').value.trim().toLowerCase().replace(/\s+/g,'_');
  const pass     = document.getElementById('l-pass').value;
  const err      = document.getElementById('l-err');
  err.style.color = '#e74c3c';

  if (!username || !pass) { err.textContent = 'Completá usuario y contraseña.'; return; }
  if (!/^[a-z0-9_]{2,20}$/.test(username)) { err.textContent = 'Usuario: solo letras, números y _ (2-20 caracteres).'; return; }

  // esperar Firebase listo
  if (!window._fbDb || !window._fbFns) { err.textContent = 'Conectando... intentá de nuevo.'; return; }

  const { doc, getDoc, setDoc } = window._fbFns;
  const db = window._fbDb;

  try {
    if (loginMode === 'reg') {
      const pass2 = document.getElementById('l-pass2').value;
      if (pass !== pass2) { err.textContent = 'Las contraseñas no coinciden.'; return; }
      if (pass.length < 4) { err.textContent = 'La contraseña debe tener al menos 4 caracteres.'; return; }

      const snap = await getDoc(doc(db, 'accounts', username));
      if (snap.exists()) { err.textContent = 'Ese usuario ya existe. Iniciá sesión.'; return; }

      await setDoc(doc(db, 'accounts', username), { hash: simpleHash(pass), created: Date.now() });
      err.style.color = '#2ecc71';
      err.textContent = 'Cuenta creada. Entrando...';
      setTimeout(() => enterUser(username), 600);

    } else {
      const snap = await getDoc(doc(db, 'accounts', username));
      if (!snap.exists()) { err.textContent = 'Usuario no encontrado. ¿Querés registrarte?'; return; }
      if (snap.data().hash !== simpleHash(pass)) { err.textContent = 'Contraseña incorrecta.'; return; }
      enterUser(username);
    }
  } catch(e) {
    err.textContent = 'Error de conexión. Verificá tu internet.';
    console.error(e);
  }
}

function enterGuest() {
  currentUser = { name: 'invitado_' + Date.now(), uid: null, guest: true };
  document.getElementById('login-screen').style.display = 'none';
  showUserPill(currentUser.name, true);
  S = freshState();
  while (S.pages.length < TOTAL) S.pages.push(freshPage());
  loadNotebooksLocal();
  initApp();
}

function enterUser(username) {
  currentUser = { name: username, uid: username, guest: false };
  localStorage.setItem('nb_session_v2', JSON.stringify({ name: username, ts: Date.now() }));
  document.getElementById('login-screen').style.display = 'none';
  showUserPill(username, false);
  loadUserData();
}

function showUserPill(name, guest) {
  const pill = document.getElementById('user-pill');
  pill.classList.add('visible');
  document.getElementById('user-avatar-initials').innerHTML = guest ? '<svg class="icon"><use href="#i-user"/></svg>' : name.slice(0,2).toUpperCase();
  document.getElementById('user-name').textContent = guest ? 'Invitado' : name;
}

async function doLogout() {
  sync(); await save();
  currentUser = null;
  localStorage.removeItem('nb_session_v2');
  document.getElementById('user-pill').classList.remove('visible');
  document.getElementById('close-btn').classList.remove('visible');
  document.getElementById('close-btn-label').classList.remove('visible');
  document.getElementById('nb-btn').classList.remove('visible');
  const c = document.getElementById('cover');
  c.style.transition = 'none'; c.classList.remove('open');
  setTimeout(() => c.style.transition = '', 50);
  bookOpen = false;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('l-user').value = '';
  document.getElementById('l-pass').value = '';
  document.getElementById('l-err').textContent = '';
}

async function loadUserData() {
  if (!currentUser) return;
  if (currentUser.guest) { S = freshState(); while(S.pages.length<TOTAL) S.pages.push(freshPage()); loadNotebooksLocal(); initApp(); return; }
  const { doc, getDoc } = window._fbFns;
  const snap = await getDoc(doc(window._fbDb, 'users', currentUser.uid, 'notebooks', 'default'));
  S = snap.exists() ? snap.data().state : freshState();
  while (S.pages.length < TOTAL) S.pages.push(freshPage());
  await loadNotebooks();
  initApp();
}

// ── AUTO LOGIN por sesión guardada ──
function waitForFirebase(cb, attempts = 0) {
  if (window._fbDb && window._fbFns) { cb(); }
  else if (attempts < 60) { setTimeout(() => waitForFirebase(cb, attempts + 1), 100); }
}
waitForFirebase(() => {
  const session = JSON.parse(localStorage.getItem('nb_session_v2') || 'null');
  if (session && session.ts && (Date.now() - session.ts) < 7 * 24 * 60 * 60 * 1000) {
    enterUser(session.name);
  } else {
    document.getElementById('login-screen').style.display = 'flex';
  }
});
