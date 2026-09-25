// ══════════════════════════════════════════════════════════════════
//  CUADERNOS — listar, crear, cambiar, borrar + guardado + arranque
// ══════════════════════════════════════════════════════════════════
//  Cada cuaderno es un documento separado: en Firestore para
//  usuarios con cuenta, en localStorage para invitados. Acá vive
//  toda la lógica de "biblioteca de cuadernos" (la barra lateral
//  #nb-sidebar) y el guardado automático con debounce (sched()).
//
//  Funciones principales:
//    loadNotebooksList()      → trae la lista de cuadernos del usuario
//    renderNbSidebar()        → dibuja la barra lateral
//    switchNotebook(id)       → cambia de cuaderno activo
//    openNbNewModal()/confirmCreateNotebook() → alta de cuaderno nuevo
//    deleteNotebook(id)       → borrado (con confirmación)
//    save() / sched()         → guardan S en la base y muestran el
//                                toast "Guardado" (debounced)
//    initApp()                → arranque: carga sesión, cuadernos, etc.
// ══════════════════════════════════════════════════════════════════

// ── NOTEBOOKS (Firestore para usuarios autenticados, localStorage para invitados) ──
async function loadNotebooks() {
  if (!currentUser) return;
  if (currentUser.guest) { loadNotebooksLocal(); return; }

  const { collection, getDocs, doc, setDoc } = window._fbFns;
  const db = window._fbDb;
  const colRef = collection(db, 'users', currentUser.uid, 'notebooks');
  const snap = await getDocs(colRef);
  let notebooks = snap.docs.map(d => ({ id: d.id, ...d.data().meta }));

  // crear el cuaderno por defecto si no existe
  if (!notebooks.find(n => n.id === 'default')) {
    const meta = { name: 'Mi Cuaderno', color: '#b87040' };
    await setDoc(doc(db, 'users', currentUser.uid, 'notebooks', 'default'), { meta, state: freshState() });
    notebooks.unshift({ id: 'default', ...meta });
  }

  _renderNbList(notebooks);
}

function loadNotebooksLocal() {
  if (!currentUser) return;
  const key = 'nb_notebooks_' + currentUser.name;
  let notebooks = JSON.parse(localStorage.getItem(key) || '[]');
  if (!notebooks.find(n => n.id === 'default')) {
    notebooks.unshift({ id: 'default', name: 'Mi Cuaderno', color: '#b87040' });
    localStorage.setItem(key, JSON.stringify(notebooks));
  }
  _renderNbList(notebooks);
}

function _renderNbList(notebooks) {
  const list = document.getElementById('nb-list');
  list.innerHTML = '';
  notebooks.forEach(nb => addNbItem(nb.id, nb.name, nb.color));
  document.getElementById('nb-btn').classList.add('visible');
}

function addNbItem(id, name, color) {
  const list = document.getElementById('nb-list');
  const div = document.createElement('div');
  div.className = 'nb-item' + (id === currentNotebookId ? ' active' : '');
  div.dataset.id = id;
  div.innerHTML = `<div class="nb-item-dot" style="background:${color}"></div><span class="nb-item-name">${name}</span><span class="nb-item-del" onclick="deleteNotebook('${id}',event)"><svg class="icon"><use href="#i-close"/></svg></span>`;
  div.onclick = () => switchNotebook(id);
  list.appendChild(div);
}

// ── MODAL NUEVO CUADERNO ──
let _nbNewType = '';
let _nbNewColor = '#b87040';

function openNbNewModal() {
  _nbNewType = '';
  _nbNewColor = '#b87040';
  document.getElementById('nb-new-name').value = '';
  document.querySelectorAll('.nb-type-opt').forEach(o => o.classList.toggle('on', o.dataset.type === ''));
  buildNbNewColors();
  document.getElementById('nb-new-modal').classList.add('open');
  toggleSidebar();
}

function closeNbNewModal() { document.getElementById('nb-new-modal').classList.remove('open'); }

function selectNbType(type, el) {
  _nbNewType = type;
  document.querySelectorAll('.nb-type-opt').forEach(o => o.classList.remove('on'));
  el.classList.add('on');
  // sugerir nombre según tipo
  const names = {'':'Mi Cuaderno','agenda':'Mi Agenda','album':'Mis Fotos','8bit':'Dev Notes','16bit':'Pixel World','libreta':'Mi Libreta','diario':'Mi Diario','sketch':'Sketchbook','recetas':'Mis Listas'};
  if (!document.getElementById('nb-new-name').value) document.getElementById('nb-new-name').value = names[type]||'';
}

function buildNbNewColors() {
  const row = document.getElementById('nb-new-colors');
  row.innerHTML = '';
  [...TAG_COLORS, '#b87040','#5a7a6a','#4a6080'].forEach(c => {
    const d = document.createElement('div');
    d.className = 'nb-color-sw' + (c === _nbNewColor ? ' on' : '');
    d.style.background = c;
    d.onclick = () => { _nbNewColor = c; document.querySelectorAll('.nb-color-sw').forEach(x=>x.classList.remove('on')); d.classList.add('on'); };
    row.appendChild(d);
  });
}

