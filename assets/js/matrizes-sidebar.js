/* Navegação lateral com o mesmo componente e estilos do bi-zootecnico. */
(() => {
  const current=document.body.dataset.page||'';
  const items=Object.entries(window.MatrizesPages).map(([id,page])=>({id,label:page.title,href:page.file}));
  const root=document.createElement('div');
  root.className='side-nav-root';
  root.innerHTML=`
    <button class="side-nav-rail" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="matrizesSideNav">
      <span class="side-nav-hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
    </button>
    <div class="side-nav-overlay" aria-hidden="true"></div>
    <aside id="matrizesSideNav" class="side-nav-panel" aria-label="Navegação principal" aria-hidden="true" inert>
      <div class="side-nav-brand">
        <div class="side-nav-panel-head">
          <img src="assets/img/logo-granja-brasilia-branca.png" alt="Granja Brasília" class="side-nav-logo">
          <button class="side-nav-close" type="button" aria-label="Fechar menu">×</button>
        </div>
        <div class="side-nav-section-title">MATRIZES E INCUBATÓRIO</div>
      </div>
      <nav class="side-nav-links">
        ${items.map(item=>`<a class="side-nav-link ${current===item.id?'active':''}" href="${item.href}" ${current===item.id?'aria-current="page"':''}><span>${item.label}</span></a>`).join('')}
      </nav>
    </aside>`;
  document.body.classList.add('has-side-nav');
  document.body.prepend(root);
  const rail=root.querySelector('.side-nav-rail');
  const panel=root.querySelector('.side-nav-panel');
  const close=root.querySelector('.side-nav-close');
  const setOpen=open=>{
    root.classList.toggle('open',open);
    rail.setAttribute('aria-expanded',String(open));
    panel.setAttribute('aria-hidden',String(!open));
    panel.inert=!open;
    document.body.classList.toggle('side-nav-open',open);
    (open?close:rail).focus();
  };
  rail.addEventListener('click',()=>setOpen(true));
  close.addEventListener('click',()=>setOpen(false));
  root.querySelector('.side-nav-overlay').addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{
    if(!root.classList.contains('open'))return;
    if(event.key==='Escape'){setOpen(false);return;}
    if(event.key==='Tab'){
      const links=[close,...panel.querySelectorAll('a')],first=links[0],last=links.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
})();
