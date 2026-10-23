const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),D=require('../assets/js/matrizes-data.js');
const sources={acerto_produtor_producao:['ini_semana','2026-10-22'],acerto_produtor_recria:['ini_semana','2026-10-19'],granja:['data','2026-10-23'],inc:['recebimento','2026-10-18'],incubacao:['data_incubacao','2026-10-17'],eclosao:['eclosao','2026-10-23'],embrio:['data','2026-10-15']};
let fixtures;
function reset(){
 fixtures={metas:[{id:1,ativo:true,indicador_codigo:'ovos_cama',referencia_mes:'2026-12-01',valor_meta:3}]};
 for(const [table,[field,last]] of Object.entries(sources)){
  fixtures[table]=['2026-09-30','2026-10-05','2026-10-12',last].map((date,i)=>({
   id:i+1,data:date,ini_semana:date,recebimento:date,data_incubacao:date,eclosao:date,
   empresa_codigo:'2',unidade_codigo:'12',carregado_em:'2026-10-23T10:15:30',
   granja:'3094 - GRANJA SALOME',integrado:'3094 - GRANJA SALOME',cab_granja:'GRANJA SALOME',cab_cod:'3094',
   lote:'412',cab_lote:'412.01P',galpao:'01',cab_galpao:'01',linhagem:'COBB',cab_linhagem:'COBB',idade:30,ida_sem:i+1,origem:'Próprio',tipo_movto:'Diário',situacao:'Aberto',
   saldo_femeas:1000,ovos_produzidos:700,incubaveis_granja:680,cama:14,prod_std_pct:70,aprov_std_pct:98,
   saldo_femea:1000,cab_femeas:1000,viab_fem:99,std_viab_fem:98,producao:70,producao_std:68,
   quantid:1000,nascidos:800,eclosao_std:85,descarte:8,quantidade:1000,dias_estoque:'02-',
   total:1000,ovos_incubaveis:980,ovos_incubaveis_pct:98,incubados:1000,nao_eclodidos:200,total_analisado:100,qtde:5,qtde_2:3,qtde_3:1,qtde_4:5,qtde_7:1,qtde_8:1,qtde_9:1,qtde_10:0
  }));
  fixtures[table].push({id:99,[field]:null,lote:null,cab_lote:null,carregado_em:'2026-10-24T09:00:00'});
 }
}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'404':data);});});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'America/Sao_Paulo'});
 await context.addInitScript(()=>sessionStorage.setItem('granjabi_auth_token','teste-isolado'));
 await context.route('https://api-bi-granja.controladoriagb05.workers.dev/**',async route=>{
  const u=new URL(route.request().url()),table=u.pathname.split('/').at(-1),rows=fixtures[table],number=Number(u.searchParams.get('pagina')),size=2;
  assert.ok(rows,table);await route.fulfill({json:{tabela:table,pagina:number,tamanho:size,total:rows.length,total_paginas:Math.ceil(rows.length/size),dados:rows.slice((number-1)*size,number*size)}});
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.clock.setFixedTime(new Date('2026-10-23T15:00:00Z'));
 const complete=()=>page.locator('#loadStatus').filter({hasText:'histórico completo'}).waitFor();
 const refresh=async()=>{await page.locator('#refresh').click();await complete();};
 const selectEnd=async value=>{await page.locator('#endDate').fill(value);await page.locator('#endDate').dispatchEvent('change');};
 const chartValues=async id=>page.locator('#chart-'+id).evaluate(el=>echarts.getInstanceByDom(el).mzPoints.map(p=>p.filterValue));
 try{
  for(const [file,main,expected,chart] of [['index.html','acerto_produtor_recria','2026-10-19','viabilidade'],['producao.html','granja','2026-10-23','producao'],['incubatorio.html','eclosao','2026-10-23','eclosao'],['embrio.html','embrio','2026-10-15','nao-eclodidos']]){
   reset();await page.goto('http://127.0.0.1:'+server.address().port+'/'+file);await complete();
   assert.equal(await page.locator('#startDate').inputValue(),'2026-08-01');assert.equal(await page.locator('#endDate').inputValue(),expected);
   assert.match(await page.locator('#recordCount').textContent(),/^4 de 4 registros/);
   assert.equal(await page.locator('#ultimaAtualizacao').textContent(),'24/10/2026 · 09:00:00','Carga bruta nao determina data do evento');
   if(file!=='index.html')assert.ok((await chartValues(chart)).includes(D.week(D.date(expected))),'Semana mais recente, inclusive parcial');
   if(file==='incubatorio.html')for(const id of ['incubacao','estoque','ovos-aproveitamento','ovos-aproveitamento-mes'])assert.ok((await chartValues(id)).some(value=>value.startsWith('2026-S4')||value==='2026-10'),'Fonte auxiliar inclui outubro: '+id);
   if(file==='producao.html')for(const id of ['cama','perdas','aproveitamento','diaria'])assert.ok((await chartValues(id)).some(value=>value.startsWith('2026-S4')||value.startsWith('2026-10')),'Divisao inclui outubro: '+id);
   // Data automatica acompanha novos eventos, sem depender da data da carga.
   const field=sources[main][0];fixtures[main][3][field]='2026-10-26';await refresh();assert.equal(await page.locator('#endDate').inputValue(),'2026-10-26');
   // Periodo manual, aberto ou fechado, persiste em refresh e reload.
   await selectEnd('2026-09-30');await refresh();assert.equal(await page.locator('#endDate').inputValue(),'2026-09-30');
   await page.reload();await complete();assert.equal(await page.locator('#endDate').inputValue(),'2026-09-30');
   await selectEnd('');await refresh();assert.equal(await page.locator('#endDate').inputValue(),'');
   // Limpar filtros habilita o padrao novo; filtros especificos nao congelam seu fim.
   await page.locator('#clearFilters').click();assert.equal(await page.locator('#endDate').inputValue(),'2026-10-26');
   await page.locator('[data-filter-choice="farm"] summary').click();await page.locator('[data-filter="farm"][value="GRANJA SALOME"]').check();
   fixtures[main][3][field]='2026-10-27';await refresh();assert.equal(await page.locator('#endDate').inputValue(),'2026-10-27');assert.ok(await page.locator('[data-filter="farm"][value="GRANJA SALOME"]').isChecked());
   await page.reload();await complete();assert.equal(await page.locator('#endDate').inputValue(),'2026-10-27');assert.ok(await page.locator('[data-filter="farm"][value="GRANJA SALOME"]').isChecked());
   await page.locator('#clearFilters').click();
   await page.locator('[data-month="10"]').click();await refresh();assert.equal(await page.locator('#startDate').inputValue(),'');assert.equal(await page.locator('#endDate').inputValue(),'');assert.ok(await page.locator('[data-month="10"]').evaluate(el=>el.classList.contains('active')));
   // Filtros antigos ambiguos sao preservados, incluindo 30/09; nenhum historico manual e apagado.
   await page.evaluate(()=>{const module=MatrizesPages[document.body.dataset.page].module;sessionStorage.setItem('bi-matrizes-filtros-v3-'+module,JSON.stringify({start:'2026-08-01',end:'2026-09-30',filters:{lineage:['COBB']}}));});
   await page.reload();await complete();assert.equal(await page.locator('#endDate').inputValue(),'2026-09-30');assert.ok(await page.locator('[data-filter="lineage"][value="COBB"]').isChecked());
   await page.locator('#clearFilters').click();assert.equal(await page.locator('#endDate').inputValue(),'2026-10-27');
  }
  assert.deepEqual(errors,[]);console.log('PASS: 4 telas e divisoes; outubro automatico, semanas parciais, maior evento por fonte, metadados separados, carga bruta, refresh, periodo manual/aberto, sessao antiga, filtros e Limpar filtros.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