async function confirmCreateNotebook() {
  const name = document.getElementById('nb-new-name').value.trim() || 'Mi Cuaderno';
  const id = 'nb_' + Date.now();
  const color = _nbNewColor;
  const type = _nbNewType;
  const state = freshState();
  if (type) state.cover.theme = type;
  // poner color de tapa según tipo
  const themeColors = {'agenda':'#0d1520','album':'#1a1208','8bit':'#000000','16bit':'#1a0a2e','libreta':'#2a2010','diario':'#12080f','sketch':'#1a1610','recetas':'#0f1a10'};
  if (themeColors[type]) state.cover.color = themeColors[type];
  // attach diary PIN if pending
  if (window._pendingDiaryPin) { state.cover.diaryPin = window._pendingDiaryPin; window._pendingDiaryPin = null; }

  if (currentUser.guest) {
    const key = 'nb_notebooks_' + currentUser.name;
    const notebooks = JSON.parse(localStorage.getItem(key) || '[]');
    notebooks.push({ id, name, color, type });
    localStorage.setItem(key, JSON.stringify(notebooks));
    localStorage.setItem('nb_state_' + currentUser.name + '_' + id, JSON.stringify(state));
    loadNotebooksLocal();
  } else {
    const { doc, setDoc } = window._fbFns;
    await setDoc(doc(window._fbDb, 'users', currentUser.uid, 'notebooks', id), { meta: { name, color, type }, state });
    await loadNotebooks();
  }
  closeNbNewModal();
  toast2('Cuaderno creado');
  // ir al nuevo cuaderno automáticamente
  setTimeout(() => switchNotebook(id), 300);
}

async function createNotebook() { openNbNewModal(); }

async function switchNotebook(id) {
  sync(); await save();
  currentNotebookId = id;

  if (currentUser.guest) {
    const stateKey = 'nb_state_' + currentUser.name + (id === 'default' ? '' : '_' + id);
    S = JSON.parse(localStorage.getItem(stateKey) || 'null') || freshState();
  } else {
    const { doc, getDoc } = window._fbFns;
    const snap = await getDoc(doc(window._fbDb, 'users', currentUser.uid, 'notebooks', id));
    S = snap.exists() ? snap.data().state : freshState();
  }
  while (S.pages.length < TOTAL) S.pages.push(freshPage());

  // Restaurar última página, cerrar tapa
  cur = (S.lastPage && S.lastPage >= 0 && S.lastPage < TOTAL) ? S.lastPage : 0;
  const c = document.getElementById('cover');
  c.style.transition = 'none'; c.classList.remove('open'); c.style.pointerEvents = '';
  bookOpen = false;
  document.getElementById('close-btn').classList.remove('visible');
  document.getElementById('close-btn-label').classList.remove('visible');
  setTimeout(() => { c.style.transition = ''; }, 50);

  render(cur); applyCV(); applyTheme(S.cover.theme||''); await loadNotebooks(); toggleSidebar();
  toast2('Cuaderno cambiado');
}

async function deleteNotebook(id, e) {
  e.stopPropagation();
  if (id === 'default') { toast2('No podés borrar el cuaderno principal'); return; }
  if (!confirm('¿Borrar este cuaderno?')) return;

  if (currentUser.guest) {
    const key = 'nb_notebooks_' + currentUser.name;
    const notebooks = JSON.parse(localStorage.getItem(key) || '[]').filter(n => n.id !== id);
    localStorage.setItem(key, JSON.stringify(notebooks));
    localStorage.removeItem('nb_state_' + currentUser.name + '_' + id);
  } else {
    const { doc, deleteDoc } = window._fbFns;
    await deleteDoc(doc(window._fbDb, 'users', currentUser.uid, 'notebooks', id));
  }
  if (currentNotebookId === id) switchNotebook('default');
  else loadNotebooks();
}

function toggleSidebar() { document.getElementById('nb-sidebar').classList.toggle('open'); }

// ── SAVE ──
function sched() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 800); }

async function save() {
  if (!currentUser || !S) return;
  sync();
  if (currentUser.guest) {
    const stateKey = 'nb_state_' + currentUser.name + (currentNotebookId === 'default' ? '' : '_' + currentNotebookId);
    localStorage.setItem(stateKey, JSON.stringify(S));
    return;
  }
  try {
    const { doc, setDoc, getDoc } = window._fbFns;
    const db = window._fbDb;
    const ref = doc(db, 'users', currentUser.uid, 'notebooks', currentNotebookId);
    // conservar meta existente
    const snap = await getDoc(ref);
    const meta = snap.exists() ? snap.data().meta : { name: 'Mi Cuaderno', color: '#b87040' };
    await setDoc(ref, { meta, state: S });
    toast2('Guardado');
  } catch(e) {
    console.error('Error guardando en Firestore:', e);
  }
}

function sync() {
  if (!S) return;
  const pt = document.getElementById('page-text');
  S.pages[cur].html = pt.innerHTML;
  S.pages[cur].date = new Date().toLocaleDateString('es-AR',{weekday:'short',day:'numeric',month:'long'});
  const stickers = [];
  document.querySelectorAll('.sticker-el').forEach(el => stickers.push({emoji:el.dataset.e,left:el.style.left,top:el.style.top}));
  S.pages[cur].stickers = stickers;
  S.lastPage = cur; // guardar última página visitada
}

// ── INIT ──
function initApp() {
  if (!S) S = freshState();
  while (S.pages.length < TOTAL) S.pages.push(freshPage());
  applyCV(); applyTheme(S.cover.theme||''); buildStickerPicker(); buildSwatches(); buildGrads();

  // SIEMPRE empezar con la tapa cerrada
  const c = document.getElementById('cover');
  c.style.transition = 'none';
  c.classList.remove('open');
  c.style.pointerEvents = '';
  setTimeout(() => { c.style.transition = ''; }, 50);
  bookOpen = false;
  document.getElementById('close-btn').classList.remove('visible');
  document.getElementById('close-btn-label').classList.remove('visible');

  // Restaurar la última página visitada
  cur = (S.lastPage && S.lastPage >= 0 && S.lastPage < TOTAL) ? S.lastPage : 0;
  render(cur);
}
