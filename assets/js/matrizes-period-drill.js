/* Dia | Semana: adaptação de PcpPeriodFlags/PcpWeekDrill.
 * Usa MatrizesData.week: não altera a convenção semanal ou os indicadores.
 */
(function(root){
  'use strict';
  function visibleRows(rows,period,limit,D){
    const keys=new Set(D.chartGroups(rows,'week',limit).map(([key])=>key));
    if(period.drilledWeek&&!keys.has(period.drilledWeek)){
      period.drilledWeek=null;period.mode='semana';
    }
    if(period.mode!=='dia')return rows;
    return rows.filter(row=>keys.has(row.week)&&(!period.drilledWeek||row.week===period.drilledWeek));
  }
  function dayLabel(value,D){
    const d=D.date(value);
    if(!d)return value;
    return d.toLocaleDateString('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit'})+'\n'+
      d.toLocaleDateString('pt-BR',{timeZone:'UTC',weekday:'short'});
  }
  function create(id,onChange,{lot=false}={}){
    const period={mode:'semana',drilledWeek:null};
    let lotVisible=false;
    const flags=document.createElement('fieldset');flags.className='mz-period-flags';
    flags.setAttribute('aria-label',lot?'Exibir por dia, semana ou lote':'Exibir gráfico por dia ou semana');
    const legend=document.createElement('legend');legend.textContent='Exibir por';flags.append(legend);
    for(const [value,title] of [['dia','Dia'],['semana','Semana'],...(lot?[['lote','Lote']]:[])]){
      const label=document.createElement('label'),input=document.createElement('input'),span=document.createElement('span');
      input.type='radio';input.name='period-'+id;input.value=value;input.checked=value==='semana';span.textContent=title;
      if(lot){
        const select=()=>{
          if(value==='lote')lotVisible=true;
          else if(lotVisible){lotVisible=false;if(period.mode!==value){period.mode=value;period.drilledWeek=null;}}
          else {period.mode=value;period.drilledWeek=null;}
          sync();onChange();
        };
        input.addEventListener('click',select);
        input.addEventListener('change',()=>{if(flags.dataset.selection!==value)select();});
      }else{
        input.addEventListener('change',()=>{period.mode=value;period.drilledWeek=null;sync();onChange();});
        // Como no PCP, clicar no Dia já ativo sai do drill para todos os dias visíveis.
        input.addEventListener('click',()=>{if(period.mode===value&&period.drilledWeek){period.drilledWeek=null;sync();onChange();}});
      }
      label.append(input,span);flags.append(label);
    }
    const bar=document.createElement('div');bar.className='mz-week-drill';bar.setAttribute('role','status');
    const hint=document.createElement('span'),backButton=document.createElement('button');
    backButton.type='button';backButton.className='mz-drill-back';backButton.textContent='← Voltar às semanas';backButton.addEventListener('click',back);
    bar.append(hint,backButton);
    function sync(){
      flags.dataset.selection=lotVisible?'lote':period.mode;
      for(const radio of flags.querySelectorAll('input'))radio.checked=radio.value===(lotVisible?'lote':period.mode);
      bar.hidden=lotVisible||period.mode==='dia'&&!period.drilledWeek;
      hint.textContent=period.drilledWeek?period.drilledWeek.replace('-S',' · Semana ')+' · Clique na data ou use Voltar às semanas.':'Clique na semana para ver os dias.';
      backButton.hidden=!period.drilledWeek;
    }
    function back(){lotVisible=false;period.mode='semana';period.drilledWeek=null;sync();onChange();}
    function drill(key){lotVisible=false;period.mode='dia';period.drilledWeek=key;sync();onChange();}
    function bind(chart){
      chart.on('click',event=>{
        if(period.mode==='dia'){
          if(period.drilledWeek&&event.componentType==='xAxis')back();
          return;
        }
        const index=event.componentType==='series'?event.dataIndex:
          event.componentType==='xAxis'?chart.mzPoints.findIndex(point=>point.label===String(event.value)):-1;
        const point=chart.mzPoints?.[index];
        if(point?.filterKey==='week')drill(point.filterValue);
      });
    }
    sync();return {period,flags,bar,sync,bind,back,drill,isLot:()=>lotVisible};
  }
  const api={create,visibleRows,dayLabel};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MatrizesWeekDrill=api;
})(globalThis);
