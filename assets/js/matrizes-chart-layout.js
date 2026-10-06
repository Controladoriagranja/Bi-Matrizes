/* Geometria real dos rótulos, independente das medidas e dos datasets. */
(function(root){
  'use strict';
  function formatValue(value,unit='%',digits=1){
    if(value==null||!Number.isFinite(Number(value)))return '—';
    return Number(value).toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits})+(unit==='%'?'%':'');
  }
  function intersects(a,b,gap=6){return a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;}
  function barRotation(width,height,slotWidth){return width+4<=slotWidth?0:Math.PI/2;}
  function resolveLabelPositions(candidates,bounds,geometry={}){
    const accepted=[];
    const bars=candidates.filter(item=>!item.line).map(item=>item.host).filter(Boolean);
    for(const item of [...candidates].sort((a,b)=>b.priority-a.priority||a.seriesIndex-b.seriesIndex||a.index-b.index)){
      const {host}=item;
      let {width,height}=item;
      if(!host||![host.x,host.y,host.width,host.height,width,height].every(Number.isFinite))continue;
      const rotation=!item.line&&!item.stack?barRotation(width,height,item.slotWidth??geometry.slotWidth??Infinity):0;
      const textWidth=width,textHeight=height;
      if(rotation)[width,height]=[height,width];
      const x=host.x+host.width/2-width/2;
      const above={x,y:host.y-height-7,width,height};
      const below={x,y:host.y+host.height+10,width,height};
      const inside={x,y:host.y+(host.height-height)/2,width,height};
      const extra=Math.max(height+8,Math.min(45,bounds.height*0.12));
      const positions=[];
      if(item.stack){
        if(host.height>=height+6)positions.push({...inside,inside:true});
        // Un segmento pequeno tenta posições externas: nunca é descartado só pela altura.
        for(const offset of [0,-height-6,height+6,-2*(height+6),2*(height+6)]){
          positions.push({x:host.x+host.width+8,y:inside.y+offset,width,height,guide:true,external:true});
          positions.push({x:host.x-width-8,y:inside.y+offset,width,height,guide:true,external:true});
        }
        const stackTop=Math.min(host.y,...candidates.filter(other=>other.stack&&other.index===item.index&&other.host).map(other=>other.host.y));
        for(let step=0;step<4;step++)positions.push({...above,y:stackTop-height-8-step*(height+6),guide:true,external:true});
      }else if(item.line){
        positions.push(above,below);
        for(let step=1;step<=3;step++)positions.push({...above,y:above.y-extra*step,guide:true},{...below,y:below.y+extra*step,guide:true});
      }else {
        positions.push(above);
        // barMaxWidth pode manter o par próximo mesmo num plot largo.
        // Duas alturas acima do topo preservam horizontal e mostram ambos os valores.
        if(!rotation)for(let step=1;step<=2;step++)positions.push({...above,y:above.y-step*(height+6)});
      }
      const rect=positions.find(rect=>rect.x>=bounds.x&&rect.y>=bounds.y&&rect.x+rect.width<=bounds.x+bounds.width&&rect.y+rect.height<=bounds.y+bounds.height
        &&!accepted.some(old=>intersects(rect,old,item.line?6:2))
        &&(!rect.external||!bars.some(bar=>intersects(rect,bar,2))));
      if(rect){
        const point=[host.x+host.width/2,host.y+host.height/2];
        const end=[Math.max(rect.x,Math.min(point[0],rect.x+rect.width)),Math.max(rect.y,Math.min(point[1],rect.y+rect.height))];
        const guide=rect.guide?[point,[(point[0]+end[0])/2,point[1]],end]:null;
        accepted.push({...item,...rect,rotation,textWidth,textHeight,guide});
      }
    }
    return accepted;
  }
  const jobs=new WeakMap();
  function flush(chart){
    const job=jobs.get(chart);if(!job||job.painting||chart.isDisposed())return;
    const plot=chart.getModel().getComponent('grid')?.coordinateSystem?.getRect();
    const extent=chart.getModel().getComponent('xAxis')?.axis?.scale?.getExtent()||[0,job.count-1];
    const groups=new Set(job.spec.series.filter(item=>item.type==='bar').map((item,index)=>item.stack||`bar-${index}`)).size||1;
    const slotWidth=(plot?.width||chart.getWidth()-100)/Math.max(1,extent[1]-extent[0]+1)/groups;
    const candidates=[...job.candidates.values()].flatMap(item=>{
      const point=chart.convertToPixel({seriesIndex:item.seriesIndex},[item.index,item.value]);
      if(!Array.isArray(point)||!chart.containPixel({gridIndex:0},point))return [];
      if(item.line)return [{...item,host:{x:point[0]-3,y:point[1]-3,width:6,height:6}}];
      const seriesData=chart.getModel().getSeriesByIndex(item.seriesIndex).getData();
      const layout=seriesData.getItemLayout(seriesData.indexOfRawIndex(item.index));
      if(!layout)return [];
      return [{...item,host:{x:Math.min(layout.x,layout.x+layout.width),y:Math.min(layout.y,layout.y+layout.height),width:Math.abs(layout.width),height:Math.abs(layout.height)}}];
    });
    const positions=resolveLabelPositions(candidates,
      {x:plot?.x||4,y:4,width:plot?.width||chart.getWidth()-8,height:(plot?plot.y+plot.height:chart.getHeight()-44)-4},{slotWidth});
    chart.mzLabelPositions=positions;
    const signature=JSON.stringify(positions.map(item=>[item.seriesIndex,item.index,item.x,item.y,item.width,item.height,item.rotation,item.guide,item.text]));
    if(signature===job.signature)return;
    job.signature=signature;job.painting=true;
    try{
      chart.setOption({graphic:[{id:'mz-readable-labels',type:'group',$action:'replace',silent:true,z:100,children:positions.flatMap(item=>{
        const id=`mz-label-${item.seriesIndex}-${item.index}`,cx=item.x+item.width/2,cy=item.y+item.height/2;
        const transform={rotation:item.rotation,originX:cx,originY:cy};
        return [
          ...(item.guide?[{id:`${id}-guide`,type:'polyline',silent:true,z:99,shape:{points:item.guide},style:{stroke:item.color,lineWidth:1,opacity:0.65,fill:null}}]:[]),
          {id:`${id}-bg`,type:'rect',silent:true,z:100,...transform,shape:{x:cx-item.textWidth/2,y:cy-item.textHeight/2,width:item.textWidth,height:item.textHeight,r:2},style:{fill:job.theme.bg}},
          {id:`${id}-text`,type:'text',silent:true,z:101,...transform,style:{x:cx,y:cy,text:item.text,align:'center',verticalAlign:'middle',font:`600 ${item.line?11:10}px "Geist Variable", sans-serif`,fill:job.theme.fg}}
        ];
      })}]},{replaceMerge:['graphic']});
    }finally{job.painting=false;}
  }
  function configure(chart,spec,data,theme,selected){
    if(!jobs.has(chart))chart.on('finished',()=>queueMicrotask(()=>flush(chart)));
    const job={candidates:new Map(),theme,spec,count:data.length,painting:false,signature:null};jobs.set(chart,job);
    // Índices originais: labelLayout usa índices internos após dataZoom.
    // Mede o texto pela mesma fonte do SVG e obtém o host real só após renderizar.
    spec.series.forEach((series,seriesIndex)=>{
      if(series.type==='line'&&spec.series.some(item=>item.type==='bar'))return;
      for(const index of selected[seriesIndex]){
        const value=data[index]?.[series.key];if(value==null)continue;
        const line=series.type==='line',text=formatValue(value,series.unit||spec.unit||'%',series.digits??spec.digits??1);
        const measured=new root.echarts.graphic.Text({style:{text,font:`600 ${line?11:10}px "Geist Variable", sans-serif`}}).getBoundingRect();
        job.candidates.set(`${seriesIndex}:${index}`,{seriesIndex,index,line,stack:!!series.stack,width:measured.width+4,height:measured.height+2,
          color:theme.series[series.color??seriesIndex%theme.series.length],value:spec.visualShares?.[series.key]??value,
          priority:selected[seriesIndex].priorities?.get(index)||0,text});
      }
    });
    return ()=>()=>({hideOverlap:false});
  }
  const api={formatValue,intersects,barRotation,resolveLabelPositions,configure,flush};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MatrizesChartLayout=api;
})(typeof globalThis!=='undefined'?globalThis:this);

