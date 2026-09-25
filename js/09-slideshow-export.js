// ══════════════════════════════════════════════════════════════════
//  SLIDESHOW DE TAPA + EXPORTACIÓN (PDF / HTML / TXT)
// ══════════════════════════════════════════════════════════════════
//    startSlideshow()         → rota las fotos de fondo de la tapa
//    downloadPDF()/downloadPDFPages() → arma un HTML imprimible y
//        abre el diálogo de impresión del navegador (guardar como PDF)
//    doDownload()             → exporta páginas elegidas a .txt/.html/.pdf
// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
//  SLIDESHOW TAPA
// ══════════════════════════════════════════════════════
let _slideTimer = null;
let _slideIdx = 0;
let _slideTransitions = ['fade','slide','kenburns'];

function startSlideshow() {
  stopSlideshow();
  if (!S || !S.cover.slides || S.cover.slides.length < 2) return;
  const speed = (S.cover.slideSpeed || 5) * 1000;
  _slideTimer = setInterval(() => advanceSlide(), speed);
}

function stopSlideshow() { if (_slideTimer) { clearInterval(_slideTimer); _slideTimer = null; } }

function advanceSlide() {
  const slides = S.cover.slides;
  if (!slides || slides.length < 2) return;
  _slideIdx = (_slideIdx + 1) % slides.length;
  renderSlides();
}

function renderSlides() {
  const container = document.getElementById('cv-slideshow');
  const overlay = document.getElementById('cv-slide-overlay');
  const dotsEl = document.getElementById('cv-slide-dots');
  if (!S || !S.cover.slides || !S.cover.slides.length) {
    container.innerHTML = '';
    overlay.style.display = 'none';
    dotsEl.innerHTML = '';
    return;
  }
  const slides = S.cover.slides;
  const opa = (S.cover.opa || 32) / 100;
  overlay.style.display = 'block';
  // build or update slides
  container.innerHTML = '';
  slides.forEach((src, i) => {
    const div = document.createElement('div');
    div.className = 'cv-slide' + (i === _slideIdx ? ' active' : '');
    const transitions = _slideTransitions;
    const tType = transitions[i % transitions.length];
    if (tType === 'kenburns' && i === _slideIdx) div.classList.add('ken-burns');
    div.style.backgroundImage = `url(${src})`;
    div.style.opacity = i === _slideIdx ? opa : '0';
    container.appendChild(div);
  });
  // dots
  dotsEl.innerHTML = '';
  if (slides.length > 1) {
    slides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'cv-sdot' + (i === _slideIdx ? ' on' : '');
      dot.onclick = (e) => { e.stopPropagation(); _slideIdx = i; renderSlides(); };
      dotsEl.appendChild(dot);
    });
  }
}

