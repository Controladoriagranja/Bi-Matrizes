/* Busca única para todos os dropdowns; nunca altera as seleções. */
(function(root){
  'use strict';
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
  function markup(key,label,escape){
    return `<div class="mz-filter-search"><input class="mz-search" data-search="${key}" type="search" placeholder="Digite para buscar..." aria-label="Buscar em ${escape(label)}" autocomplete="off"><button type="button" data-clear-search="${key}" aria-label="Limpar busca de ${escape(label)}" title="Limpar busca" hidden>×</button></div>`;
  }
  function bind(root,{terms={},onChange=()=>{}}={}){
    for(const input of root.querySelectorAll('[data-search]')){
      const key=input.dataset.search,scope=input.closest('.mz-options');
      const clear=scope.querySelector('[data-clear-search]'),empty=scope.querySelector('.mz-search-empty');
      function apply(){
        const term=normalize(input.value);let visible=0;
        for(const label of scope.querySelectorAll('.mz-filter-option')){
          label.hidden=!normalize(label.textContent).includes(term);
          if(!label.hidden)visible++;
        }
        clear.hidden=!input.value;
        if(empty)empty.hidden=visible>0;
        onChange(key);
      }
      input.value=terms[key]||'';
      input.addEventListener('input',apply);
      input.addEventListener('search',apply);
      input.addEventListener('focus',()=>input.scrollIntoView({block:'nearest',inline:'nearest'}));
      clear.addEventListener('click',()=>{input.value='';apply();input.focus({preventScroll:true});});
      apply();
    }
  }
  const api={normalize,markup,bind};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MatrizesFilterSearch=api;
})(globalThis);
