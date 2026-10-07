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
test('GAD é consumo de ração por ave por dia, ponderado pelo saldo e separado por sexo',()=>{
  const rows=[{raw:{saldo_femea:100,consu_ali_gr_femeas:40,consu_ali_std_femeas:38,saldo_macho:10,consu_ali_gr_machos:50,consu_ali_std_machos:48}},
    {raw:{saldo_femea:300,consu_ali_gr_femeas:60,consu_ali_std_femeas:58}}];
  near(D.recria(rows,'femeas').gad,55);near(D.recria(rows,'femeas').gadStd,53);
  near(D.recria(rows,'machos').gad,50);near(D.recria(rows,'machos').gadStd,48);
  assert.equal(D.recria([{raw:{saldo_femea:100,ps_medio_femeas:500}}],'femeas').gad,null);
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

test('período inicial usa os dois meses fechados anteriores, inclusive na virada do ano',()=>{
  assert.deepEqual(D.previousTwoMonths(new Date(2026,9,5)),{start:'2026-08-01',end:'2026-09-30'});
  assert.deepEqual(D.previousTwoMonths(new Date(2026,0,5)),{start:'2025-11-01',end:'2025-12-31'});
});
test('gráficos semanais preservam semanas reais e limitam aos oito grupos finais',()=>{
  const rows=Array.from({length:12},(_,i)=>({week:`2026-S${String(i+30).padStart(2,'0')}`}));
  const groups=D.chartGroups(rows,'week');assert.equal(groups.length,8);
  assert.equal(D.chartGroups(rows,'week',null).length,12);
  assert.equal(groups[0][0],'2026-S34');assert.equal(groups.at(-1)[0],'2026-S41');
});

test('Recria sempre apresenta domínio de 1 a 22, sem inventar medições ausentes',()=>{
  const row={age:15,raw:{saldo_femea:100,ps_medio_femeas:1792}};
  const groups=D.lifeWeekGroups([row,{age:23,raw:{}}]);
  assert.equal(groups.length,22);assert.equal(groups[0][0],1);assert.equal(groups[21][0],22);
  assert.equal(groups[14][1][0],row);assert.equal(groups[0][1].length,0);
  assert.equal(D.recria(groups[0][1],'femeas').weight,null);
});

test('cards de Recria consolidam medições de todo o período inclusive com última semana sem pesagem',()=>{
  const rows=[{raw:{cab_femeas:100,saldo_femea:90,viab_fem:90,unif_femeas:80,ps_medio_femeas:500,consu_ali_gr_femeas:40}},
    {raw:{cab_femeas:300,saldo_femea:270,viab_fem:98,unif_femeas:90,ps_medio_femeas:700,consu_ali_gr_femeas:60}},
    {raw:{cab_femeas:100,saldo_femea:0,viab_fem:95,unif_femeas:0,ps_medio_femeas:0,consu_ali_gr_femeas:0}}];
  const result=D.recria(rows,'femeas');near(result.viab,95.8);near(result.uniform,87.5);near(result.weight,650);near(result.gad,55);
});

test('cards têm média simples própria, independentemente da quantidade de aves',()=>{
  const rows=[{raw:{viab_fem:90,unif_femeas:80,ps_medio_femeas:500,consu_ali_gr_femeas:40,cab_femeas:100,saldo_femea:90}},
    {raw:{viab_fem:98,unif_femeas:90,ps_medio_femeas:700,consu_ali_gr_femeas:60,cab_femeas:300,saldo_femea:270}},
    {raw:{viab_fem:null,unif_femeas:0,ps_medio_femeas:0,consu_ali_gr_femeas:0}}];
  const result=D.simpleIndicators(rows,'recria');near(result.viab,94);near(result.uniform,85);near(result.weight,600);near(result.gad,50);
});


test('metas mensais reais: valores diferentes, ausência, inativos e virada de mês',()=>{
  const metas=[{indicador_codigo:'ovos_cama',referencia_mes:'2026-10-01',valor_meta:3,ativo:true},
    {indicador_codigo:'ovos_cama',referencia_mes:'2026-11-01',valor_meta:2.5,ativo:true},
    {indicador_codigo:'ovos_cama',referencia_mes:'2026-12-01',valor_meta:9,ativo:false}];
  assert.equal(D.monthlyTarget(metas,'ovos_cama','2026-10-20'),3);
  assert.equal(D.monthlyTarget(metas,'ovos_cama','2026-11-20'),2.5);
  assert.equal(D.monthlyTarget(metas,'ovos_cama','2026-12-01'),null);
  assert.equal(D.monthlyTarget(metas,'ovos_cama','2027-10-01'),null);
  assert.equal(D.monthlyTarget(metas,'outro','2026-10-01'),null);
  assert.equal(D.monthlyTarget(metas,'ovos_cama',''),null);
  assert.equal(D.monthlyTarget([{indicador_codigo:'ovos_cama',referencia_mes:'2026-10-01',valor_meta:0}],'ovos_cama','2026-10-20'),0);
  const reference=D.periodReferenceDate([{date:'2026-11-01'},{date:'2026-10-31'}]);
  assert.equal(reference,'2026-10-31');assert.equal(D.monthlyTarget(metas,'ovos_cama',reference),3);
  assert.equal(D.monthlyTarget([...metas,{...metas[0],valor_meta:8}],'ovos_cama','2026-10-20'),null);
});
