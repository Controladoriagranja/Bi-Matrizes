/* Lista por lote: o cálculo é injetado pelo card, sem duplicar fórmulas. */
(function(root){
  'use strict';
  const collator=new Intl.Collator('pt-BR',{numeric:true,sensitivity:'base'});
  function scopeRows(rows,period,limit,D){
    const weeks=new Set(D.chartGroups(rows,'week',limit).map(([key])=>key));
    return rows.filter(row=>weeks.has(row.week)&&(!period.drilledWeek||row.week===period.drilledWeek));
  }
  function aggregate(rows,config,D,calculate){
    const groups=new Map();
    for(const row of rows){
      const code=String(row.raw.granja_codigo||row.raw.cab_cod||'').trim()||String(row.raw.granja||'').match(/^([0-9]+)/)?.[1]||row.farm;
      const key=JSON.stringify([row.company,row.unit,code,row.lot]);
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);
    }
    const items=[...groups].map(([key,records])=>{
      const data=calculate(records),value=D.n(data[config.metric]),target=config.target?D.n(data[config.target]):null;
      const difference=value!=null&&target!=null?value-target:null;
      return {key,lot:records[0].lot,farm:records[0].farm,value,target,difference,
        good:difference==null?null:config.lower?difference<=0:difference>=0,
        eggs:D.sum(records,row=>row.raw[config.eggs])};
    });
    return items.sort((a,b)=>{
      if((a.value==null)!==(b.value==null))return a.value==null?1:-1;
      if(a.value==null)return collator.compare(a.lot,b.lot);
      if((a.target==null)!==(b.target==null))return a.target==null?1:-1;
      const score=item=>item.difference!=null?(config.lower?item.difference:-item.difference):(config.lower?item.value:-item.value);
      return score(b)-score(a)||collator.compare(a.lot,b.lot)||collator.compare(a.farm,b.farm);
    });
  }
  function create(id){
    const element=document.createElement('section');element.className='mz-lot-list';element.id='lots-'+id;element.hidden=true;
    element.setAttribute('aria-label','Resultados por lote');let shown=10,signature='';
    const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const number=(value,digits=1)=>Number(value).toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
    let current;
    function render(model){
      current=model;
      const next=JSON.stringify([model.scope,model.items]);if(next!==signature){signature=next;shown=10;element.scrollTop=0;}
      element.setAttribute('aria-busy',String(model.loading));
      if(model.error||model.loading){element.innerHTML=`<p class="mz-lot-state" role="status">${model.error?'Não foi possível carregar os lotes. Use Atualizar.':'Carregando lotes...'}</p>`;return;}
      element.innerHTML=`<p class="mz-lot-scope">${escape(model.scope)}<span>Piores resultados primeiro</span></p>${model.items.length?`<ol class="mz-lot-rows">${model.items.slice(0,shown).map(item=>{
        const difference=item.difference==null?'Sem meta cadastrada':`Diferença: ${item.difference>0?'+':''}${number(item.difference)} pontos percentuais · Meta: ${number(item.target)}%`;
        return `<li class="mz-lot-row" data-lot-key="${escape(item.key)}"><div class="mz-lot-name"><strong>Lote ${escape(item.lot)}</strong><small class="mz-lot-meta">${escape(item.farm||'Fazenda não informada')} · ${item.eggs==null?'Quantidade de ovos não informada':number(item.eggs,0)+' ovos'}</small></div><strong class="mz-lot-value">${item.value==null?'Sem medição':number(item.value)+'%'}</strong>${item.good==null?'':`<span class="mz-lot-dot ${item.good?'good':'bad'}" role="img" aria-label="${item.good?'Igual ou melhor que a meta':'Pior que a meta'}"></span>`}<small class="mz-lot-detail">${escape(difference)}</small><div class="mz-lot-track" aria-hidden="true"><span style="width:${Math.max(0,Math.min(100,item.value??0))}%"></span></div></li>`;
      }).join('')}</ol><div class="mz-lot-more"><span>${Math.min(shown,model.items.length)} de ${model.items.length} lotes</span>${shown<model.items.length?'<button type="button" class="mz-button" data-lots-more>Mostrar mais</button>':''}</div>`:'<p class="mz-lot-state" role="status">Sem lotes no período selecionado</p>'}`;
    }
    element.addEventListener('click',event=>{if(event.target.closest('[data-lots-more]')){const top=element.scrollTop;shown+=10;render(current);element.scrollTop=top;element.querySelector('[data-lots-more]')?.focus({preventScroll:true});}});
    return {element,render};
  }
  const api={scopeRows,aggregate,create};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MatrizesLotList=api;
})(globalThis);
