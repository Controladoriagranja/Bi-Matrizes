/* Apresentação compartilhada: não altera as medidas do relatório. */
(() => {
  function series(spec,data,theme,width) {
    const mixed=spec.series.some(item=>item.type==='bar')&&spec.series.some(item=>item.type==='line');
    const bars=spec.series.filter(item=>item.type==='bar');
    const grouped=bars.filter(item=>!item.stack).length;
    const dense=grouped>0&&width/Math.max(1,data.length*grouped)<26;
    const lineColors=theme.dark?['#71c9ff','#d5b6ff','#79e5b2']:['#0866a8','#7139a8','#16734b'];
    let lineIndex=0,barIndex=0;
    return spec.series.map((item,index)=>{
      const line=item.type==='line',color=line&&mixed?lineColors[lineIndex++%lineColors.length]:theme.series[item.color??index%theme.series.length];
      const lane=line?index%2:barIndex++%2;
      return {
        name:item.name,type:item.type,data:data.map(point=>point[item.key]??null),yAxisIndex:item.axis||0,stack:item.stack,
        smooth:line?0.3:false,connectNulls:false,symbolSize:line&&mixed?6:5,showSymbol:true,
        z:line?5:2,barMaxWidth:28,
        itemStyle:{color,borderRadius:item.stack?0:[3,3,0,0]},
        lineStyle:{color,width:line&&mixed?3.5:2.5,type:item.dash?'dashed':'solid'},
        emphasis:{focus:'series'},labelLayout:{hideOverlap:true,moveOverlap:'shiftY'},
        label:{show:!line||!mixed,position:item.stack?'inside':line&&lane?'bottom':'top',
          rotate:!line&&!item.stack&&dense&&data.some(point=>Math.abs(point[item.key]||0)>=1000)?45:0,
          offset:!line&&!item.stack&&dense?[0,-lane*18]:[0,0],distance:line?9:7,
          color:item.stack?'#fff':theme.fg,backgroundColor:item.stack?'#0009':theme.bg,
          borderRadius:3,padding:item.stack?[1,2]:[2,3],fontSize:dense?10:11,fontWeight:600,
          formatter:params=>params.value==null?'':Number(params.value).toLocaleString('pt-BR',{maximumFractionDigits:1})}
      };
    });
  }
  window.MatrizesChartStyle={series};
})();
