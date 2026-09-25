// ══════════════════════════════════════════════════════════════════
//  INTERACCIONES DE UI: arrastrar/redimensionar, swipe, teclado
// ══════════════════════════════════════════════════════════════════
//    drag()/resize()      → mover y redimensionar imágenes/dibujos
//    swipe (touch)        → pasar de página en celular
//    atajos de teclado    → flechas para cambiar de página, etc.
// ══════════════════════════════════════════════════════════════════

// ── DRAG/RESIZE ──
function drag(el) { el.addEventListener('mousedown',e=>{if(e.target.classList.contains('img-resize')||e.target.classList.contains('img-del'))return;e.preventDefault();const pRect=document.getElementById('page-text').getBoundingClientRect();const er=el.getBoundingClientRect();const ox=e.clientX-er.left,oy=e.clientY-er.top;el.style.position='absolute';function mv(ev){el.style.left=(ev.clientX-pRect.left-ox)+'px';el.style.top=(ev.clientY-pRect.top-oy)+'px';}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);sched();}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);}); }
function resize(w,h) { h.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();const sw=w.offsetWidth,sx=e.clientX;function mv(ev){w.style.width=Math.max(60,sw+ev.clientX-sx)+'px';}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);sched();}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);}); }

// ── SWIPE ──
let tx=0;
document.getElementById('book').addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});
document.getElementById('book').addEventListener('touchend',e=>{if(!bookOpen)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>48){dx<0?nxt():prev();}},{passive:true});

// ── KEYBOARD ──
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(document.getElementById('toc-modal').classList.contains('open')){closeTOC();return;}if(document.getElementById('focus-overlay').classList.contains('open')){closeFocus();return;}if(document.getElementById('draw-overlay').classList.contains('open')){closeDraw();return;}if(bookOpen){closeBook();return;}}
  if(document.activeElement===document.getElementById('page-text')) return;
  if(document.activeElement===document.getElementById('search-inp')) return;
  if(e.key==='ArrowRight'||e.key==='PageDown') nxt();
  if(e.key==='ArrowLeft'||e.key==='PageUp') prev();
  if(e.ctrlKey&&e.key==='f'){e.preventDefault();openSearch();}
});

document.getElementById('page-text').addEventListener('input',()=>{sched();updateWC();checkOverflow();});

// ── OVERFLOW ──
function checkOverflow() { const el=document.getElementById('page-text'); if(el.scrollHeight<=el.clientHeight) return; if(cur>=TOTAL-1) return; const nodes=[...el.childNodes]; let ov=[]; while(el.scrollHeight>el.clientHeight&&nodes.length>0){const last=nodes.pop();ov.unshift(last);el.removeChild(last);} if(!ov.length) return; sync(); const nextPage=S.pages[cur+1]; const tmp=document.createElement('div'); ov.forEach(n=>tmp.appendChild(n.cloneNode(true))); nextPage.html=tmp.innerHTML+(nextPage.html||''); flip(1); setTimeout(()=>{const pt=document.getElementById('page-text');const range=document.createRange();const sel=window.getSelection();range.setStart(pt,0);range.collapse(true);sel.removeAllRanges();sel.addRange(range);pt.focus();},700); }
