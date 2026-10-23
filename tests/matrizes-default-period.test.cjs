const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../assets/js/matrizes-data.js');
const today=new Date(2026,9,23);
test('periodo automatico conserva inicio e usa maior evento',()=>{
 assert.deepEqual(D.defaultPeriod([{date:'2026-09-30'},{date:'2026-10-23'},{date:'2026-10-18'}],today),{start:'2026-08-01',end:'2026-10-23'});
});
test('sem eventos validos usa hoje, sem usar data da carga como evento',()=>{
 assert.deepEqual(D.defaultPeriod([],today),{start:'2026-08-01',end:'2026-10-23'});
 assert.equal(D.defaultPeriod([{date:'',raw:{carregado_em:'2026-12-31'}},{date:'2026-02-30'}],today).end,'2026-10-23');
});
test('fim corresponde ao ultimo evento disponivel, mesmo com carga mais recente',()=>{
 assert.equal(D.defaultPeriod([{date:'2026-10-18',raw:{carregado_em:'2026-10-23'}}],today).end,'2026-10-18');
});
test('inicio preserva virada de ano e ano bissexto',()=>{
 for(const reference of [new Date(2026,0,5),new Date(2024,2,1),new Date(2027,0,1)])assert.equal(D.defaultPeriod([],reference).start,D.previousTwoMonths(reference).start);
});
