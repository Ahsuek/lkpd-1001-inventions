/* ===== Sketch Canvas (touch + mouse, erase, undo, clear) ===== */
function initSketchCanvas(canvas, onChange){
  const ctx = canvas.getContext('2d');
  let drawing = false, erasing = false, undoStack = [], last = null;

  function sizeCanvas(){
    let rect = canvas.getBoundingClientRect();
    // Fallback: jika elemen belum terlihat (rect = 0), ukur dari parent agar canvas tetap berukuran nyata.
    if(!rect.width && canvas.parentElement) rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const w = Math.max(rect.width, 100);
    const h = Math.max(rect.height || 280, 250, Math.min(350, w * 0.62)); // tinggi CSS 250-350px
    const data = canvas.toDataURL ? snapshot() : null;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    paintBg();
    if(data){ const img = new Image(); img.onload = ()=> ctx.drawImage(img,0,0,w,h); img.src = data; }
  }
  function paintBg(){ ctx.fillStyle = '#f5f1e6'; ctx.fillRect(0,0,canvas.width,canvas.height); }
  function snapshot(){ return canvas.toDataURL('image/png'); }
  function pushUndo(){ undoStack.push(snapshot()); if(undoStack.length>20) undoStack.shift(); if(onChange) onChange(); }
  function pos(e){
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x:p.clientX-r.left, y:p.clientY-r.top };
  }
  function stroke(e){
    if(!drawing) return;
    e.preventDefault();
    const p = pos(e);
    ctx.strokeStyle = erasing ? '#f5f1e6' : '#1b2733';
    ctx.lineWidth = erasing ? 22 : 3;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p;
    if(onChange) onChange();
  }
  function start(e){
    if(e.touches && e.touches.length>1) return;
    drawing = true; pushUndo(); last = pos(e); stroke(e);
  }
  function end(){ drawing = false; }

  canvas.addEventListener('mousedown', start);
  window.addEventListener('mousemove', stroke);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, {passive:false});
  canvas.addEventListener('touchmove', stroke, {passive:false});
  canvas.addEventListener('touchend', end);

  return {
    resize: sizeCanvas,
    isDirty: ()=> undoStack.length>0 || canvas.toDataURL().length > 4000,
    setErase(v){ erasing = v; },
    clear(){ pushUndo(); paintBg(); if(onChange) onChange(); },
    undo(){
      const prev = undoStack.pop();
      if(!prev) return;
      const img = new Image();
      img.onload = ()=>{ paintBg(); ctx.drawImage(img,0,0, canvas.width/(Math.min(window.devicePixelRatio||1,2)), canvas.height/(Math.min(window.devicePixelRatio||1,2))); if(onChange) onChange(); };
      img.src = prev;
    },
    getData(){ return canvas.toDataURL('image/jpeg', 0.6); }
  };
}
