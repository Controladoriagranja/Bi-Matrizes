const {test}=require('node:test');
const assert=require('node:assert/strict');
const L=require('../assets/js/matrizes-chart-labels.js');
test('referência constante aparece no máximo uma vez e valores são preservados',()=>{
  const spec={series:[{key:'uniform',name:'Uniformidade',type:'line'},{key:'uniformStd',name:'STD',type:'line'}]};
  const data=Array.from({length:22},(_,i)=>({uniform:90-i*.1,uniformStd:80}));const original=JSON.stringify(data);
  const selected=L.selectLabels(spec,data,640);assert.ok(selected[0].size<22);assert.ok(selected[1].size<=1);
  if(selected[1].size)assert.ok(selected[1].has(21));assert.equal(JSON.stringify(data),original);
});
test('extremos, endpoints e anomalias superam pontos redundantes',()=>{
  const spec={series:[{key:'actual',name:'Real',type:'line'}]};
  const data=Array.from({length:22},(_,i)=>({actual:50+i*.1}));data[10].actual=95;data[15].actual=10;
  const selected=L.selectLabels(spec,data,900)[0];assert.ok(selected.has(0));assert.ok(selected.has(21));assert.ok(selected.has(10));assert.ok(selected.has(15));
});
test('mobile reduz densidade e não repete labels de séries coincidentes',()=>{
  const spec={series:[{key:'actual',name:'Real',type:'line'},{key:'actualStd',name:'STD',type:'line'}]};
  const data=Array.from({length:22},(_,i)=>({actual:80+i*.1,actualStd:80+i*.1}));
  const desktop=L.selectLabels(spec,data,900),mobile=L.selectLabels(spec,data,320);
  const total=sets=>sets.reduce((sum,set)=>sum+set.size,0);assert.ok(total(mobile)<total(desktop));
  for(const index of mobile[1])assert.ok(!mobile[0].has(index));
});
test('gráficos mistos mantêm todos os pontos de linha sem textos permanentes',()=>{
  const spec={series:[{key:'actual',name:'Real',type:'bar'},{key:'diff',name:'Diferença',type:'line',axis:1}]};
  const data=[{actual:50,diff:1},{actual:70,diff:2}];const selected=L.selectLabels(spec,data,600);
  assert.equal(selected[1].size,0);assert.ok(selected[0].size>0);
});

test('CV não é comparado ao STD de uniformidade e série plana não produz falsos alertas',()=>{
  const spec={series:[{key:'uniform',name:'Uniformidade',type:'line'},{key:'uniformStd',name:'STD',type:'line'},{key:'cv',name:'CV',type:'line'}]};
  const data=Array.from({length:22},()=>({uniform:85,uniformStd:80,cv:6}));const selected=L.selectLabels(spec,data,640);
  assert.ok(selected[2].size<22);assert.ok(selected[0].size<22);
});

test('preenche espaço com intermediários distribuídos, sem repetir STD constante',()=>{
  const spec={series:[{key:'actual',name:'Real',type:'line'},{key:'actualStd',name:'STD',type:'line'}]};
  const data=Array.from({length:22},()=>({actual:95,actualStd:80}));const labels=L.selectLabels(spec,data,900);
  assert.ok(labels[0].size>2);assert.ok([...labels[0]].some(index=>index>5&&index<16));assert.ok(labels[1].size<=1);
});

test('área ampliada seleciona materialmente mais rótulos de linha',()=>{
  const spec={series:[{key:'actual',type:'line',name:'Real'}]};
  const data=Array.from({length:22},(_,i)=>({actual:50+Math.sin(i/4)*5}));
  const normal=L.selectLabels(spec,data,500,285)[0],expanded=L.selectLabels(spec,data,1300,850)[0];
  assert.ok(expanded.size>=normal.size*1.5);
});

test('zoom recalcula rótulos no intervalo visível sem mudar valores',()=>{
  const spec={series:[{key:'actual',name:'Real',type:'line'}],labels:{visibleStart:10,visibleEnd:17}};
  const data=Array.from({length:52},(_,i)=>({actual:50+i*.1}));const before=JSON.stringify(data);
  const labels=L.selectLabels(spec,data,700,400)[0];assert.ok(labels.size>=3);for(const index of labels)assert.ok(index>=10&&index<=17);assert.equal(JSON.stringify(data),before);
});

test('barras agrupadas incluem todos os valores válidos, inclusive STD constante',()=>{
  const spec={series:[{key:'viab',type:'bar'},{key:'viabStd',name:'STD',type:'bar'},{key:'diff',type:'line'}]};
  const data=Array.from({length:22},()=>({viab:99,viabStd:98,diff:1}));
  const labels=L.selectLabels(spec,data,350,285);assert.equal(labels[0].size,22);assert.equal(labels[1].size,22);assert.equal(labels[2].size,0);
});
test('zoom aumenta densidade por ponto e restauração recupera seleção',()=>{
  const spec={series:[{key:'actual',type:'line',name:'Real'}]};
  const data=Array.from({length:52},(_,i)=>({actual:50+Math.sin(i/4)})),original=JSON.stringify(data);
  const before=L.selectLabels(spec,data,700,400)[0];
  const zoom=L.selectLabels({...spec,labels:{visibleStart:10,visibleEnd:17}},data,700,400)[0];
  assert.ok(zoom.size/8>before.size/52*2);
  assert.deepEqual([...L.selectLabels(spec,data,700,400)[0]],[...before]);assert.equal(JSON.stringify(data),original);
});
