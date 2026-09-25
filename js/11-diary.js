// ══════════════════════════════════════════════════════════════════
//  DIARIO ÍNTIMO — PIN de 4 dígitos + stickers de tapa
// ══════════════════════════════════════════════════════════════════
//    openDiaryLock()/closeDiaryLock() → pantalla numérica de PIN
//    setupDiaryPin()        → pide el PIN dos veces al crear el diario
//    openChpw()/confirmChpw() → cambiar el PIN desde el panel
//    addDiaryCoverSticker() → agrega un sticker (emoji) a la tapa del
//        diario; igual que STICKERS en 02-state.js, acá el emoji es
//        el contenido elegido por el usuario, no un ícono de interfaz.
// ══════════════════════════════════════════════════════════════════

// ── DIARY LOCK ──
let _dlkBuffer = '';
let _dlkCallback = null;
let _dlkMode = 'unlock'; // 'unlock' | 'setup'

function openDiaryLock(mode, titleText, subtitleText, cb) {
  _dlkBuffer = '';
  _dlkMode = mode;
  _dlkCallback = cb;
  document.getElementById('dlk-title').textContent = titleText || 'Diario íntimo';
  document.getElementById('dlk-subtitle').textContent = subtitleText || 'Ingresá el PIN de 4 dígitos';
  document.getElementById('dlk-err').textContent = '';
  document.getElementById('dlk-hint').style.display = (mode === 'unlock') ? 'block' : 'none';
  _dlkUpdateDots();
  document.getElementById('diary-lock-modal').classList.add('open');
}

function closeDiaryLock() {
  document.getElementById('diary-lock-modal').classList.remove('open');
  _dlkBuffer = '';
}

function _dlkUpdateDots() {
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('dlk-d'+i);
    d.classList.toggle('filled', i < _dlkBuffer.length);
  }
}

function dlkKey(ch) {
  if (_dlkBuffer.length >= 4) return;
  _dlkBuffer += ch;
  _dlkUpdateDots();
  document.getElementById('dlk-err').textContent = '';
  if (_dlkBuffer.length === 4) {
    setTimeout(() => {
      if (_dlkCallback) _dlkCallback(_dlkBuffer);
    }, 120);
  }
}

function dlkDel() {
  _dlkBuffer = _dlkBuffer.slice(0, -1);
  _dlkUpdateDots();
}

function dlkForgot() {
  if (confirm('¿Olvidaste el PIN?\n\nEsto borrará el PIN del diario y quedará sin contraseña. ¿Continuar?')) {
    if (S.cover) S.cover.diaryPin = null;
    sched();
    closeDiaryLock();
    toast2('PIN eliminado');
    openBook();
  }
}

// Verificar si hay que pedir PIN al abrir el cuaderno de tipo diario
const _origOpenBook = openBook;
function openBook() {
  if (S && S.cover && S.cover.theme === 'diario' && S.cover.diaryPin) {
    let attempts = 0;
    const tryUnlock = (pin) => {
      if (pin === S.cover.diaryPin) {
        closeDiaryLock();
        _realOpenBook();
      } else {
        attempts++;
        document.getElementById('dlk-err').textContent = attempts >= 3
          ? 'PIN incorrecto. Usá ¿Olvidaste el PIN?'
          : 'PIN incorrecto';
        _dlkBuffer = '';
        _dlkUpdateDots();
        // shake animation
        const box = document.querySelector('.dlk-dots');
        box.style.animation = 'dlk-shake .4s';
        setTimeout(() => box.style.animation = '', 400);
      }
    };
    openDiaryLock('unlock', S.cover.title || 'Diario íntimo', 'Ingresá tu PIN para abrir', tryUnlock);
  } else {
    _realOpenBook();
  }
}

function _realOpenBook() {
  const c = document.getElementById('cover');
  if(c.classList.contains('open')) return;
  c.classList.add('open'); bookOpen=true; c.style.pointerEvents='none';
  document.getElementById('close-btn').classList.add('visible');
  document.getElementById('close-btn-label').classList.add('visible');
  setTimeout(()=>{
    render(cur);
    applyTheme(S.cover.theme||'');
    if ((S.cover.theme||'') === 'agenda') {
      setTimeout(()=>openAgenda(), 400);
    }
  }, 500);
}