function addSlideImage() {
  if (S.cover.slides && S.cover.slides.length >= 6) { toast2('Máximo 6 fotos en el slideshow'); return; }
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      compressImage(ev.target.result, 1400, 1400, 0.75, compressed => {
        if (!S.cover.slides) S.cover.slides = [];
        S.cover.slides.push(compressed);
        renderSlideThumbs();
        renderSlides();
        startSlideshow();
        sched();
        const speedRow = document.getElementById('cv-slide-speed-row');
        if (speedRow) speedRow.style.display = S.cover.slides.length > 1 ? 'flex' : 'none';
      });
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

function renderSlideThumbs() {
  const container = document.getElementById('cv-slide-thumbs');
  if (!container) return;
  container.innerHTML = '';
  (S.cover.slides || []).forEach((src, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'cv-slide-thumb';
    thumb.style.backgroundImage = `url(${src})`;
    const del = document.createElement('div');
    del.className = 'cv-thumb-del';
    del.innerHTML = '<svg class="icon"><use href="#i-close"/></svg>';
    del.onclick = () => {
      S.cover.slides.splice(i, 1);
      if (_slideIdx >= S.cover.slides.length) _slideIdx = 0;
      renderSlideThumbs();
      renderSlides();
      if (S.cover.slides.length > 1) startSlideshow(); else stopSlideshow();
      sched();
      const speedRow = document.getElementById('cv-slide-speed-row');
      if (speedRow) speedRow.style.display = S.cover.slides.length > 1 ? 'flex' : 'none';
    };
    thumb.appendChild(del);
    container.appendChild(thumb);
  });
  // add button (max 6)
  if (!S.cover.slides || S.cover.slides.length < 6) {
    const addBtn = document.createElement('div');
    addBtn.className = 'cv-add-slide-btn';
    addBtn.textContent = '+';
    addBtn.title = 'Agregar foto';
    addBtn.onclick = addSlideImage;
    container.appendChild(addBtn);
  }
}

function updateSlideSpeed(val) {
  S.cover.slideSpeed = parseInt(val);
  document.getElementById('cv-speed-val').textContent = val + 's';
  startSlideshow();
  sched();
}


function openDLM() { document.getElementById('dlm').classList.add('open'); }
function closeDLM() { document.getElementById('dlm').classList.remove('open'); }
function dlSetFmt(fmt,btn) { dlFmt2=fmt; document.querySelectorAll('.dl-fmt-btn').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); dlPreview(); }
function parsePgNums(str) { const nums=new Set(); str.split(',').forEach(part=>{part=part.trim(); const range=part.match(/^(\d+)\s*[-–]\s*(\d+)$/); if(range){const a=parseInt(range[1]),b=parseInt(range[2]);for(let i=Math.min(a,b);i<=Math.max(a,b);i++)if(i>=1&&i<=TOTAL)nums.add(i-1);}else{const n=parseInt(part);if(!isNaN(n)&&n>=1&&n<=TOTAL)nums.add(n-1);}}); return [...nums].sort((a,b)=>a-b); }
function dlPreview() { const val=document.getElementById('dl-pages').value; const idxs=parsePgNums(val); const box=document.getElementById('dl-preview-box'); if(!idxs.length){box.textContent='Vista previa...';return;} const lines=idxs.map(i=>{const d=document.createElement('div');d.innerHTML=S.pages[i].html||'';const t=(d.innerText||d.textContent||'').trim().slice(0,60)||'(página vacía)';const tags=(S.pages[i].tags||[]).length?' ['+(S.pages[i].tags.join(', '))+']':'';return `Pág ${i+1}${tags}: ${t}${t.length>=60?'…':''}`;});box.textContent=lines.join('\n'); }
function doDownload() { sync(); const val=document.getElementById('dl-pages').value; const idxs=parsePgNums(val); if(!idxs.length){alert('No se encontraron páginas válidas.');return;} if(dlFmt2==='pdf'){downloadPDFPages(idxs);closeDLM();return;} if(dlFmt2==='txt'){let txt='';idxs.forEach(i=>{const d=document.createElement('div');d.innerHTML=S.pages[i].html||'';const t=(d.innerText||d.textContent||'').trim();const tags=(S.pages[i].tags||[]).length?'\nEtiquetas: '+S.pages[i].tags.join(', '):'';txt+=`════════════════════\nPágina ${i+1} — ${S.pages[i].date||''}\n════════════════════\n${t||'(vacía)'}${tags}\n\n`;});download(new Blob([txt],{type:'text/plain;charset=utf-8'}),`cuaderno-pags-${val.replace(/\s/g,'')}.txt`);}else{let body='';idxs.forEach(i=>{const p=S.pages[i];const tags=(p.tags||[]).map(t=>`<span style="background:${getTagColor(t)};color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;margin-right:4px;">${t}</span>`).join('');body+=`<section style="page-break-after:always;padding:40px 60px;font-family:${p.font||'Georgia,serif'};font-size:${p.sz||18}px;color:${p.ink||'#252018'};line-height:${Math.max(34,(p.sz||18)*1.72)}px;background:#faf7f1;min-height:100vh;"><div style="font-size:12px;color:#aaa;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;"><span>Página ${i+1} — ${p.date||''}</span><span>${tags}</span></div>${p.html||'<em style="color:#ccc">Página vacía</em>'}</section>`;});const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${S.cover.title||'Cuaderno'}</title><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Lora:ital,wght@0,600;1,400&family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,500&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#f0ece3;font-family:Georgia,serif}section{margin:20px auto;max-width:700px;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,.12);overflow:hidden;}</style></head><body>${body}</body></html>`;download(new Blob([html],{type:'text/html;charset=utf-8'}),`cuaderno-pags-${val.replace(/\s/g,'')}.html`);} closeDLM(); toast2('Descarga iniciada'); }
function download(blob,filename) { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); }
function exportTxt() { let txt=`${S.cover.title||'Mi Cuaderno'}\n${'═'.repeat(40)}\n\n`; S.pages.forEach((p,i)=>{const d=document.createElement('div');d.innerHTML=p.html||'';const t=d.innerText||d.textContent||'';if(!t.trim())return;const tags=(p.tags||[]).length?' ['+p.tags.join(', ')+']':'';txt+=`--- Página ${i+1}${tags} ---\n${t.trim()}\n\n`;}); if(!txt.trim()){alert('El cuaderno está vacío.');return;} download(new Blob([txt],{type:'text/plain;charset=utf-8'}),'cuaderno.txt'); }

// ── PDF ──
function downloadPDF() { sync(); downloadPDFPages(S.pages.map((_,i)=>i).filter(i=>S.pages[i].html)); }
function downloadPDFPages(idxs) {
  let body='';
  idxs.forEach(i=>{const p=S.pages[i];const tags=(p.tags||[]).map(t=>`<span style="background:${getTagColor(t)};color:#fff;font-size:10px;padding:2px 8px;border-radius:10px;margin-right:4px;">${t}</span>`).join('');const bgStyle=p.style==='lines'?'background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 31px,#c5d8e8 31px,#c5d8e8 32px);background-position:0 40px;':p.style==='dots'?'background-image:radial-gradient(circle,#c5d8e8 1px,transparent 1px);background-size:20px 20px;':p.style==='grid'?'background-image:linear-gradient(#c5d8e8 1px,transparent 1px),linear-gradient(90deg,#c5d8e8 1px,transparent 1px);background-size:20px 20px;':'';body+=`<div class="page" style="${bgStyle}"><div class="page-header"><div class="page-num">${i+1}</div><div class="page-date">${p.date||''}</div><div class="page-tags">${tags}</div></div><div class="page-content" style="font-family:${p.font||'Georgia,serif'};font-size:${p.sz||18}px;color:${p.ink||'#252018'};line-height:${Math.max(32,(p.sz||18)*1.72)}px;">${p.html||''}</div><div class="page-footer">${S.cover.title||'Mi Cuaderno'}</div></div>`;});
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${S.cover.title||'Mi Cuaderno'} — Exportación</title><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Lora:ital,wght@0,600;1,400&family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,500&display=swap" rel="stylesheet"><style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{background:#e8e3db;font-family:'DM Sans',sans-serif}.cover{width:210mm;height:297mm;background:${S.cover.grad||S.cover.color||'#2d4a3e'};display:flex;flex-direction:column;align-items:center;justify-content:center;page-break-after:always;position:relative}.cover::before{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.04) 0,rgba(255,255,255,.04) 1px,transparent 1px,transparent 10px)}.cover::after{content:'';position:absolute;inset:20mm;border:1px solid rgba(255,255,255,.15);border-radius:2px}.cover-title{font-family:'Playfair Display',serif;font-size:38px;color:rgba(245,228,198,.95);text-align:center;position:relative;z-index:1;text-shadow:0 2px 20px rgba(0,0,0,.5);padding:0 30mm;line-height:1.3}.cover-deco{color:rgba(245,228,198,.3);font-size:20px;letter-spacing:10px;margin:14px 0;position:relative;z-index:1}.cover-sub{font-family:'Caveat',cursive;font-size:18px;color:rgba(245,228,198,.5);position:relative;z-index:1}.cover-date{position:absolute;bottom:30mm;font-family:'DM Sans',sans-serif;font-size:11px;color:rgba(255,255,255,.25);letter-spacing:3px;text-transform:uppercase;z-index:1}.page{width:210mm;height:297mm;background:#faf7f1;position:relative;overflow:hidden;page-break-after:always;padding:18mm 16mm 14mm 22mm}.page-header{display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(210,120,90,.2);padding-bottom:8px;margin-bottom:10px}.page-num{font-family:'Lora',serif;font-size:12px;color:#b87040;min-width:20px}.page-date{font-family:'Caveat',cursive;font-size:12px;color:rgba(184,112,64,.5);flex:1}.page-tags{display:flex;gap:4px;flex-wrap:wrap}.page-content{min-height:200mm}.page-content img{max-width:100%;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,.1)}.page-footer{position:absolute;bottom:10mm;right:14mm;font-family:'DM Sans',sans-serif;font-size:9px;color:rgba(184,112,64,.3);letter-spacing:2px;text-transform:uppercase}@media print{body{background:none}.page,.cover{box-shadow:none}}</style></head><body><div class="cover"><div class="cover-title">${S.cover.title||'Mi Cuaderno'}</div><div class="cover-deco">· · ·</div><div class="cover-sub">${S.cover.sub||'Notas & Ideas'}</div><div class="cover-date">${new Date().toLocaleDateString('es-AR',{year:'numeric',month:'long'})}</div></div>${body}</body></html>`;
  const win=window.open('','_blank'); win.document.write(html); win.document.close(); win.onload=()=>{win.focus();win.print();}; toast2('PDF listo para imprimir');
}
