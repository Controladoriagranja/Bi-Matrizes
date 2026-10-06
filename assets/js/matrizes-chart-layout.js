/* Geometria real dos rótulos, independente das medidas e dos datasets. */
(function(root){
  'use strict';
  function intersects(a,b,gap=6){return a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;}
  function resolveLabelPositions(candidates,bounds){
    const accepted=[];
    for(const item of [...candidates].sort((a,b)=>b.priority-a.priority||a.seriesIndex-b.seriesIndex||a.index-b.index)){
      const {host,width,height}=item;
      if(!host||![host.x,host.y,host.width,host.height,width,height].every(Number.isFinite))continue;
      if(item.stack&&(host.height<height+8||host.width<width+4))continue;
      const x=host.x+host.width/2-width/2;
      const above={x,y:host.y-height-10,width,height};
      const below={x,y:host.y+host.height+10,width,height};
      const inside={x,y:host.y+(host.height-height)/2,width,height};
      const positions=item.stack?[inside]:item.line?[above,below]:[above];
      const rect=positions.find(rect=>rect.x>=bounds.x&&rect.y>=bounds.y&&rect.x+rect.width<=bounds.x+bounds.width&&rect.y+rect.height<=bounds.y+bounds.height&&!accepted.some(old=>intersects(rect,old)));
      if(rect)accepted.push({...item,...rect});
    }
    return accepted;
  }
  const jobs=new WeakMap();
  function flush(chart){
    const job=jobs.get(chart);if(!job||job.painting||chart.isDisposed())return;
    const positions=resolveLabelPositions([...job.candidates.values()].filter(item=>{const point=chart.convertToPixel({seriesIndex:item.seriesIndex},[item.index,item.value]);return Array.isArray(point)&&chart.containPixel({gridIndex:0},point);}),{x:4,y:4,width:chart.getWidth()-8,height:chart.getHeight()-44});
    const signature=JSON.stringify(positions.map(item=>[item.seriesIndex,item.index,item.x,item.y,item.width,item.height,item.text]));
    if(signature===job.signature)return;
    job.signature=signature;job.painting=true;
    try{
      chart.setOption({graphic:[{id:'mz-readable-labels',type:'group',$action:'replace',silent:true,z:100,children:positions.map(item=>({type:'group',silent:true,z:100,children:[
        {type:'rect',silent:true,z:100,shape:{x:item.x,y:item.y,width:item.width,height:item.height,r:3},style:{fill:job.theme.bg}},
        {type:'text',silent:true,z:101,style:{x:item.x+item.width/2,y:item.y+item.height/2,text:item.text,align:'center',verticalAlign:'middle',font:'600 11px "Geist Variable", sans-serif',fill:job.theme.fg}}
      ]}))}]});
    }finally{job.painting=false;}
  }
  function configure(chart,spec,data,theme,selected){
    if(!jobs.has(chart))chart.on('finished',()=>queueMicrotask(()=>flush(chart)));
    const job={candidates:new Map(),theme,painting:false,signature:null};jobs.set(chart,job);
    return seriesIndex=>params=>{
      const index=params.dataIndex,key=`${seriesIndex}:${index}`;
      if(!selected[seriesIndex].has(index)){job.candidates.delete(key);return {hideOverlap:false};}
      const series=spec.series[seriesIndex],value=data[index]?.[series.key];
      const host=params.rect||params.hostRect;
      if(value==null||!host||!params.labelRect)return {hideOverlap:false};
      job.candidates.set(key,{seriesIndex,index,line:series.type==='line',stack:!!series.stack,host:{...host},width:params.labelRect.width,height:params.labelRect.height,
        value,priority:selected[seriesIndex].priorities?.get(index)||0,text:Number(value).toLocaleString('pt-BR',{maximumFractionDigits:1})});
      return {hideOverlap:false};
    };
  }
  const api={intersects,resolveLabelPositions,configure,flush};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MatrizesChartLayout=api;
})(typeof globalThis!=='undefined'?globalThis:this);
