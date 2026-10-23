const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../assets/js/matrizes-data.js'),L=require('../assets/js/matrizes-lot-list.js'),S=require('../assets/js/matrizes-filter-search.js');
const normalize=raw=>D.normalize('granja',{data:'2026-10-05',empresa_codigo:'2',unidade_codigo:'1',granja:'1972 FAZENDA',lote:'412',...raw});
test('busca ignora caixa e acento e aceita trecho em qualquer posicao',()=>{
 assert.ok(S.normalize('FAZENDA SÃO JOSÉ').includes(S.normalize('sAo JoSe')));assert.equal(S.normalize(null),'');
});
test('lote usa razao e ponderacao existentes, sem media simples de percentuais',()=>{
 const rows=[normalize({saldo_femeas:100,ovos_produzidos:20,prod_std_pct:70}),normalize({data:'2026-10-06',saldo_femeas:900,ovos_produzidos:720,prod_std_pct:80})];
 const [lot]=L.aggregate(rows,{metric:'production',target:'productionStd',eggs:'ovos_produzidos'},D,D.production);
 assert.equal(lot.value,74);assert.equal(lot.target,79);assert.equal(lot.difference,-5);assert.equal(lot.good,false);assert.equal(lot.eggs,740);
});
test('nao mistura empresas, unidades ou fazendas com o mesmo lote',()=>{
 const rows=[normalize({}),normalize({empresa_codigo:'11'}),normalize({unidade_codigo:'12'}),normalize({granja:'3094 OUTRA FAZENDA'})];
 assert.equal(L.aggregate(rows,{metric:'production'},D,D.production).length,4);
});
test('piores primeiro por diferenca de meta; igualdade e melhor sao verdes',()=>{
 const rows=[normalize({lote:'A',value:80,target:90}),normalize({lote:'B',value:60,target:60}),normalize({lote:'C',value:99,target:90})];
 const calculate=items=>({value:items[0].raw.value,target:items[0].raw.target});
 const result=L.aggregate(rows,{metric:'value',target:'target'},D,calculate);
 assert.deepEqual(result.map(lot=>lot.lot),['A','B','C']);assert.deepEqual(result.map(lot=>lot.good),[false,true,true]);
 const lower=L.aggregate(rows,{metric:'value',target:'target',lower:true},D,calculate);
 assert.deepEqual(lower.map(lot=>lot.lot),['C','B','A']);assert.deepEqual(lower.map(lot=>lot.good),[false,true,true]);
});
test('sem meta ordena pelo pior valor e nao inventa diferenca/status; null vai ao fim',()=>{
 const rows=[normalize({lote:'A',value:5}),normalize({lote:'B',value:2}),normalize({lote:'C',value:null})];
 const result=L.aggregate(rows,{metric:'value',lower:true},D,items=>({value:items[0].raw.value}));
 assert.deepEqual(result.map(lot=>lot.lot),['A','B','C']);assert.ok(result.every(lot=>lot.good==null&&lot.difference==null));
});
test('escopo respeita oito semanas, todas e drill de uma semana, sem alterar regra semanal',()=>{
 const rows=Array.from({length:70},(_,i)=>normalize({data:D.iso(new Date(Date.UTC(2026,6,i+1)))}));
 const result=L.scopeRows(rows,{mode:'semana',drilledWeek:null},8,D);
 assert.equal(new Set(result.map(row=>row.week)).size,8);assert.equal(L.scopeRows(rows,{mode:'semana'},null,D).length,70);
 const week=result[0].week;assert.ok(L.scopeRows(rows,{mode:'dia',drilledWeek:week},8,D).every(row=>row.week===week));
});
