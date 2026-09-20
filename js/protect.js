/* ===== Anti-copy / anti-paste sederhana (deterrent) ===== */
(function(){
  // 1) Block copy pada konten .user-content
  document.addEventListener('copy', function(e){
    const sel = document.getSelection();
    if(sel && sel.anchorNode){
      const el = sel.anchorNode.nodeType===1 ? sel.anchorNode : sel.anchorNode.parentElement;
      if(el && el.closest && el.closest('.user-content')){
        e.preventDefault();
        toast('Copy dinonaktifkan untuk konten misi.');
      }
    }
  });
  document.addEventListener('contextmenu', function(e){
    if(e.target.closest && e.target.closest('.user-content')){
      e.preventDefault();
    }
    // context-menu paste block ditangani paste event di bawah
  });
  document.addEventListener('keydown', function(e){
    const c = (e.ctrlKey||e.metaKey) && (e.key==='c'||e.key==='C');
    if(c){
      const sel = document.getSelection();
      if(sel && sel.anchorNode){
        const el = sel.anchorNode.nodeType===1 ? sel.anchorNode : sel.anchorNode.parentElement;
        if(el && el.closest && el.closest('.user-content')){ e.preventDefault(); toast('Copy dinonaktifkan untuk konten misi.'); }
      }
    }
  });
  document.addEventListener('dragstart', function(e){
    if(e.target.closest && e.target.closest('.user-content') && !e.target.closest('#sketch-canvas')){
      e.preventDefault();
    }
  });

  // 2) Block paste pada textarea ber-atribut data-no-paste
  document.addEventListener('paste', function(e){
    const t = e.target;
    if(t && t.closest && t.closest('[data-no-paste="true"]')){
      e.preventDefault();
      toast('Paste dinonaktifkan untuk misi ini. Coba tuliskan dengan pemahamanmu sendiri.');
    }
  });
  document.addEventListener('keydown', function(e){
    if((e.ctrlKey||e.metaKey) && (e.key==='v'||e.key==='V')){
      if(e.target && e.target.closest && e.target.closest('[data-no-paste="true"]')){
        e.preventDefault();
        toast('Paste dinonaktifkan untuk misi ini. Coba tuliskan dengan pemahamanmu sendiri.');
      }
    }
  });

  let toastTimer;
  window.toast = function(msg){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('show'), 2000);
  };
})();
