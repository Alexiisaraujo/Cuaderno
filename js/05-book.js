// ══════════════════════════════════════════════════════════════════
//  EL LIBRO — abrir/cerrar, animación de paso de página, tapa, fuente
// ══════════════════════════════════════════════════════════════════
//    openBook()/_realOpenBook()/closeBook() → apertura y cierre;
//        si el cuaderno es de tipo "diario" con PIN, pide el PIN antes
//        de abrir (ver 11-diary.js) usando la función openDiaryLock().
//    flip()                  → animación de vuelta de página
//    applyCover()/livePreviewCover() → colores/tema de la tapa
//    setFont()/setSz()/setInk() → tipografía, tamaño y color del texto
//    addBookmark()/clearBookmarks() → marcadores de página
//    placeSticker()           → coloca un sticker (emoji) en la página
// ══════════════════════════════════════════════════════════════════

// ── BOOK ──
function _realOpenBook() {
  const c=document.getElementById('cover');
  if(c.classList.contains('open')) return;
  c.classList.add('open'); bookOpen=true; c.style.pointerEvents='none';
  document.getElementById('close-btn').classList.add('visible');
  document.getElementById('close-btn-label').classList.add('visible');
  setTimeout(()=>{
    render(cur);
    applyTheme(S.cover.theme||'');
    // Si es cuaderno tipo agenda, abrir el panel de agenda automáticamente
    if ((S.cover.theme||'') === 'agenda') {
      setTimeout(()=>openAgenda(), 400);
    }
  }, 500);
}
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
function closeBook() { const c=document.getElementById('cover'); c.classList.remove('open'); c.classList.add('closing'); bookOpen=false; sync(); S.lastPage=cur; save(); setTimeout(()=>{c.style.pointerEvents='';c.classList.remove('closing');},950); document.getElementById('close-btn').classList.remove('visible'); document.getElementById('close-btn-label').classList.remove('visible'); }

// ── FLIP ──
function flip(dir) { const f=document.getElementById('flip'); f.style.display='block'; f.classList.remove('fwd','bck'); f.classList.add(dir>0?'fwd':'bck'); setTimeout(()=>{f.style.display='none';f.classList.remove('fwd','bck');render(cur);applyTheme(S.cover.theme||'');},680); }
function nxt() { if(!bookOpen||cur>=TOTAL-1) return; sync(); cur++; flip(1); }
function prev() { if(!bookOpen||cur<=0) return; sync(); cur--; flip(-1); }

// ── COVER ──
function applyCV() {
  if(!S) return;
  const cv=S.cover;
  const cover=document.getElementById('cover');
  if(cv.grad){cover.style.background=cv.grad;}else{cover.style.background=cv.color||'#2d4a3e';}
  document.getElementById('cv-title').textContent=cv.title||'Mi Cuaderno';
  document.getElementById('cv-sub').textContent=cv.sub||'Notas & Ideas';
  document.getElementById('spine').querySelector('span').textContent=cv.title||'cuaderno';
  // Diary stickers
  if (typeof renderDiaryCoverStickers === 'function' && cv.theme === 'diario') renderDiaryCoverStickers();
  else document.querySelectorAll('.diary-cv-sticker').forEach(el => el.remove());
  // Slideshow
  stopSlideshow();
  _slideIdx = 0;
  if (cv.slides && cv.slides.length) {
    renderSlides();
    if (cv.slides.length > 1) startSlideshow();
    document.getElementById('cv-img').style.display='none';
    document.getElementById('cv-img-overlay').style.display='none';
  } else {
    // single image fallback
    const img=document.getElementById('cv-img');
    const ov=document.getElementById('cv-img-overlay');
    document.getElementById('cv-slideshow').innerHTML='';
    document.getElementById('cv-slide-dots').innerHTML='';
    if(cv.img){
      img.src=cv.img; img.style.display='block'; img.style.opacity=(cv.opa||32)/100;
      const fit=cv.imgFit||'cover'; const size=cv.imgSize||100; const x=cv.imgX||50; const y=cv.imgY||50;
      img.style.objectFit=fit; img.style.objectPosition=x+'% '+y+'%';
      if(fit==='cover'||fit==='fill'){img.style.width=size+'%';img.style.height=size+'%';img.style.left='0';img.style.top='0';img.style.transform='none';img.style.maxWidth='none';img.style.maxHeight='none';}
      else{img.style.width='auto';img.style.height='auto';img.style.maxWidth=size+'%';img.style.maxHeight=size+'%';img.style.left='50%';img.style.top='50%';img.style.transform='translate(-50%,-50%)';}
      ov.style.display='block';
    } else { img.style.display='none'; ov.style.display='none'; }
  }
}
function buildSwatches() { const sw=document.getElementById('swatches'); sw.innerHTML=''; COLORS.forEach(c=>{const d=document.createElement('div');d.className='sw';d.style.background=c;d.onclick=()=>{S.cover.color=c;S.cover.grad=null;applyCV();sched();document.querySelectorAll('.sw').forEach(x=>x.classList.remove('on'));d.classList.add('on');};sw.appendChild(d);}); }
function buildGrads() { const g=document.getElementById('gradients'); g.innerHTML=''; GRADS.forEach(gr=>{const d=document.createElement('div');d.className='grad-sw';d.style.background=gr;d.onclick=()=>{S.cover.grad=gr;applyCV();sched();document.querySelectorAll('.grad-sw').forEach(x=>x.classList.remove('on'));d.classList.add('on');};g.appendChild(d);}); }
function buildStickerPicker() { const p=document.getElementById('sticker-picker'); p.innerHTML=''; STICKERS.forEach(e=>{const d=document.createElement('span');d.className='st-opt';d.textContent=e;d.onclick=()=>placeSticker(e);p.appendChild(d);}); }

