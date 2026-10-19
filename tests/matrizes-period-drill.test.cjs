const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../assets/js/matrizes-data.js'),P=require('../assets/js/matrizes-period-drill.js');
const rows=dates=>dates.map((date,index)=>D.normalize('granja',{data:date,lote:'A',saldo_femeas:1000,ovos_produzidos:100+index,incubaveis_granja:90,cama:10,prod_std_pct:68,aprov_std_pct:97}));
test('Semana permanece padrão e limite não muda agregação semanal',()=>{
 const values=rows(['2026-09-28','2026-09-29','2026-10-05']);
 const result=P.visibleRows(values,{mode:'semana',drilledWeek:null},8,D);
 assert.deepEqual(result,values);
});
test('Drill agrupa somente datas reais da semana, atravessando mês',()=>{
 const values=rows(['2026-09-28','2026-09-30','2026-10-01','2026-10-04','2026-10-05']);
 const result=P.visibleRows(values,{mode:'dia',drilledWeek:D.week(D.date('2026-10-01'))},8,D);
 assert.deepEqual(result.map(r=>r.date),['2026-09-28','2026-09-30','2026-10-01','2026-10-04']);
});
test('Dia mostra dias das últimas oito semanas, não somente oito dias',()=>{
 const values=rows(Array.from({length:70},(_,i)=>D.iso(new Date(Date.UTC(2026,6,i+1)))));
 const result=P.visibleRows(values,{mode:'dia',drilledWeek:null},8,D);
 assert.equal(new Set(result.map(r=>r.week)).size,8);assert.ok(result.length>8);
 assert.equal(P.visibleRows(values,{mode:'dia',drilledWeek:null},null,D).length,70);
});
test('Filtro que remove a semana em drill volta ao semanal',()=>{
 const state={mode:'dia',drilledWeek:'2026-S01'};
 P.visibleRows(rows(['2026-10-05']),state,8,D);
 assert.deepEqual(state,{mode:'semana',drilledWeek:null});
});
test('Dia reutiliza razões de somas e STD ponderado, sem média de percentuais',()=>{
 const values=D.prepare('granja',[
  {data:'2026-10-05',lote:'A',saldo_femeas:100,ovos_produzidos:20,prod_std_pct:70},
  {data:'2026-10-05',lote:'B',saldo_femeas:900,ovos_produzidos:720,prod_std_pct:80},
  {data:'2026-10-06',lote:'A',saldo_femeas:100,ovos_produzidos:50,prod_std_pct:60}
 ]);
 const groups=D.chartGroups(P.visibleRows(values,{mode:'dia',drilledWeek:null},8,D),'date',null);
 const day=D.production(groups[0][1]);assert.equal(day.production,74);assert.equal(day.productionStd,79);assert.equal(day.diff,-5);
 const weekly=D.production(values);assert.equal(weekly.production,100*790/1100);
});
test('Virada do ano usa a semana já definida pelo Matrizes',()=>{
 const values=rows(['2025-12-29','2025-12-31','2026-01-01','2026-01-04','2026-01-05']);
 assert.equal(P.visibleRows(values,{mode:'dia',drilledWeek:'2026-S01'},8,D).length,4);
 assert.match(P.dayLabel('2026-01-01',D),/^01\/01\n/);
});
