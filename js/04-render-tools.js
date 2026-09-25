// ══════════════════════════════════════════════════════════════════
//  RENDER DE PÁGINA + HERRAMIENTAS (tags, índice, foco, dibujo, Pomodoro)
// ══════════════════════════════════════════════════════════════════
//    render(idx)            → pinta el contenido de la página idx
//    renderTagRow / addTag / removeTag → etiquetas de la página actual
//    openTOC / closeTOC     → índice del cuaderno
//    openFocus / closeFocus → modo de escritura a pantalla completa
//    openDraw / saveDrawing / clearDrawing → lienzo de dibujo (canvas)
//    togglePom / resetPom   → temporizador Pomodoro
// ══════════════════════════════════════════════════════════════════

// ── RENDER ──
function render(idx) {
  const p = S.pages[idx];
  const pt = document.getElementById('page-text');
  pt.innerHTML = p.html || '';
  pt.style.fontFamily = p.font||'Caveat,cursive';
  pt.style.fontSize = (p.sz||20)+'px';
  pt.style.color = p.ink||'#252018';
  pt.style.lineHeight = Math.max(34,(p.sz||20)*1.72)+'px';
  document.getElementById('page').className = p.style||'lines';
  document.getElementById('page-date').textContent = p.date||'';
  document.getElementById('pg-num').textContent = idx+1;
  document.getElementById('szr').value = p.sz||20;
  document.querySelectorAll('#fonts .pb').forEach(b => b.classList.toggle('on', b.dataset.f===(p.font||'Caveat,cursive')));
  document.querySelectorAll('.sticker-el').forEach(e => e.remove());
  (p.stickers||[]).forEach(s => placeSticker(s.emoji,s.left,s.top));
  renderPageTags(idx); renderTagRow(idx);
  pt.querySelectorAll('.img-wrap').forEach(w => { drag(w); const h=w.querySelector('.img-resize'); if(h) resize(w,h); });
  updateWC(); renderBookmarks();
}

// ── TAGS ──
function getTagColor(tag) { if(!tagColorMap[tag]){tagColorMap[tag]=TAG_COLORS[tagColorIdx%TAG_COLORS.length];tagColorIdx++;} return tagColorMap[tag]; }
function renderPageTags(idx) { const c=document.getElementById('page-tags'); c.innerHTML=''; (S.pages[idx].tags||[]).forEach(tag=>{const s=document.createElement('span');s.className='tag-chip';s.style.background=getTagColor(tag);s.textContent=tag;c.appendChild(s);}); }
function renderTagRow(idx) { const r=document.getElementById('tag-row'); r.innerHTML=''; const tags=S.pages[idx].tags||[]; tags.forEach(tag=>{const p=document.createElement('span');p.className='tag-pill';p.style.background=getTagColor(tag);p.innerHTML=`${tag} <span class="tp-del" onclick="removeTag('${tag}')"><svg class="icon"><use href="#i-close"/></svg></span>`;r.appendChild(p);}); if(!tags.length) r.innerHTML='<span style="font-size:.7rem;color:rgba(255,255,255,.2);">Sin etiquetas</span>'; }
function addTag() { const i=document.getElementById('new-tag-input'); const v=i.value.trim().toLowerCase(); if(!v) return; if(!S.pages[cur].tags) S.pages[cur].tags=[]; if(!S.pages[cur].tags.includes(v)){S.pages[cur].tags.push(v);renderPageTags(cur);renderTagRow(cur);sched();} i.value=''; }
function removeTag(tag) { S.pages[cur].tags=(S.pages[cur].tags||[]).filter(t=>t!==tag); renderPageTags(cur); renderTagRow(cur); sched(); }

// ── TOC ──
function openTOC() {
  sync();
  const entries = document.getElementById('toc-entries'); entries.innerHTML=''; let has=false;
  S.pages.forEach((p,i) => { const d=document.createElement('div'); d.innerHTML=p.html||''; const txt=(d.innerText||d.textContent||'').trim(); if(!txt&&!(p.tags&&p.tags.length)) return; has=true; const preview=txt.slice(0,60)||'(página con stickers/imágenes)'; const entry=document.createElement('div'); entry.className='toc-entry'; entry.onclick=()=>{closeTOC();goToPage(i);}; const tagsHTML=(p.tags||[]).map(t=>`<span class="toc-tag" style="background:${getTagColor(t)}">${t}</span>`).join(''); entry.innerHTML=`<span class="toc-pg">${i+1}</span><span class="toc-preview">${preview}${txt.length>60?'…':''}</span><div class="toc-tags">${tagsHTML}</div>`; entries.appendChild(entry); });
  if(!has) entries.innerHTML='<div class="toc-empty">El cuaderno está vacío</div>';
  document.getElementById('toc-modal').classList.add('open');
}
function closeTOC() { document.getElementById('toc-modal').classList.remove('open'); }
function goToPage(idx) { if(idx===cur) return; sync(); const dir=idx>cur?1:-1; cur=idx; flip(dir); }

