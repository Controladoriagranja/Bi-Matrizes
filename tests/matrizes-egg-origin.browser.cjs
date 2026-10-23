const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),fixtures={inc:[],eclosao:[],incubacao:[],granja:[],acerto_produtor_producao:[],embrio:[],metas:[]};
for(let i=0;i<95;i++){
 const date=new Date(Date.UTC(2026,6,i+1)).toISOString().slice(0,10);
 for(const [code,origin,lineage] of [['1972','Próprio','COBB'],['3094','Terceiro','ROSS']]){
  const common={lote:'412',granja:code+' - FAZENDA '+code,linhagem:lineage,idade:40,empresa_codigo:'2',unidade_codigo:'12',carregado_em:'2026-10-23T10:00:00'};
  const third=origin==='Terceiro';
  fixtures.eclosao.push({...common,id:fixtures.eclosao.length+1,eclosao:date,origem:origin,quantid:1000,nascidos:third?400:800,eclosao_std:85,descarte:8});
  fixtures.incubacao.push({...common,id:fixtures.incubacao.length+1,granja:code+' FAZENDA '+code,data_incubacao:date,quantidade:third?200:100,dias_estoque:third?'04-':'02-'});
  for(const percentage of third?[80]:[0,100])fixtures.inc.push({...common,id:fixtures.inc.length+1,recebimento:date,origem:origin,total:percentage===0?10000:1,ovos_incubaveis:1,ovos_incubaveis_pct:percentage,incubavel_pct:12});
 }
}
fixtures.incubacao.push({...fixtures.incubacao[0],id:99999,lote:'397',data_incubacao:'2026-10-03',quantidade:50});
// Forcar mais de duas paginas; nenhuma consulta ao backend real.
for(let i=0;i<800;i++)fixtures.inc.push({...fixtures.inc[0],id:10000+i,recebimento:'2025-01-01',lote:'historico-'+i,empresa_codigo:'9'});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'404':data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),requests=[],errors=[];
 await context.addInitScript(()=>sessionStorage.setItem('granjabi_auth_token','teste-isolado'));
 let failInc=false;
 await context.route('https://api-bi-granja.controladoriagb05.workers.dev/**',async route=>{
  const url=new URL(route.request().url()),table=url.pathname.split('/').at(-1),rows=fixtures[table];assert.ok(rows,table);
  if(table==='inc'&&failInc)return route.fulfill({status:503,json:{detail:'Falha simulada em inc'}});
  const size=Number(url.searchParams.get('tamanho')),page=Number(url.searchParams.get('pagina'));requests.push({table,page});
  await route.fulfill({json:{tabela:table,pagina:page,tamanho:size,total:rows.length,total_paginas:Math.ceil(rows.length/size),dados:rows.slice((page-1)*size,page*size)}});
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 const url='http://127.0.0.1:'+server.address().port;
 const chart=async id=>page.locator('#chart-'+id).evaluate(el=>{const c=echarts.getInstanceByDom(el);return {points:c.mzPoints,spec:c.mzSpec,series:c.getOption().series.map(s=>s.data)};});
 const setPeriod=async()=>{for(const [id,value] of [['startDate','2026-07-01'],['endDate','2026-10-03']]){await page.locator('#'+id).fill(value);await page.locator('#'+id).dispatchEvent('change');}};
 const clearOrigin=async()=>{for(const value of ['Própria','Terceiros']){const flag=page.locator(`[data-filter="origin"][value="${value}"]`);if(await flag.isChecked())await flag.uncheck();}};
 const weekly='ovos-aproveitamento';
 try{
  await page.goto(url+'/incubatorio.html');await page.locator('#loadStatus').filter({hasText:'histórico completo'}).waitFor();await setPeriod();
  assert.ok(requests.some(r=>r.table==='inc'&&r.page===2),'referencia completa paginada');
  assert.equal(await page.locator('[data-filter="origin"]').count(),2);
  assert.equal(await page.locator('[data-filter-choice="origin"]').count(),0);
  const order=await page.locator('.mz-filter-fields').evaluate(el=>{const a=el.querySelector('[data-filter-choice="week"]').getBoundingClientRect(),b=el.querySelector('.mz-origin-filter').getBoundingClientRect(),c=el.querySelector('[data-filter-choice="farm"]').getBoundingClientRect();return a.bottom<=b.top&&b.bottom<=c.top;});assert.ok(order);
  assert.match(await page.locator('.mz-section-title').last().textContent(),/Aproveitamento/);
  assert.equal(await page.locator('#eggRecords tbody tr').count(),285);
  assert.equal((await chart(weekly)).points.length,8);assert.ok((await chart(weekly)).points.every(p=>p.eggUse===60));
  assert.ok((await chart('ovos-aproveitamento-mes')).points.every(p=>p.eggUse===60));
  assert.ok((await chart('eclosao')).points.every(p=>p.hatch===60));
  assert.match(await page.locator('#notice').textContent(),/1 registro\(s\) de incubação sem origem/);
  await page.locator('[data-filter="origin"][value="Própria"]').check();
  assert.ok((await chart(weekly)).points.every(p=>p.eggUse===50));assert.ok((await chart('eclosao')).points.every(p=>p.hatch===80));
  assert.ok((await chart('estoque')).points.every(p=>p.stock===2));assert.ok((await chart('incubacao')).points.every(p=>p.incubated<=700));
  assert.equal(await page.locator('#eggRecords tbody tr').count(),190);
  assert.equal(await page.locator('[data-filter="farm"][value="FAZENDA 3094"]').count(),0);
  assert.equal(await page.locator('[data-filter="lineage"][value="ROSS"]').count(),0);
  await clearOrigin();await page.locator('[data-filter="origin"][value="Terceiros"]').check();
  assert.ok((await chart(weekly)).points.every(p=>p.eggUse===80));assert.ok((await chart('eclosao')).points.every(p=>p.hatch===40));
  assert.ok((await chart('estoque')).points.every(p=>p.stock===4));assert.equal(await page.locator('#eggRecords tbody tr').count(),95);
  await page.locator('[data-filter="origin"][value="Própria"]').check();assert.ok((await chart(weekly)).points.every(p=>p.eggUse===60));
  // Nenhuma flag inclui o registro sem referencia; ambas incluem somente classificados.
  const both=await chart('incubacao');await clearOrigin();const none=await chart('incubacao');
  assert.equal(none.points.reduce((sum,p)=>sum+p.incubated,0)-both.points.reduce((sum,p)=>sum+p.incubated,0),50);
  // Cascata inversa: fazenda restringe origem.
  await page.locator('[data-filter-choice="farm"] summary').click();await page.locator('[data-filter="farm"][value="FAZENDA 1972"]').check();
  assert.ok(await page.locator('[data-filter="origin"][value="Terceiros"]').isDisabled());
  await page.locator('[data-filter="farm"][value="FAZENDA 1972"]').uncheck();await page.locator('[data-filter-choice="farm"] summary').click();
  const card=page.locator('#card-'+weekly);await page.locator('#chart-'+weekly).evaluate(el=>echarts.getInstanceByDom(el).trigger('click',{componentType:'series',dataIndex:0}));
  assert.ok((await chart(weekly)).points.every(p=>p.filterKey==='date'&&p.eggUse===60));assert.ok((await chart(weekly)).points.length<=7);
  await card.locator('[data-table]').click();assert.equal(await card.locator('tbody tr').count(),(await chart(weekly)).points.length);
  assert.equal(await card.locator('thead th').first().textContent(),'Dia');await card.locator('[data-table]').click();
  await card.locator('[data-egg-formula]').click();assert.match(await page.locator('dialog').textContent(),/ovos_incubaveis_pct/);assert.match(await page.locator('dialog').textContent(),/60%/);await page.keyboard.press('Escape');
  await card.locator('.mz-drill-back').click();await card.locator('input[value=dia]').check();
  const limited=(await chart(weekly)).points.length;assert.ok(limited>8&&limited<95);await page.locator('#toggleWeeks').click();assert.equal((await chart(weekly)).points.length,95);
  await card.locator('[data-expand]').click();assert.equal((await chart(weekly)).points.length,95);await page.keyboard.press('Escape');
  await page.locator('#card-ovos-registros [data-egg-formula]').click();assert.match(await page.locator('dialog').textContent(),/285 percentuais válidos/);await page.keyboard.press('Escape');
  const out=path.join(root,'artifacts','egg-origin');fs.mkdirSync(out,{recursive:true});
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:950});
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.dispatchEvent(new Event('dashboard:theme-changed'));},theme);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const overlap=await card.evaluate(el=>{const a=el.querySelector('.mz-chart-actions').getBoundingClientRect(),b=el.querySelector('h2').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});assert.equal(overlap,false);
    await card.screenshot({path:path.join(out,'aproveitamento-'+width+'-'+theme+'.png')});
    await page.locator('#card-ovos-registros').screenshot({path:path.join(out,'registros-'+width+'-'+theme+'.png')});
   }
  }
  await page.locator('[data-filter="origin"][value="Própria"]').check();await page.locator('#clearFilters').click();assert.equal(await page.locator('[data-filter="origin"]:checked').count(),0);
  // Persistencia e migracao do filtro antigo; a referencia e reconstruida no reload.
  await page.evaluate(()=>{const key='bi-matrizes-filtros-v3-Incubatório';sessionStorage.setItem(key,JSON.stringify({start:'2026-07-01',end:'2026-10-03',filters:{origin:['Próprio']}}));});
  await page.reload();await page.locator('#loadStatus').filter({hasText:'histórico completo'}).waitFor();assert.ok(await page.locator('[data-filter="origin"][value="Própria"]').isChecked());
  assert.ok((await chart(weekly)).points.every(p=>p.eggUse===50));
  // Falha da nova fonte nao permite resultados aparentemente completos sem filtro.
  failInc=true;await page.locator('#refresh').click();await page.locator('#loadStatus').filter({hasText:'indisponível'}).waitFor();
  assert.ok(await page.locator('#error').isVisible());assert.equal((await chart('incubacao')).points.length,0);assert.equal((await chart(weekly)).points.length,0);
  failInc=false;
  // Nenhuma nova carga de inc ou flags de origem nas outras telas.
  for(const file of ['producao.html','embrio.html']){
   requests.length=0;await page.goto(url+'/'+file);await page.locator('#loadStatus').filter({hasText:'histórico completo'}).waitFor();assert.ok(!requests.some(r=>r.table==='inc'));assert.equal(await page.locator('.mz-origin-filter').count(),0);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: origem restrita a Incubatorio, referencia paginada, cascata, sem correspondencia, medias dia/semana/mes, tabela, formula, drill, 8/todas, expansao, persistencia, falha API, 4 larguras e 2 temas.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
