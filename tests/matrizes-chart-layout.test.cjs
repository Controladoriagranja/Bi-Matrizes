const {test}=require('node:test');const assert=require('node:assert/strict');
const L=require('../assets/js/matrizes-chart-layout.js');
const bounds={x:0,y:0,width:300,height:200};
const candidate=(index,priority,host,extras={})=>({index,seriesIndex:0,priority,host,width:40,height:20,line:true,...extras});
test('linha tenta acima e reposiciona abaixo sem colidir com outra série',()=>{
  const a=candidate(0,150,{x:100,y:90,width:6,height:6});
  const b=candidate(1,100,{x:100,y:90,width:6,height:6},{seriesIndex:1});
  const placed=L.resolveLabelPositions([b,a],bounds);assert.equal(placed.length,2);
  assert.ok(placed[0].y+placed[0].height<a.host.y);assert.ok(placed[1].y>b.host.y+b.host.height);assert.equal(L.intersects(...placed),false);
});
test('oculta texto quando não cabe, sem modificar os candidatos',()=>{
  const a=candidate(0,150,{x:100,y:90,width:6,height:6});
  const candidates=[a,{...a,index:1,priority:100},{...a,index:2,priority:50}];const original=JSON.stringify(candidates);
  assert.ok(L.resolveLabelPositions(candidates,bounds).length<=3);assert.equal(JSON.stringify(candidates),original);
});
test('segmentos empilhados pequenos não recebem textos internos',()=>{
  const small=candidate(0,150,{x:100,y:100,width:50,height:8},{stack:true,line:false});
  const large=candidate(1,100,{x:100,y:120,width:50,height:50},{stack:true,line:false});
  const placed=L.resolveLabelPositions([small,large],bounds);assert.equal(placed.length,1);assert.equal(placed[0].index,1);
});

test('usa haste sutil quando acima e abaixo estão ocupados',()=>{
  const host={x:100,y:90,width:6,height:6};
  const placed=L.resolveLabelPositions([candidate(0,150,host),candidate(1,140,host),candidate(2,100,host)],bounds);
  assert.equal(placed.length,3);assert.ok(placed[2].guide);assert.equal(placed[2].guide[0][0],103);
});

test('formatos de percentual, float e inteiro',()=>{assert.equal(L.formatValue(96.93,'%',1),'96,9%');assert.equal(L.formatValue(1250.456,'g',2),'1.250,46');assert.equal(L.formatValue(63.28,'g/ave/dia',0),'63');});
