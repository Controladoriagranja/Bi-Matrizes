const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../assets/js/matrizes-data.js'),O=require('../assets/js/matrizes-egg-origin.js');
const inc=(raw={})=>D.normalize('inc',{empresa_codigo:'2',unidade_codigo:'12',granja:'1972 - FAZENDA SANTA LUCIA',lote:'412',recebimento:'2026-10-01',origem:'Próprio',...raw});
const incubation=(raw={})=>D.normalize('incubacao',{empresa_codigo:'2',unidade_codigo:'12',granja:'1972 FAZENDA SANTA LUCIA',lote:'412',data_incubacao:'2026-10-03',...raw});
test('origem direta: valores confirmados, vazio e desconhecido',()=>{
  assert.equal(O.canonical(' Próprio '),'Própria');assert.equal(O.canonical('Terceiro'),'Terceiros');
  for(const value of [null,'','NORMAL','__proto__'])assert.equal(O.canonical(value),'');
});
test('referencia respeita empresa, codigo da granja e lote, independentemente da data e formato do nome',()=>{
  const reference=O.buildReference([inc(),inc({granja:'3094 - GRANJA SALOME',origem:'Terceiro'})]);
  assert.equal(O.resolve(incubation(),reference),'Própria');
  assert.equal(O.resolve(incubation({granja:'3094 NOME DIFERENTE'}),reference),'Terceiros');
  assert.equal(O.resolve(incubation({empresa_codigo:'11'}),reference),'');
  assert.equal(O.resolve(incubation({lote:'413'}),reference),'');
  assert.equal(O.resolve(incubation({granja:'SEM CODIGO'}),reference),'');
});
test('conflitos e valores desconhecidos nao sao classificados; vazios nao criam origem',()=>{
  assert.equal(O.resolve(incubation(),O.buildReference([inc(),inc({origem:'Terceiro'})])),'');
  assert.equal(O.resolve(incubation(),O.buildReference([inc(),inc({origem:'Outro'})])),'');
  assert.equal(O.resolve(incubation(),O.buildReference([inc({origem:null})])),'');
  assert.equal(O.resolve(incubation(),O.buildReference([inc(),inc({origem:null})])),'Própria');
});
test('media simples usa somente ovos_incubaveis_pct; inclui zero, exclui nulo, sem ponderacao',()=>{
  const rows=[inc({ovos_incubaveis_pct:0,total:10000,incubavel_pct:99}),inc({ovos_incubaveis_pct:100,total:1}),inc({ovos_incubaveis_pct:null})];
  assert.equal(O.average(rows,D).eggUse,50);assert.equal(O.average([],D).eggUse,null);
  assert.equal(O.average([inc({ovos_incubaveis_pct:98.37,incubavel_pct:28.13})],D).eggUse,98.37);
});
