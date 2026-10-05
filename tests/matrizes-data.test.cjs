const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../assets/js/matrizes-data.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);
test('números do PostgreSQL e dos relatórios brasileiros, sem converter ausência em zero',()=>{
  assert.equal(D.n(14.628),14.628);assert.equal(D.n('14.628'),14628);assert.equal(D.n('1.428.180'),1428180);
  assert.equal(D.n('84,65'),84.65);assert.equal(D.n('1.234,50'),1234.5);assert.equal(D.n('0'),0);
  for(const value of [null,undefined,'','—','04-03-02-',Infinity])assert.equal(D.n(value),null);
});
test('datas reais e semanas ISO não misturam anos',()=>{
  assert.equal(D.iso(D.date('01/08/26')),'2026-08-01');assert.equal(D.date('31/02/2026'),null);
  assert.equal(D.week(D.date('2021-01-01')),'2020-S53');assert.equal(D.week(D.date('2026-08-01')),'2026-S31');
});
test('produção consolidada usa aves-dia e perda usa ovos, com denominadores próprios',()=>{
  const rows=[{raw:{saldo_femeas:100,ovos_produzidos:60,prod_std_pct:50,incubaveis_granja:54,cama:6}},
    {raw:{saldo_femeas:900,ovos_produzidos:720,prod_std_pct:70,incubaveis_granja:700,cama:20}}];
  const result=D.production(rows);near(result.production,78);near(result.productionStd,68);near(result.use,100*754/780);
  near(result.bed,100*26/780);near(result.loss,100*26/780);
  assert.equal(D.production([{raw:{saldo_femeas:0,ovos_produzidos:0}}]).production,null);
  assert.equal(D.production([{raw:{saldo_femeas:100,ovos_produzidos:0}}]).production,0);
});
test('eclosão pondera ovos; descarte pondera nascidos, e zero é resultado válido',()=>{
  const rows=[{age:35,raw:{quantid:'1.000',nascidos:'900',descarte:'9',eclosao_std:'85,00'}},{age:51,raw:{quantid:'9.000',nascidos:'6.300',descarte:'0',eclosao_std:'80,00'}}];
  const result=D.hatch(rows);near(result.hatch,72);near(result.hatchStd,80.5);near(result.discard,.125);
  near(result.young,90);near(result.old,70);assert.equal(result.middle,null);
});
test('diagnóstico pondera amostra analisada e soma contaminados bacterianos e fúngicos',()=>{
  const result=D.embryo([{raw:{incubados:'24.960',nascidos:'20.140',nao_eclodidos:'4.820',total_analisado:'384',qtde:'16',std:'3,78',qtde_9:'3',qtde_10:'1',std_9:'0,76',std_10:'0,00'}}]);
  near(result.infertile,100*16/384);near(result.contaminated,100*4/384);near(result.contaminatedStd,.76);
  near(result.hatch+result.unhatched,100);
});
test('GAD calcula intervalo de cada lote, não a diferença entre médias de lotes diferentes',()=>{
  const records=[{ini_semana:'2026-08-03',ida_sem:5,cab_lote:'A',ps_medio_femeas:500,saldo_femea:100,cab_femeas:100},
    {ini_semana:'2026-08-10',ida_sem:6,cab_lote:'A',ps_medio_femeas:640,saldo_femea:100,cab_femeas:100},
    {ini_semana:'2026-08-10',ida_sem:6,cab_lote:'B',ps_medio_femeas:1000,saldo_femea:900,cab_femeas:900}];
  const rows=D.prepare('acerto_produtor_recria',records),gad=D.withGad(rows,'femeas');
  near(gad.get(rows[1]).gad,20);assert.equal(gad.get(rows[2]).gad,null);
  near(D.recria(rows.filter(r=>r.age===6),'femeas',gad).gad,20);
});
test('zero em pesagem e uniformidade é ausência de medição, não desempenho zero',()=>{
  const result=D.recria([{raw:{cab_femeas:100,saldo_femea:99,viab_fem:99,std_viab_fem:98,ps_medio_femeas:0,unif_femeas:0,cv_femeas:0}}],'femeas',new Map());
  assert.equal(result.weight,null);assert.equal(result.uniform,null);assert.equal(result.cv,null);near(result.viab,99);
});
test('listas de estoque fornecem extremos mas não inventam distribuição',()=>{
  const result=D.incubation([{raw:{quantidade:100,dias_estoque:'04-03-02-'}},{raw:{quantidade:900,dias_estoque:'03-'}}]);
  assert.equal(result.minimum,2);assert.equal(result.maximum,4);assert.equal(result.stock,null);
  near(D.incubation([{raw:{quantidade:100,dias_estoque:'02-'}},{raw:{quantidade:900,dias_estoque:'03-'}}]).stock,2.9);
});
test('última extração vence para acerto e linhas totais não são detalhes',()=>{
  const rows=D.prepare('acerto_produtor_recria',[
    {id:1,cab_lote:'A',ini_semana:'2026-08-01',carregado_em:'2026-09-01',ps_medio_femeas:100},
    {id:2,cab_lote:'A',ini_semana:'2026-08-01',carregado_em:'2026-10-01',ps_medio_femeas:200},
    {id:3,cab_lote:'TOTAL',ini_semana:'2026-08-01'},
    {id:4,cab_lote:'A',ini_semana:'Total'}]);
  assert.equal(rows.length,1);assert.equal(rows[0].raw.ps_medio_femeas,200);
});
test('fatos idênticos de cargas repetidas não duplicam quantidades',()=>{
  const rows=D.prepare('granja',[{data:'2026-08-01',lote:'A',ovos_produzidos:10,processo:1,carregado_em:'2026-09-01'},
    {data:'2026-08-01',lote:'A',ovos_produzidos:10,processo:2,carregado_em:'2026-10-01'}]);
  assert.equal(rows.length,1);assert.equal(rows[0].raw.processo,2);
});
test('curva usa o percentual do relatório inclusive quando movimento é semanal',()=>{
  const rows=[{raw:{producao:'70,00',producao_std:'68,00',saldo_femea:100,ovos_tot_granja:490,tipo_movto:'Semanal'}}];
  near(D.curve(rows).production,70);
});
test('lote base e galpão permitem filtrar produção e acerto com o mesmo contexto',()=>{
  const acerto=D.normalize('acerto_produtor_producao',{ini_semana:'2026-08-01',cab_lote:'399.08P',cab_galpao:'08'});
  const granja=D.normalize('granja',{data:'2026-08-01',lote:'399',galpao:'8'});
  assert.equal(acerto.lot,granja.lot);assert.equal(acerto.house,granja.house);
  assert.equal(D.normalize('eclosao',{eclosao:'01/08/26',lote:'PL3306-26'}).lot,'PL3306-26');
});
