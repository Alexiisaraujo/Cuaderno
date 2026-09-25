// ══════════════════════════════════════════════════════════════════
//  PANEL DE CONFIGURACIÓN + MODAL "PERSONALIZAR TAPA" + RESALTADOR
// ══════════════════════════════════════════════════════════════════
//    togglePanel()        → abre/cierra el panel lateral de ajustes
//    openCM()/closeCM()   → modal de tapa (color, tema, imágenes)
//    setTheme()           → aplica uno de los 8 temas de cuaderno
//    toggleHLBar()/applyHL() → resaltador de texto flotante
// ══════════════════════════════════════════════════════════════════

// ── PANEL ──
function togglePanel() { document.getElementById('panel').classList.toggle('open'); }

// ── COVER MODAL ──
function openCM() {
  const cv = S.cover;
  document.getElementById('cmt').value = cv.title||'';
  document.getElementById('cms').value = cv.sub||'';
  document.getElementById('cv-opa').value = cv.opa||32;
  document.getElementById('cv-opa-val').textContent = (cv.opa||32)+'%';
  document.getElementById('cv-img-size').value = cv.imgSize||100;
  document.getElementById('cv-size-val').textContent = (cv.imgSize||100)+'%';
  document.getElementById('cv-img-x').value = cv.imgX||50;
  document.getElementById('cv-x-val').textContent = (cv.imgX||50)+'%';
  document.getElementById('cv-img-y').value = cv.imgY||50;
  document.getElementById('cv-y-val').textContent = (cv.imgY||50)+'%';
  const fit = cv.imgFit||'cover';
  ['cover','contain','fill'].forEach(f=>{document.getElementById('cvfit-'+f).classList.toggle('on',f===fit);});
  // slideshow thumbs
  renderSlideThumbs();
  const speedRow = document.getElementById('cv-slide-speed-row');
  if (speedRow) {
    speedRow.style.display = (cv.slides && cv.slides.length > 1) ? 'flex' : 'none';
    document.getElementById('cv-slide-speed').value = cv.slideSpeed || 5;
    document.getElementById('cv-speed-val').textContent = (cv.slideSpeed || 5) + 's';
  }
  const hasImg = (cv.slides && cv.slides.length) || cv.img;
  document.getElementById('cv-img-controls').classList.toggle('visible', !!hasImg);
  document.querySelectorAll('.theme-opt').forEach(t=>t.classList.toggle('on', t.dataset.theme===(S.cover.theme||'')));
  // show diary section if theme is diario
  const diarySec = document.getElementById('diary-cover-section');
  if (diarySec) diarySec.style.display = (S.cover.theme === 'diario') ? 'block' : 'none';
  document.getElementById('cm').classList.add('open');
}
function closeCM() { document.getElementById('cm').classList.remove('open'); }

function livePreviewCover() {
  const opa = document.getElementById('cv-opa').value;
  const size = document.getElementById('cv-img-size').value;
  const x = document.getElementById('cv-img-x').value;
  const y = document.getElementById('cv-img-y').value;
  document.getElementById('cv-opa-val').textContent = opa+'%';
  document.getElementById('cv-size-val').textContent = size+'%';
  document.getElementById('cv-x-val').textContent = x+'%';
  document.getElementById('cv-y-val').textContent = y+'%';
  const img = document.getElementById('cv-img');
  const fit = S.cover.imgFit||'cover';
  img.style.opacity = opa/100;
  img.style.objectFit = fit;
  img.style.objectPosition = x+'% '+y+'%';
  if (fit==='cover'||fit==='fill') { img.style.width=size+'%'; img.style.height=size+'%'; img.style.left='0'; img.style.top='0'; img.style.transform='none'; img.style.maxWidth='none'; img.style.maxHeight='none'; }
  else { img.style.width='auto'; img.style.height='auto'; img.style.maxWidth=size+'%'; img.style.maxHeight=size+'%'; img.style.left='50%'; img.style.top='50%'; img.style.transform='translate(-50%,-50%)'; }
}

function setCvFit(fit,btn) {
  S.cover.imgFit=fit;
  ['cover','contain','fill'].forEach(f=>document.getElementById('cvfit-'+f).classList.remove('on'));
  btn.classList.add('on');
  livePreviewCover();
}

function previewImg(inp) {
  const file=inp.files[0]; if(!file)return;
  const pr=document.getElementById('cv-img-preview');
  const reader=new FileReader();
  reader.onload=e=>{
    pr.src=e.target.result; pr.style.display='block';
    document.getElementById('cv-img-controls').classList.add('visible');
    S.cover.img=e.target.result;
    document.getElementById('cv-img').src=e.target.result;
    document.getElementById('cv-img').style.display='block';
    livePreviewCover();
  };
  reader.readAsDataURL(file);
}

function applyCover() {
  S.cover.title=document.getElementById('cmt').value||'Mi Cuaderno';
  S.cover.sub=document.getElementById('cms').value||'';
  S.cover.opa=parseInt(document.getElementById('cv-opa').value);
  S.cover.imgSize=parseInt(document.getElementById('cv-img-size').value);
  S.cover.imgX=parseInt(document.getElementById('cv-img-x').value);
  S.cover.imgY=parseInt(document.getElementById('cv-img-y').value);
  applyCV(); sched(); closeCM();
}

function removeCoverImg() {
  S.cover.img='';
  S.cover.slides=[];
  stopSlideshow();
  document.getElementById('cv-img-controls').classList.remove('visible');
  document.getElementById('cv-slide-speed-row').style.display='none';
  renderSlideThumbs();
  applyCV(); sched();
}

