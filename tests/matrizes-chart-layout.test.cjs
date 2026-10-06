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
test('segmento grande fica dentro; pequeno tenta callout externo',()=>{
  const small=candidate(0,150,{x:100,y:100,width:50,height:8},{stack:true,line:false});
  const large=candidate(1,100,{x:100,y:120,width:50,height:50},{stack:true,line:false});
  const placed=L.resolveLabelPositions([small,large],bounds);assert.equal(placed.length,2);
  assert.ok(placed.find(item=>item.index===0).guide);assert.ok(placed.find(item=>item.index===0).external);
  assert.ok(placed.find(item=>item.index===1).inside);
});

test('usa haste sutil quando acima e abaixo estão ocupados',()=>{
  const host={x:100,y:90,width:6,height:6};
  const placed=L.resolveLabelPositions([candidate(0,150,host),candidate(1,140,host),candidate(2,100,host)],bounds);
  assert.equal(placed.length,3);assert.ok(placed[2].guide);assert.equal(placed[2].guide[0][0],103);
});

test('formatos de percentual, float e inteiro',()=>{assert.equal(L.formatValue(96.93,'%',1),'96,9%');assert.equal(L.formatValue(1250.456,'g',2),'1.250,46');assert.equal(L.formatValue(63.28,'g/ave/dia',0),'63');});

test('barras giram pela largura por barra e voltam a horizontal quando cabe',()=>{
  const item=candidate(0,100,{x:100,y:100,width:12,height:50},{line:false});
  assert.equal(L.resolveLabelPositions([item],bounds,{slotWidth:18})[0].rotation,Math.PI/2);
  assert.equal(L.resolveLabelPositions([item],bounds,{slotWidth:60})[0].rotation,0);
});
test('expansão desenha materialmente mais barras, sem colisão',()=>{
  const build=width=>Array.from({length:44},(_,i)=>candidate(i,100,{x:10+i*width/44,y:90,width:width/60,height:80},{line:false,width:42,height:14}));
  const normal=L.resolveLabelPositions(build(350),{x:0,y:0,width:360,height:240},{slotWidth:350/44});
  const expanded=L.resolveLabelPositions(build(1300),{x:0,y:0,width:1310,height:640},{slotWidth:1300/44});
  assert.ok(expanded.length>=normal.length*1.5);assert.equal(expanded.length,44);
  expanded.forEach((item,index)=>expanded.slice(index+1).forEach(other=>assert.equal(L.intersects(item,other,2),false)));
});
test('segmento só é ocultado se nem posição externa couber',()=>{
  const item=candidate(0,100,{x:0,y:0,width:8,height:3},{stack:true,line:false,width:40,height:20});
  assert.equal(L.resolveLabelPositions([item],{x:0,y:0,width:8,height:3}).length,0);
});
test('empilhadas densas revelam materialmente mais segmentos ao expandir',()=>{
  const build=(width,scale)=>Array.from({length:22},(_,index)=>{
    let y=220*scale;
    return [20,20,20,20,3,2].map((size,seriesIndex)=>{
      y-=size*scale;
      return candidate(index,100,{x:5+index*width/22,y,width:8,height:size*scale},{seriesIndex,stack:true,line:false,width:30,height:14});
    });
  }).flat();
  const normal=L.resolveLabelPositions(build(350,1),{x:0,y:0,width:360,height:260});
  const expanded=L.resolveLabelPositions(build(1300,3),{x:0,y:0,width:1310,height:780});
  assert.ok(expanded.length>=normal.length*1.5);assert.equal(expanded.length,132);
});
