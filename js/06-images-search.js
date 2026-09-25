// ══════════════════════════════════════════════════════════════════
//  IMÁGENES, LINKS Y BUSCADOR
// ══════════════════════════════════════════════════════════════════
//    insImg()/insLink()  → insertan una imagen o un link en la página
//    doSearch(q)         → busca texto en todas las páginas del cuaderno
//    contador de palabras del modo foco
// ══════════════════════════════════════════════════════════════════

// ── IMAGES ──
function compressImage(dataUrl, maxW, maxH, quality, cb) {
  const img = new Image();
  img.onload = () => {
    let w = img.width, h = img.height;
    const ratio = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * ratio); h = Math.round(h * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    cb(canvas.toDataURL('image/jpeg', quality));
  };
  img.src = dataUrl;
}

function insImg() {
  const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      compressImage(ev.target.result, 1200, 1200, 0.72, compressed => {
        const w = document.createElement('div'); w.className='img-wrap'; w.style.width='180px';
        const img = document.createElement('img'); img.src = compressed;
        const del = document.createElement('div'); del.className='img-del'; del.innerHTML='<svg class="icon"><use href="#i-close"/></svg>'; del.onclick=()=>{w.remove();sched();};
        const res = document.createElement('div'); res.className='img-resize';
        w.appendChild(img); w.appendChild(del); w.appendChild(res);
        document.getElementById('page-text').appendChild(w);
        drag(w); resize(w, res); sched();
      });
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}
function insLink() { const url=prompt('URL del link:'); if(!url)return; const txt=prompt('Texto del link:',url); document.getElementById('page-text').focus(); document.execCommand('insertHTML',false,`<a href="${url}" target="_blank" style="color:#b87040">${txt||url}</a>`); sched(); }
function insMultipleImgs() {
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.multiple=true;
  inp.onchange=e=>{
    const files=[...e.target.files]; if(!files.length)return;
    files.forEach(file=>{
      const reader=new FileReader();
      reader.onload=ev=>{
        compressImage(ev.target.result, 1200, 1200, 0.72, compressed => {
          const w=document.createElement('div'); w.className='img-wrap'; w.style.width='200px';
          const img=document.createElement('img'); img.src=compressed;
          const del=document.createElement('div'); del.className='img-del'; del.innerHTML='<svg class="icon"><use href="#i-close"/></svg>'; del.onclick=()=>{w.remove();sched();};
          const res=document.createElement('div'); res.className='img-resize';
          w.appendChild(img); w.appendChild(del); w.appendChild(res);
          document.getElementById('page-text').appendChild(w);
          drag(w); resize(w,res); sched();
        });
      };
      reader.readAsDataURL(file);
    });
  };
  inp.click();
}
function insertCheckbox() {
  document.getElementById('page-text').focus();
  document.execCommand('insertHTML',false,'<div>☐ </div>');
  sched();
}
function clearPg() { if(!confirm('¿Limpiar esta página?'))return; document.getElementById('page-text').innerHTML=''; S.pages[cur].html=''; S.pages[cur].tags=[]; S.pages[cur].drawing=''; renderPageTags(cur); renderTagRow(cur); sched(); }

// ── SEARCH ──
function openSearch() { document.getElementById('search-bar').classList.add('visible'); document.getElementById('search-inp').focus(); }
function closeSearch() { document.getElementById('search-bar').classList.remove('visible'); document.getElementById('search-inp').value=''; }
function doSearch(q) { if(!q.trim())return; const results=[]; S.pages.forEach((p,i)=>{const d=document.createElement('div'); d.innerHTML=p.html||''; if((d.innerText||d.textContent||'').toLowerCase().includes(q.toLowerCase())) results.push(i+1);}); toast2(results.length?`🔍 Encontrado en páginas: ${results.join(', ')}`:'🔍 Sin resultados'); }

// ── WORD COUNT ──
function updateWC() { const pt=document.getElementById('page-text'); const txt=(pt.innerText||pt.textContent||'').trim(); const wc=txt?txt.split(/\s+/).length:0; document.getElementById('wc').textContent=wc+' pal.'; }