// ── FOCUS ──
function openFocus() { sync(); const d=document.createElement('div'); d.innerHTML=S.pages[cur].html||''; document.getElementById('focus-text').value=d.innerText||d.textContent||''; document.getElementById('focus-overlay').classList.add('open'); document.getElementById('focus-text').focus(); updateFocusWC(); }
function closeFocus() { const txt=document.getElementById('focus-text').value; const pt=document.getElementById('page-text'); pt.innerHTML=txt.split('\n').map(l=>`<div>${l||'<br>'}</div>`).join(''); sched(); document.getElementById('focus-overlay').classList.remove('open'); }
function updateFocusWC() { const txt=document.getElementById('focus-text').value.trim(); const wc=txt?txt.split(/\s+/).length:0; document.getElementById('focus-wc').textContent=wc+' palabra'+(wc===1?'':'s'); }
document.getElementById('focus-text').addEventListener('input',updateFocusWC);

// ── DRAW ──
function openDraw() { const o=document.getElementById('draw-overlay'); const c=document.getElementById('draw-canvas'); o.classList.add('open'); c.width=window.innerWidth; c.height=window.innerHeight; drawCtx=c.getContext('2d'); drawCtx.lineCap='round'; drawCtx.lineJoin='round'; if(S.pages[cur].drawing){const img=new Image();img.onload=()=>drawCtx.drawImage(img,0,0);img.src=S.pages[cur].drawing;} setupDrawEvents(c); }
function closeDraw() { document.getElementById('draw-overlay').classList.remove('open'); }
function setupDrawEvents(canvas) {
  canvas.onmousedown=e=>{drawDrawing=true;drawCtx.beginPath();drawCtx.moveTo(e.clientX,e.clientY);};
  canvas.onmousemove=e=>{if(!drawDrawing)return;if(drawMode==='erase'){drawCtx.clearRect(e.clientX-12,e.clientY-12,24,24);}else{drawCtx.strokeStyle=document.getElementById('draw-color').value;drawCtx.lineWidth=document.getElementById('draw-size').value;drawCtx.lineTo(e.clientX,e.clientY);drawCtx.stroke();}};
  canvas.onmouseup=()=>{drawDrawing=false;};
  canvas.ontouchstart=e=>{e.preventDefault();const t=e.touches[0];canvas.onmousedown({clientX:t.clientX,clientY:t.clientY});};
  canvas.ontouchmove=e=>{e.preventDefault();const t=e.touches[0];canvas.onmousemove({clientX:t.clientX,clientY:t.clientY});};
  canvas.ontouchend=()=>{drawDrawing=false;};
}
function setDrawMode(mode,btn) { drawMode=mode; document.querySelectorAll('.dt-btn').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); }
function clearDrawing() { const c=document.getElementById('draw-canvas'); drawCtx.clearRect(0,0,c.width,c.height); }
function saveDrawing() { const canvas=document.getElementById('draw-canvas'); S.pages[cur].drawing=canvas.toDataURL(); const pt=document.getElementById('page-text'); const w=document.createElement('div'); w.className='img-wrap'; w.style.width='280px'; const img=document.createElement('img'); img.src=S.pages[cur].drawing; const del=document.createElement('div'); del.className='img-del'; del.innerHTML='<svg class="icon"><use href="#i-close"/></svg>'; del.onclick=()=>{w.remove();sched();}; const res=document.createElement('div'); res.className='img-resize'; w.appendChild(img); w.appendChild(del); w.appendChild(res); pt.appendChild(w); drag(w); resize(w,res); sched(); closeDraw(); toast2('Dibujo guardado'); }

// ── POMODORO ──
function togglePomodoroUI() { pomVisible=!pomVisible; document.getElementById('pomodoro').classList.toggle('visible',pomVisible); }
function togglePom() { if(pomRunning){clearInterval(pomTimer);pomRunning=false;document.getElementById('pom-btn').innerHTML='<svg class="icon"><use href="#i-play"/></svg> continuar';}else{pomRunning=true;document.getElementById('pom-btn').innerHTML='<svg class="icon"><use href="#i-pause"/></svg> pausar';pomTimer=setInterval(()=>{pomSeconds--;if(pomSeconds<=0){clearInterval(pomTimer);pomRunning=false;pomSeconds=5*60;document.getElementById('pom-time').textContent='Descansá';document.getElementById('pom-btn').innerHTML='<svg class="icon"><use href="#i-play"/></svg> descanso';toast2('¡Pomodoro terminado!');return;}const m=Math.floor(pomSeconds/60),s=pomSeconds%60;document.getElementById('pom-time').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');},1000);} }
function resetPom() { clearInterval(pomTimer);pomRunning=false;pomSeconds=25*60;document.getElementById('pom-time').textContent='25:00';document.getElementById('pom-btn').innerHTML='<svg class="icon"><use href="#i-play"/></svg> iniciar'; }
