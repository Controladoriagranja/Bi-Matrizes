/* Seleção de textos permanentes. Dados e escalas não são alterados. */
(function(root){
  'use strict';
  const valid=value=>typeof value==='number'&&Number.isFinite(value);
  const reference=series=>/Std$|Target$/.test(series.key)||/\bSTD\b|meta/i.test(series.name);
  function getResponsiveLabelDensity(points,width) {
    const mobile=width<420,plot=Math.max(100,width-100);
    const spacing=points<=8?50:points<=14?65:points<=25?80:105;
    return Math.max(2,Math.min(mobile?6:points<=8?18:points<=14?12:points<=25?9:6,Math.floor(plot/(spacing*(mobile?1.2:1)))));
  }
  function selectLabels(spec,data,width,height=285) {
    const selected=spec.series.map(()=>new Set());
    const mixed=spec.series.some(series=>series.type==='bar')&&spec.series.some(series=>series.type==='line');
    const budget=spec.labels?.maxLabels||getResponsiveLabelDensity(data.length,width);
    const candidates=[],axes=new Map();
    spec.series.forEach(series=>{
      const values=data.map(row=>row[series.key]).filter(valid),axis=series.axis||0;
      const old=axes.get(axis)||[0,0];
      if(values.length)axes.set(axis,[Math.min(old[0],...values),Math.max(old[1],...values)]);
    });
    spec.series.forEach((series,seriesIndex)=>{
      if(mixed&&series.type==='line')return;
      const indices=data.flatMap((row,index)=>valid(row[series.key])?[index]:[]);
      if(!indices.length)return;
      const values=indices.map(index=>data[index][series.key]);
      const min=Math.min(...values),max=Math.max(...values),constant=Math.abs(max-min)<1e-8,isReference=reference(series);
      const related=spec.series.find(other=>other.key===series.key+'Std');
      const priorities=new Map();
      const add=(index,priority)=>priorities.set(index,Math.max(priority,priorities.get(index)||0));
      if(isReference&&constant)add(indices.at(-1),35);
      else {
        add(indices[0],90);add(indices.at(-1),150);
        if(!constant){add(indices[values.indexOf(min)],140);add(indices[values.indexOf(max)],140);}
        indices.forEach((index,position)=>{
          const value=data[index][series.key],ref=related?data[index][related.key]:null;
          const deviation=valid(ref)?Math.abs(value-ref):0;
          const threshold=spec.labels?.deviationThreshold??Math.max(Math.abs(ref||0)*0.03,(max-min)*0.15,0.5);
          if(!isReference&&(!constant||index===indices[0]||index===indices.at(-1))&&deviation>threshold)add(index,120+Math.min(20,deviation/threshold));
          const previous=position?data[indices[position-1]][series.key]:null;
          const change=valid(previous)?Math.abs(value-previous):0;
          if(change>Math.max(Math.abs(previous||0)*0.05,(max-min)*0.2,0.5))add(index,80+Math.min(10,change/Math.max(0.5,max-min)));
          if(!isReference||!constant)add(index,10);
        });
      }
      const [axisMin,axisMax]=axes.get(series.axis||0)||[0,1];
      for(const [index,priority] of priorities){
        const value=data[index][series.key];
        const text=value.toLocaleString('pt-BR',{maximumFractionDigits:1});
        const x=50+(index+0.5)*Math.max(100,width-100)/Math.max(1,data.length);
        const ratio=(value-axisMin)/Math.max(1e-9,axisMax-axisMin);
        const y=65+(1-ratio)*Math.max(80,height-110);
        candidates.push({seriesIndex,index,priority:priority-(isReference?45:0),x,y,w:text.length*7+14,h:24});
      }
    });
    candidates.sort((a,b)=>b.priority-a.priority||a.seriesIndex-b.seriesIndex||a.index-b.index);
    const accepted=[];
    while(candidates.length){
      candidates.sort((a,b)=>{
        if(a.priority!==b.priority)return b.priority-a.priority;
        const distance=item=>accepted.length?Math.min(...accepted.map(old=>Math.hypot(old.x-item.x,old.y-item.y))):0;
        return distance(b)-distance(a)||a.seriesIndex-b.seriesIndex||a.index-b.index;
      });
      const candidate=candidates.shift();
      if(accepted.length>=budget)break;
      if(accepted.some(old=>Math.abs(old.x-candidate.x)<(old.w+candidate.w)/2+8&&Math.abs(old.y-candidate.y)<(old.h+candidate.h)/2+6))continue;
      selected[candidate.seriesIndex].add(candidate.index);
      if(!selected[candidate.seriesIndex].priorities)selected[candidate.seriesIndex].priorities=new Map();
      selected[candidate.seriesIndex].priorities.set(candidate.index,candidate.priority);accepted.push(candidate);
    }
    return selected;
  }
  const api={getResponsiveLabelDensity,selectLabels};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MatrizesChartLabels=api;
})(typeof globalThis!=='undefined'?globalThis:this);