function placeSticker(emoji,left,top) { const pt=document.getElementById('page-text'); const el=document.createElement('div'); el.className='sticker-el'; el.dataset.e=emoji; el.textContent=emoji; el.style.left=left||(Math.random()*60+20)+'%'; el.style.top=top||(Math.random()*50+10)+'%'; const del=document.createElement('div'); del.className='sticker-del'; del.innerHTML='<svg class="icon"><use href="#i-close"/></svg>'; del.onclick=()=>{el.remove();sched();}; el.appendChild(del); pt.appendChild(el); dragSticker(el); }
function dragSticker(el) { el.addEventListener('mousedown',e=>{if(e.target.classList.contains('sticker-del'))return;e.preventDefault();const pt=document.getElementById('page-text');const pr=pt.getBoundingClientRect();const er=el.getBoundingClientRect();const ox=e.clientX-er.left,oy=e.clientY-er.top;el.style.position='absolute';function mv(ev){el.style.left=(ev.clientX-pr.left-ox)+'px';el.style.top=(ev.clientY-pr.top-oy)+'px';}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);sched();}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);}); }

function renderBookmarks() { const bm=document.getElementById('bookmarks'); bm.innerHTML=''; (S.bookmarks||[]).forEach(b=>{const d=document.createElement('div');d.className='bm'+(b.page===cur?' active':'');d.style.background=b.color;d.title=`Página ${b.page+1}`;d.onclick=()=>goToPage(b.page);bm.appendChild(d);}); }
function addBookmark() { if(!S.bookmarks)S.bookmarks=[]; if(S.bookmarks.find(b=>b.page===cur)){toast2('Ya hay un marcador aquí');return;} const color=TAG_COLORS[S.bookmarks.length%TAG_COLORS.length]; S.bookmarks.push({page:cur,color}); renderBookmarks(); sched(); toast2('🔖 Marcador agregado'); }
function clearBookmarks() { S.bookmarks=[]; renderBookmarks(); sched(); toast2('Marcadores borrados'); }

// ── FONT/STYLE ──
function setFont(btn) { document.querySelectorAll('#fonts .pb').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); const f=btn.dataset.f; document.getElementById('page-text').style.fontFamily=f; S.pages[cur].font=f; sched(); }
function setSz(v) { const sz=parseInt(v); const pt=document.getElementById('page-text'); pt.style.fontSize=sz+'px'; pt.style.lineHeight=Math.max(34,sz*1.72)+'px'; S.pages[cur].sz=sz; sched(); }
function setInk(v) { document.getElementById('page-text').style.color=v; S.pages[cur].ink=v; sched(); }
function setPageStyle(s) { document.getElementById('page').className=s; S.pages[cur].style=s; ['l','d','g','n'].forEach(x=>document.getElementById(x+'btn').classList.remove('on')); const map={lines:'lbtn',dots:'dbtn',grid:'gbtn','':'nbtn'}; if(map[s]) document.getElementById(map[s]).classList.add('on'); sched(); }
function doc(cmd) { document.getElementById('page-text').focus(); document.execCommand(cmd); }
