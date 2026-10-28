/* Painel compartilhado adaptado de bi-zootecnico/assets/js/mobile-filters.js.
 * Mantém geometria/gestos da referência; a integração recebe o estado existente. */
(() => {
  'use strict';
  const query='(max-width:1024px), (max-width:1366px) and (pointer:coarse)';
  window.MobileFilterPanel={create({fields,container,clear,getCount,isDirty,onApply,onModeChange}) {
    const media=matchMedia(query),grid=fields,card=container;
    const gridHome=document.createComment('Posição desktop dos filtros');
    const clearHome=document.createComment('Posição desktop de limpar filtros');
    grid.before(gridHome);clear.before(clearHome);
    const shell=document.createElement('section');
    shell.className='mobile-filter-shell';shell.setAttribute('aria-label','Filtros da análise');
    shell.innerHTML=`<div class="mobile-filter-surface">
      <header class="mobile-filter-handle">
        <button class="mobile-filter-toggle" type="button" aria-expanded="false" aria-controls="mobileFilterContent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--card)"/><circle cx="15" cy="17" r="3" fill="var(--card)"/></svg>
          <span>Filtros</span><span class="mobile-filter-count" hidden>0</span><span class="mobile-filter-chevron" aria-hidden="true">⌃</span>
        </button>
        <button class="mobile-filter-expand" type="button" aria-label="Expandir filtros ao máximo" title="Expandir filtros ao máximo">↕</button>
      </header>
      <div id="mobileFilterContent" class="mobile-filter-content">
        <div class="mobile-filter-scroll"><h2>Refine sua análise</h2><div class="mobile-filter-mount"></div></div>
        <footer class="mobile-filter-footer"><p role="status" aria-live="polite">Filtros aplicados à análise.</p><div class="mobile-filter-actions"><button type="button" class="button mobile-filter-apply">Aplicar filtros <span aria-hidden="true">→</span></button></div></footer>
      </div></div>`;
    document.body.append(shell);document.body.classList.add('mobile-bi-page');
    const find=selector=>shell.querySelector(selector),toggle=find('.mobile-filter-toggle'),expand=find('.mobile-filter-expand');
    const handle=find('.mobile-filter-handle'),content=find('.mobile-filter-content'),count=find('.mobile-filter-count'),status=find('.mobile-filter-footer p');
    const closed=56;
    let level='closed',maximum=600,visible=closed,drag=null,frame=0,nextHeight=closed,suppressClick=false,applying=false;
    function counter() {
      const number=getCount();count.hidden=!number;count.textContent=String(number);
      const pending=isDirty();
      status.textContent=applying?'Aplicando seleções…':pending?'Seleções alteradas. Toque em Aplicar filtros.':'Filtros aplicados à análise.';
      toggle.setAttribute('aria-label',`Filtros${number?`, ${number} critérios selecionados`:''}${pending?', alterações por aplicar':''}`);
    }
    function closeChoices() {grid.querySelectorAll('details[open]').forEach(el=>el.open=false);}
    function place() {
      card.classList.toggle('mobile-filters-relocated',media.matches);
      document.body.classList.toggle('mz-floating-filters',media.matches);
      if(media.matches){find('.mobile-filter-mount').append(grid);find('.mobile-filter-actions').prepend(clear);}
      else {gridHome.after(grid);clearHome.after(clear);}
    }
    function paint(height) {visible=Math.max(closed,Math.min(maximum,height));shell.style.setProperty('--mobile-visible',`${visible}px`);}
    const middle=()=>Math.min(maximum,Math.max(240,maximum*.64));
    function measure() {
      const viewport=window.visualViewport,height=viewport?.height||innerHeight;
      const keyboard=viewport?Math.max(0,innerHeight-viewport.height-viewport.offsetTop):0;
      const safeBottom=parseFloat(getComputedStyle(shell).getPropertyValue('--mobile-safe-bottom'))||0;
      maximum=Math.max(180,height-40-safeBottom);shell.style.setProperty('--mobile-max',`${maximum}px`);
      shell.style.bottom=`calc(${16+keyboard}px + var(--mobile-safe-bottom,0px))`;
      if(!drag)paint(level==='closed'?closed:level==='full'?maximum:middle());
    }
    function setLevel(next,focus=false) {
      level=next;const open=media.matches&&next!=='closed';
      shell.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));content.inert=!open;
      expand.setAttribute('aria-label',next==='full'?'Reduzir painel de filtros':'Expandir filtros ao máximo');
      expand.title=expand.getAttribute('aria-label');
      if(!open){closeChoices();if(content.contains(document.activeElement))focus=true;}
      measure();if(focus&&media.matches)toggle.focus({preventScroll:true});
    }
    async function apply() {
      if(applying)return;
      applying=true;find('.mobile-filter-apply').disabled=true;shell.setAttribute('aria-busy','true');grid.inert=true;clear.disabled=true;counter();
      let failed=false;
      try {await onApply();counter();setLevel('closed',media.matches);}
      catch(error){failed=true;status.textContent='Não foi possível aplicar os filtros. Tente novamente.';}
      finally{applying=false;find('.mobile-filter-apply').disabled=false;grid.inert=false;clear.disabled=false;shell.setAttribute('aria-busy','false');if(!failed)counter();}
    }
    find('.mobile-filter-apply').addEventListener('click',apply);
    toggle.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}setLevel(level==='closed'?'middle':'closed');});
    expand.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}setLevel(level==='full'?'middle':'full');});
    handle.addEventListener('pointerdown',event=>{
      if(!media.matches||!event.isPrimary||event.button>0)return;
      drag={id:event.pointerId,y:event.clientY,height:visible,original:level,moved:false};
    });
    window.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      const delta=drag.y-event.clientY;if(!drag.moved&&Math.abs(delta)<6)return;
      if(!drag.moved){drag.moved=true;handle.setPointerCapture(event.pointerId);shell.classList.add('is-dragging','is-open');content.inert=false;toggle.setAttribute('aria-expanded','true');}
      nextHeight=drag.height+delta;
      if(!frame)frame=requestAnimationFrame(()=>{frame=0;paint(nextHeight);});
    });
    function endDrag(event,canceled=false) {
      if(!drag||event.pointerId!==drag.id)return;
      const gesture=drag;
      if(frame){cancelAnimationFrame(frame);frame=0;paint(nextHeight);}
      drag=null;shell.classList.remove('is-dragging');
      if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);
      if(!gesture.moved)return;
      suppressClick=true;setTimeout(()=>{suppressClick=false;},0);
      const nearest=[['closed',closed],['middle',middle()],['full',maximum]].sort((a,b)=>Math.abs(a[1]-visible)-Math.abs(b[1]-visible))[0][0];
      setLevel(canceled?gesture.original:nearest);
    }
    window.addEventListener('pointerup',event=>endDrag(event));window.addEventListener('pointercancel',event=>endDrag(event,true));
    handle.addEventListener('keydown',event=>{
      if(!media.matches||!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
      event.preventDefault();setLevel(event.key==='Home'?'closed':event.key==='End'?'full':event.key==='ArrowUp'?(level==='closed'?'middle':'full'):(level==='full'?'middle':'closed'));
    });
    document.addEventListener('keydown',event=>{
      if(event.defaultPrevented||event.key!=='Escape'||!media.matches||level==='closed'||shell.inert)return;
      const choice=grid.querySelector('details[open]');
      if(choice){choice.open=false;choice.querySelector('summary').focus({preventScroll:true});}
      else setLevel('closed',true);
    });
    media.addEventListener('change',async()=>{
      if(drag&&handle.hasPointerCapture(drag.id))handle.releasePointerCapture(drag.id);
      drag=null;shell.classList.remove('is-dragging');if(frame){cancelAnimationFrame(frame);frame=0;}
      closeChoices();place();setLevel('closed');
      if(!media.matches&&isDirty())await apply();
      onModeChange(media.matches);counter();
    });
    // O painel não compete com menu, fórmulas ou gráfico ampliado, inclusive por teclado.
    const blocked=()=>document.body.classList.contains('side-nav-open')||document.body.classList.contains('mz-expanded')||!!document.querySelector('dialog[open],.dialog-layer:not(.hidden)');
    const syncBlocked=()=>{shell.inert=blocked();};
    new MutationObserver(syncBlocked).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','open'],childList:true});
    window.addEventListener('resize',measure);window.visualViewport?.addEventListener('resize',measure);window.visualViewport?.addEventListener('scroll',measure);
    onModeChange(media.matches);place();setLevel('closed');counter();syncBlocked();
    return {isMobile:()=>media.matches,update:counter};
  }};
})();
