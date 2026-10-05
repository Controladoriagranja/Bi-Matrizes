(function (root) {
  'use strict';
  const series = (key, name, type='line', extras={}) => ({key,name,type,...extras});
  const compare = (key,label,std,diff,unit='%') => [series(key,label,'bar'),series(std,'STD','bar',{color:1}),...(diff?[series(diff,'Diferença','line',{axis:1,unit:unit==='g'?'%':'pp',color:2})]:[])];
  const pages = {
    recria: {file:'index.html',module:'Recria',title:'Recria',subtitle:'Viabilidade, desenvolvimento e uniformidade por semana de vida.',table:'acerto_produtor_recria',calc:'recria',filters:['farm','sex','lot','status','lineage','age'],group:'age',
      charts:[
        {id:'viabilidade',title:'Viabilidade',axis:'Semana de vida',series:compare('viab','Viabilidade','viabStd','viabDiff')},
        {id:'uniformidade',title:'Uniformidade e CV',axis:'Semana de vida',series:[series('uniform','Uniformidade'),series('uniformStd','STD Uniformidade','line',{dash:true,color:1}),series('cv','CV','line',{color:2})]},
        {id:'peso',title:'Peso médio',axis:'Semana de vida',unit:'g',series:compare('weight','Peso médio','weightStd','weightDiff','g')},
        {id:'gad',title:'Ganho médio diário',axis:'Semana de vida',unit:'g/dia',series:compare('gad','GAD','gadStd')}
      ],kpis:[['viab','Viabilidade','%'],['uniform','Uniformidade','%'],['weight','Peso médio','g'],['gad','GAD','g/dia']]},
    producao: {file:'producao.html',module:'Produção',title:'Produção de ovos',subtitle:'Produção, aproveitamento e qualidade dos ovos na granja.',table:'granja',calc:'production',filters:['farm','lot','house','lineage','age'],group:'week',
      charts:[
        {id:'producao',title:'Produção semanal',axis:'Semana',series:compare('production','Produção','productionStd','diff')},
        {id:'aproveitamento',title:'Aproveitamento na granja',axis:'Semana',series:[series('use','Aproveitamento','bar',{stack:'total'}),series('loss','Perdas','bar',{stack:'total',color:1}),series('useStd','Meta / STD','line',{dash:true,color:2})]},
        {id:'cama',title:'Ovos de cama',axis:'Semana',series:[series('bed','Ovos de cama'),series('bedStd','Meta / STD','line',{dash:true,color:1})]},
        {id:'perdas',title:'Perdas da produção',axis:'Semana',series:['trincado','vazado','sujo','duas_gemas','deformado','pequeno'].map((key,i)=>series(key,['Trincados','Vazados','Sujos','Duas gemas','Deformados','Pequenos'][i],'bar',{stack:'perdas',color:i}))}
      ],kpis:[['production','Produção','%'],['use','Aproveitamento','%'],['bed','Ovos de cama','%'],['loss','Perdas','%']]},
    'producao-curvas': {file:'producao-curvas.html',module:'Produção',title:'Curvas de produção',subtitle:'Evolução diária e curva de produção por lote e idade.',table:'granja',extraTable:'acerto_produtor_producao',calc:'production',filters:['farm','lot','house','lineage','age'],group:'date',
      charts:[
        {id:'diaria',title:'Produção por dia',axis:'Data',wide:true,series:[series('production','Produção'),series('productionStd','STD','line',{color:1})]},
        {id:'curva',title:'Curva de produção por lote',axis:'Idade (semanas)',wide:true,source:'extra',group:'age',calc:'curve',series:[series('production','Produção'),series('productionStd','STD','line',{color:1})]}
      ],kpis:[['production','Produção no período','%'],['use','Aproveitamento','%'],['bed','Ovos de cama','%']]},
    incubatorio: {file:'incubatorio.html',module:'Incubatório',title:'Eclosão e descarte',subtitle:'Resultado semanal e mensal dos nascimentos no incubatório.',table:'eclosao',calc:'hatch',filters:['stage','origin','farm','lot','lineage','age'],group:'week',
      charts:[
        {id:'eclosao',title:'Eclosão semanal',axis:'Semana de eclosão',series:compare('hatch','Eclosão','hatchStd','diff')},
        {id:'descarte',title:'Descarte de pintos',axis:'Semana de eclosão',series:[series('discard','Descarte'),series('discardTarget','Meta','line',{dash:true,color:1})]},
        {id:'eclosao-mes',title:'Eclosão por mês',axis:'Mês de eclosão',group:'monthPeriod',series:compare('hatch','Eclosão','hatchStd','diff')},
        {id:'descarte-mes',title:'Descarte por mês',axis:'Mês de eclosão',group:'monthPeriod',series:[series('discard','Descarte'),series('discardTarget','Meta','line',{dash:true,color:1})]}
      ],kpis:[['hatch','Eclosão','%'],['hatchStd','STD Eclosão','%'],['discard','Descarte','%']]},
    'incubatorio-historico': {file:'incubatorio-historico.html',module:'Incubatório',title:'Idade e histórico de eclosão',subtitle:'Comparação por faixa etária, ano e idade das matrizes.',table:'eclosao',calc:'hatch',filters:['stage','origin','farm','lot','lineage','age'],group:'week',allYears:true,
      charts:[
        {id:'etaria',title:'Eclosão por faixa etária',axis:'Semana de eclosão',series:[series('young','Até 35 semanas','bar'),series('middle','36 a 50 semanas','bar',{color:1}),series('old','51 semanas ou mais','bar',{color:2})]},
        {id:'anual',title:'Eclosões anuais',axis:'Ano de eclosão',group:'year',series:compare('hatch','Eclosão','hatchStd','diff')},
        {id:'idade',title:'Eclosão por idade',axis:'Idade (semanas)',wide:true,group:'age',series:[series('hatch','Eclosão'),series('hatchStd','STD','line',{color:1})]}
      ],kpis:[['hatch','Eclosão','%'],['young','Até 35 semanas','%'],['middle','36 a 50 semanas','%'],['old','51 semanas ou mais','%']]},
    incubacao: {file:'incubacao.html',module:'Incubatório',title:'Incubação e estoque',subtitle:'Volume incubado e tempo de armazenamento dos ovos.',table:'incubacao',calc:'incubation',filters:['stage','origin','farm','lot','age'],group:'week',
      charts:[
        {id:'incubacao',title:'Incubação',axis:'Semana de incubação',unit:'ovos',series:[series('incubated','Incubados','bar'),series('incubationTarget','Meta','line',{dash:true,color:1})]},
        {id:'estoque',title:'Dias em estoque do ovo incubado',axis:'Semana de incubação',unit:'dias',series:[series('minimum','Mínimo'),series('stock','Média ponderada','line',{color:2}),series('maximum','Máximo','line',{color:1})]}
      ],kpis:[['incubated','Ovos incubados','ovos'],['minimum','Estoque mínimo','dias'],['stock','Estoque médio','dias'],['maximum','Estoque máximo','dias']]},
    embrio: {file:'embrio.html',module:'Embriodiagnóstico',title:'Embriodiagnóstico',subtitle:'Não eclodidos, fertilidade e causas de mortalidade embrionária.',table:'embrio',calc:'embryo',filters:['stage','origin','farm','lot','lineage','age'],group:'week',
      charts:[
        {id:'nao-eclodidos',title:'Não eclodidos',axis:'Semana',wide:true,series:[series('hatch','Eclosão','bar',{stack:'total'}),series('unhatched','Não eclodidos','bar',{stack:'total',color:1})]},
        {id:'infertilidade',title:'Infertilidade',axis:'Semana',series:[series('infertile','Infertilidade'),series('infertileStd','STD','line',{dash:true,color:1})]},
        {id:'contaminados',title:'Contaminados',axis:'Semana',series:[series('contaminated','Contaminados'),series('contaminatedStd','STD','line',{dash:true,color:1})]},
        {id:'trincados',title:'Trincados',axis:'Semana',series:[series('crackInc','Incubadora'),series('crackTrans','Transferência','line',{color:3})]},
        {id:'mortalidade-inicial',title:'Mortalidade inicial · 0 a 7 dias',axis:'Semana',series:[series('initial','Inicial'),series('initialStd','STD','line',{dash:true,color:1})]},
        {id:'mortalidade-media',title:'Mortalidade intermediária · 8 a 14 dias',axis:'Semana',series:[series('middle','Intermediária'),series('middleStd','STD','line',{dash:true,color:1})]},
        {id:'mortalidade-final',title:'Mortalidade final · 15 a 21 dias',axis:'Semana',series:[series('final','Final'),series('finalStd','STD','line',{dash:true,color:1})]}
      ],kpis:[['unhatched','Não eclodidos','%'],['infertile','Infertilidade','%'],['contaminated','Contaminados','%'],['final','Mortalidade final','%']]}
  };
  // Os prints representam seções de quatro telas, não páginas independentes.
  const productionCurves=pages['producao-curvas'].charts.map(chart=>({...chart,group:chart.group||'date',section:'Curvas de produção'}));
  pages.producao.extraTable='acerto_produtor_producao';
  pages.producao.charts=[...pages.producao.charts.map(chart=>({...chart,section:'Produção e qualidade'})),...productionCurves];
  pages.producao.subtitle='Produção, qualidade dos ovos e curvas de desempenho por lote.';
  const hatchHistory=pages['incubatorio-historico'].charts.map(chart=>({...chart,section:'Idade e histórico',allPeriods:chart.id==='anual'}));
  const incubationCharts=pages.incubacao.charts.map(chart=>({...chart,source:'extra',calc:'incubation',group:'week',section:'Incubação e estoque'}));
  pages.incubatorio.extraTable='incubacao';
  pages.incubatorio.title='Incubatório';
  pages.incubatorio.subtitle='Eclosão, descarte, faixas etárias, incubação e estoque dos ovos.';
  pages.incubatorio.charts=[...pages.incubatorio.charts.map(chart=>({...chart,section:'Eclosão e descarte'})),...hatchHistory,...incubationCharts];
  root.MatrizesPages={recria:pages.recria,producao:pages.producao,incubatorio:pages.incubatorio,embrio:pages.embrio};
})(globalThis);