// ── DIARY: configurar PIN al crear ──
function setupDiaryPin(cb) {
  let firstPin = null;
  openDiaryLock('setup', 'Crear PIN del diario', 'Elegí un PIN de 4 dígitos', (pin1) => {
    firstPin = pin1;
    _dlkBuffer = '';
    _dlkUpdateDots();
    document.getElementById('dlk-subtitle').textContent = 'Repetí el PIN para confirmar';
    _dlkCallback = (pin2) => {
      if (pin1 === pin2) {
        closeDiaryLock();
        if (cb) cb(pin1);
      } else {
        document.getElementById('dlk-err').textContent = 'Los PINs no coinciden. Intentá de nuevo.';
        _dlkBuffer = '';
        _dlkUpdateDots();
        document.getElementById('dlk-subtitle').textContent = 'Elegí un PIN de 4 dígitos';
        _dlkCallback = (p) => {
          firstPin = p;
          _dlkBuffer = '';
          _dlkUpdateDots();
          document.getElementById('dlk-subtitle').textContent = 'Repetí el PIN para confirmar';
          _dlkCallback = (p2) => {
            if (p === p2) { closeDiaryLock(); if (cb) cb(p); }
            else { document.getElementById('dlk-err').textContent = 'No coinciden. Cerrando.'; setTimeout(closeDiaryLock, 1200); }
          };
        };
      }
    };
  });
}

// ── CHANGE PIN MODAL ──
function openChpw() {
  document.getElementById('chpw-old').value='';
  document.getElementById('chpw-new').value='';
  document.getElementById('chpw-new2').value='';
  document.getElementById('chpw-err').textContent='';
  document.getElementById('chpw-modal').classList.add('open');
}
function closeChpw() { document.getElementById('chpw-modal').classList.remove('open'); }
function confirmChpw() {
  const old = document.getElementById('chpw-old').value;
  const n1 = document.getElementById('chpw-new').value;
  const n2 = document.getElementById('chpw-new2').value;
  const err = document.getElementById('chpw-err');
  if (S.cover.diaryPin && old !== S.cover.diaryPin) { err.textContent='PIN actual incorrecto.'; return; }
  if (!/^\d{4}$/.test(n1)) { err.textContent='El PIN debe ser 4 dígitos numéricos.'; return; }
  if (n1 !== n2) { err.textContent='Los PINs nuevos no coinciden.'; return; }
  S.cover.diaryPin = n1;
  sched();
  closeChpw();
  toast2('PIN actualizado');
}

// ── DIARY COVER STICKERS ──
function addDiaryCoverSticker(emoji) {
  emoji = (emoji||'').trim();
  if (!emoji) { toast2('Escribí un emoji primero'); return; }
  if (!S.cover.diaryStickers) S.cover.diaryStickers = [];
  const sticker = { emoji, x: (20 + Math.random()*60).toFixed(1)+'%', y: (10 + Math.random()*70).toFixed(1)+'%' };
  S.cover.diaryStickers.push(sticker);
  renderDiaryCoverStickers();
  sched();
  const inp = document.getElementById('diary-cv-emoji-inp');
  if (inp) inp.value = '';
}

function renderDiaryCoverStickers() {
  // Remove old ones
  document.querySelectorAll('.diary-cv-sticker').forEach(el => el.remove());
  if (!S || !S.cover || !S.cover.diaryStickers) return;
  const cover = document.getElementById('cover');
  S.cover.diaryStickers.forEach((st, i) => {
    const el = document.createElement('div');
    el.className = 'diary-cv-sticker';
    el.textContent = st.emoji;
    el.style.left = st.x;
    el.style.top = st.y;
    const del = document.createElement('div');
    del.className = 'dcvs-del';
    del.innerHTML = '<svg class="icon"><use href="#i-close"/></svg>';
    del.onclick = (e) => { e.stopPropagation(); S.cover.diaryStickers.splice(i, 1); renderDiaryCoverStickers(); sched(); };
    el.appendChild(del);
    // drag
    el.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('dcvs-del')) return;
      e.preventDefault(); e.stopPropagation();
      const cr = cover.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      const ox = e.clientX - er.left, oy = e.clientY - er.top;
      function mv(ev) {
        const nx = ((ev.clientX - cr.left - ox) / cr.width * 100).toFixed(1) + '%';
        const ny = ((ev.clientY - cr.top - oy) / cr.height * 100).toFixed(1) + '%';
        el.style.left = nx; el.style.top = ny;
        S.cover.diaryStickers[i].x = nx; S.cover.diaryStickers[i].y = ny;
      }
      function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); sched(); }
      document.addEventListener('mousemove', mv);
      document.addEventListener('mouseup', up);
    });
    cover.appendChild(el);
  });
}

// Override confirmCreateNotebook to ask for PIN when creating a diario
const _origConfirmCreateNotebook = window.confirmCreateNotebook || confirmCreateNotebook;
window.confirmCreateNotebook = async function() {
  const type = _nbNewType;
  if (type === 'diario') {
    setupDiaryPin((pin) => {
      window._pendingDiaryPin = pin;
      _origConfirmCreateNotebook();
    });
  } else {
    window._pendingDiaryPin = null;
    await _origConfirmCreateNotebook();
  }
};

// Shake animation keyframe injection
const _dlkStyle = document.createElement('style');
_dlkStyle.textContent = '@keyframes dlk-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}';
document.head.appendChild(_dlkStyle);