function setTheme(theme,btn) {
  S.cover.theme=theme;
  document.querySelectorAll('.theme-opt').forEach(t=>t.classList.remove('on'));
  btn.classList.add('on');
  applyTheme(theme);
  const diarySec = document.getElementById('diary-cover-section');
  if (diarySec) diarySec.style.display = (theme === 'diario') ? 'block' : 'none';
  sched();
}

function applyTheme(theme) {
  document.body.className=document.body.className.replace(/theme-\S+/g,'').trim();
  if(theme) document.body.classList.add('theme-'+theme);
  const ph={'8bit':'> ESCRIBE AQUI_','16bit':'// INSERT COIN TO CONTINUE_','album':'Tocá + para agregar fotos...','agenda':'Actividades del día...','libreta':'Notas...','diario':'Querido diario...','sketch':'Dibujá o escribí libremente...','recetas':'[ ] Nueva tarea o ingrediente...','':'Empezá a escribir...'};
  document.getElementById('page-text').dataset.ph=ph[theme]||ph[''];

  // Remover elementos especiales anteriores
  const prevAlbumBtn = document.getElementById('album-upload-btn');
  if (prevAlbumBtn) prevAlbumBtn.remove();
  const prevDiaryHeader = document.getElementById('diary-date-header');
  if (prevDiaryHeader) prevDiaryHeader.remove();

  // ÁLBUM: agregar botón de subir fotos en la hoja
  if (theme === 'album') {
    const btn = document.createElement('div');
    btn.id = 'album-upload-btn';
    btn.innerHTML = '<svg class="icon"><use href="#i-camera"/></svg> Agregar fotos';
    btn.style.cssText = 'position:absolute;bottom:44px;left:62px;background:rgba(184,112,64,.15);border:1.5px dashed rgba(184,112,64,.4);color:#b87040;border-radius:10px;padding:8px 16px;font-size:.78rem;font-family:\'DM Sans\',sans-serif;cursor:pointer;z-index:5;transition:all .2s;';
    btn.onmouseover = () => btn.style.background = 'rgba(184,112,64,.28)';
    btn.onmouseout = () => btn.style.background = 'rgba(184,112,64,.15)';
    btn.onclick = () => insMultipleImgs();
    document.getElementById('page').appendChild(btn);
  }

  // DIARIO: insertar fecha automática al principio si la página está vacía
  if (theme === 'diario') {
    const pt = document.getElementById('page-text');
    if (!pt.innerHTML.trim()) {
      const now = new Date();
      const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
      pt.innerHTML = `<div style="color:rgba(160,60,140,.5);font-style:italic;font-size:.85em;margin-bottom:8px;border-bottom:1px solid rgba(200,100,180,.2);padding-bottom:6px;">${dateStr}</div><div><br></div>`;
      const range = document.createRange();
      const lastDiv = pt.querySelector('div:last-child');
      if (lastDiv) { range.setStart(lastDiv, 0); range.collapse(true); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
    }
    // render cover stickers
    renderDiaryCoverStickers();
  } else {
    // remove diary cover stickers if theme changed
    document.querySelectorAll('.diary-cv-sticker').forEach(el => el.remove());
  }

  // RECETAS/LISTAS: toolbar de checkbox al insertar nueva línea
  const existingCbBtn = document.getElementById('cb-insert-btn');
  if (existingCbBtn) existingCbBtn.remove();
  if (theme === 'recetas') {
    const cb = document.createElement('div');
    cb.id = 'cb-insert-btn';
    cb.innerHTML = '<svg class="icon"><use href="#i-checkbox"/></svg> Insertar checkbox';
    cb.style.cssText = 'position:absolute;bottom:44px;left:62px;background:rgba(80,160,80,.12);border:1.5px dashed rgba(80,160,80,.35);color:#50a050;border-radius:10px;padding:8px 16px;font-size:.78rem;font-family:\'DM Sans\',sans-serif;cursor:pointer;z-index:5;transition:all .2s;';
    cb.onmouseover = () => cb.style.background = 'rgba(80,160,80,.22)';
    cb.onmouseout = () => cb.style.background = 'rgba(80,160,80,.12)';
    cb.onclick = () => insertCheckbox();
    document.getElementById('page').appendChild(cb);
  }
}

// ── HIGHLIGHT ──
function setHL(color) { if(color) document.execCommand('backColor',false,color); else document.execCommand('removeFormat',false,null); }

// ── FLOATING HIGHLIGHTER ──
let _hlSavedSel=null;

function toggleHLBar() {
  const bar=document.getElementById('hl-bar');
  const sel=window.getSelection();
  if(!sel||sel.isCollapsed){toast2('Seleccioná texto primero');return;}
  _hlSavedSel=sel.getRangeAt(0).cloneRange();
  const rect=sel.getRangeAt(0).getBoundingClientRect();
  bar.style.left=Math.min(rect.left,window.innerWidth-240)+'px';
  bar.style.top=Math.max(rect.top-50,8)+'px';
  bar.classList.add('visible');
}

function applyHL(color) {
  const bar=document.getElementById('hl-bar');
  bar.classList.remove('visible');
  if(_hlSavedSel){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(_hlSavedSel);_hlSavedSel=null;}
  if(color) document.execCommand('backColor',false,color);
  else document.execCommand('removeFormat',false,null);
  sched();
}

document.addEventListener('mousedown',e=>{
  const bar=document.getElementById('hl-bar');
  if(bar&&bar.classList.contains('visible')&&!bar.contains(e.target)) bar.classList.remove('visible');
});
