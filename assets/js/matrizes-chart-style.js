/* Apresentação compartilhada: não altera as medidas do relatório. */
(() => {
  function series(spec,data,theme,width,height,chart) {
    const mixed=spec.series.some(item=>item.type==='bar')&&spec.series.some(item=>item.type==='line');
    const selected=MatrizesChartLabels.selectLabels(spec,data,width,height);
    const layout=MatrizesChartLayout.configure(chart,spec,data,theme,selected);
    const lineColors=theme.dark?['#71c9ff','#d5b6ff','#79e5b2']:['#0866a8','#7139a8','#16734b'];
    let lineIndex=0;
    return spec.series.map((item,index)=>{
      const line=item.type==='line',color=line&&mixed?lineColors[lineIndex++%lineColors.length]:theme.series[item.color??index%theme.series.length];
      return {
        name:item.name,type:item.type,data:data.map(point=>point[item.key]??null),yAxisIndex:item.axis||0,stack:item.stack,
        smooth:line?0.3:false,connectNulls:false,symbolSize:line&&mixed?6:5,showSymbol:true,
        z:line?5:2,barMaxWidth:28,
        itemStyle:{color,borderRadius:item.stack?0:[3,3,0,0]},
        lineStyle:{color,width:line&&mixed?3.5:2.5,type:item.dash?'dashed':'solid'},
        emphasis:{focus:'series'},labelLayout:layout(index),
        label:{opacity:0,show:!line||!mixed,position:item.stack?'inside':'top',
          rotate:0,
          offset:[0,0],distance:line?9:7,
          color:item.stack?'#fff':theme.fg,backgroundColor:item.stack?'#0009':theme.bg,
          borderRadius:3,padding:item.stack?[1,2]:[2,3],fontSize:11,fontWeight:600,
          formatter:params=>params.value==null||!selected[index].has(params.dataIndex)?'':Number(params.value).toLocaleString('pt-BR',{maximumFractionDigits:1})}
      };
    });
  }
  window.MatrizesChartStyle={series};
})();
