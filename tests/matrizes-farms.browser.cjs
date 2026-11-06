const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),fixtures={granja:[],acerto_produtor_recria:[],acerto_produtor_producao:[],inc:[],eclosao:[],incubacao:[],embrio:[],metas:[]};
for(const [code,lineage,date] of [['1972','COBB','2026-10-05'],['3094','ROSS','2026-10-05'],['5000','HUBBARD','2026-01-01']]){
 const common={id:Number(code),empresa_codigo:'2',unidade_codigo:'12',data:date,ini_semana:date,recebimento:date,eclosao:date,data_incubacao:date,
  granja:code+' - '+(code==='5000'?'FAZENDA HISTÓRICA':'GRANJA SALOME LTDA'),integrado:code+' - '+(code==='5000'?'FAZENDA HISTÓRICA':'GRANJA SALOME LTDA'),
  cab_granja:code==='5000'?'FAZENDA HISTÓRICA':'GRANJA SALOME LTDA',cab_cod:code,granja_codigo:code,lote:'412',cab_lote:'412',idade:30,ida_sem:1,linhagem:lineage,cab_linhagem:lineage,
  cab_femeas:1000,saldo_femea:1000,viab_fem:99,std_viab_fem:98,saldo_femeas:1000,ovos_produzidos:700,incubaveis_granja:680,cama:14,prod_std_pct:70,aprov_std_pct:98,
  quantid:1000,nascidos:code==='1972'?800:600,eclosao_std:85,descarte:8,origem:code==='1972'?'Próprio':'Terceiro',total:1000,ovos_incubaveis:980,ovos_incubaveis_pct:98,
  quantidade:1000,dias_estoque:'02-',incubados:1000,total_analisado:100,qtde:5,carregado_em:'2026-11-06T10:00:00'};
 for(const table of Object.keys(fixtures).filter(table=>table!=='metas'))fixtures[table].push({...common});
}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'404':data);});});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addInitScript(()=>sessionStorage.setItem('granjabi_auth_token','teste-isolado'));
 let requests=0;await context.route('https://api-bi-granja.controladoriagb05.workers.dev/**',async route=>{
  requests++;const u=new URL(route.request().url()),table=u.pathname.split('/').at(-1),rows=fixtures[table],size=Number(u.searchParams.get('tamanho')),page=Number(u.searchParams.get('pagina'));
  await route.fulfill({json:{tabela:table,pagina:page,tamanho:size,total:rows.length,total_paginas:Math.ceil(rows.length/size),dados:rows.slice((page-1)*size,page*size)}});
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.clock.setFixedTime(new Date('2026-10-23T15:00:00Z'));
 const base='http://127.0.0.1:'+server.address().port;
 const complete=()=>page.locator('#loadStatus').filter({hasText:'histórico completo'}).waitFor();
 const open=async key=>{const choice=page.locator(`[data-filter-choice="${key}"]`);if(await choice.getAttribute('open')===null)await choice.locator('summary').click();};
 const values=()=>page.locator('[data-filter="farm"]').evaluateAll(nodes=>nodes.map(el=>({key:el.value,label:el.nextElementSibling.textContent})));
 try{
  for(const file of ['index.html','producao.html','incubatorio.html','embrio.html']){
   const startRequests=requests;await page.goto(base+'/'+file);await complete();const network=requests;
   assert.deepEqual(await values(),[{key:'1972',label:'1972 - GRANJA SALOME LTDA'},{key:'3094',label:'3094 - GRANJA SALOME LTDA'},{key:'5000',label:'5000 - FAZENDA HISTÓRICA'}]);
   assert.match(await page.locator('#recordCount').textContent(),/^2 de 3/);
   await open('farm');await page.locator('[data-search="farm"]').fill('salome');assert.equal(await page.locator('[data-filter="farm"]').evaluateAll(nodes=>nodes.filter(el=>!el.closest('label').hidden).length),2);
   await page.locator('[data-filter="farm"][value="1972"]').check();assert.match(await page.locator('#recordCount').textContent(),/^1 de 3/);
   assert.equal((await values()).length,3);assert.ok(await page.locator('[data-filter="farm"][value="3094"]').isVisible());
   await page.locator('[data-filter="farm"][value="1972"]').uncheck();await page.locator('[data-filter="farm"][value="3094"]').check();
   assert.match(await page.locator('#recordCount').textContent(),/^1 de 3/);assert.equal((await values()).length,3);
   if(file==='incubatorio.html'){
    assert.equal(await page.locator('#eggRecords tbody tr').count(),1);assert.equal(await page.locator('#eggRecords tbody td').nth(2).textContent(),'3094 - GRANJA SALOME LTDA');
   }
   await page.locator('#clearFilters').click();await open('lineage');await page.locator('[data-filter="lineage"][value="COBB"]').check();assert.equal((await values()).length,3,'Linhagem não reduz catálogo');
   await page.locator('[data-month="1"]').click();assert.equal((await values()).length,3,'Mês não reduz catálogo');
   await page.locator('#clearFilters').click();
   // Old saved name selected both codes; retain its original scope on migration.
   await page.evaluate(()=>{const key='bi-matrizes-filtros-v3-'+MatrizesPages[document.body.dataset.page].module;sessionStorage.setItem(key,JSON.stringify({start:'2026-08-01',end:'2026-10-23',endMode:'manual',filters:{farm:['GRANJA SALOME LTDA']}}));});
   await page.reload();await complete();assert.equal(await page.locator('[data-filter="farm"]:checked').count(),2);assert.match(await page.locator('#recordCount').textContent(),/^2 de 3/);
   await page.locator('#clearFilters').click();await open('farm');await page.locator('[data-search="farm"]').fill('3094');assert.equal(await page.locator('[data-filter="farm"]').evaluateAll(nodes=>nodes.filter(el=>!el.closest('label').hidden).map(el=>el.value)).then(JSON.stringify),'["3094"]');
   await page.locator('[data-filter="farm"][value="3094"]').check();await page.reload();await complete();assert.ok(await page.locator('[data-filter="farm"][value="3094"]').isChecked());assert.equal(await page.locator('[data-filter="farm"]:checked').count(),1);
   // Mobile draft and tablet use the same catalog and code identity.
   await page.setViewportSize({width:390,height:844});await page.locator('.mobile-filter-toggle').click();await page.waitForTimeout(300);await open('farm');
   const before=await page.locator('#recordCount').textContent();await page.locator('[data-filter="farm"][value="1972"]').check();assert.equal(await page.locator('#recordCount').textContent(),before);assert.equal((await values()).length,3);
   await page.locator('.mobile-filter-apply').click();assert.match(await page.locator('#recordCount').textContent(),/^2 de 3/);
   await page.setViewportSize({width:820,height:1180});await page.locator('.mobile-filter-toggle').click();await page.waitForTimeout(300);assert.equal((await values()).length,3);
   await page.locator('.mobile-filter-toggle').click();await page.setViewportSize({width:1440,height:1000});
   assert.equal(requests-network,2*(network-startRequests),'Somente recargas explícitas consultaram a base');
   console.log('PASS código/nome, homônimas, catálogo, busca, seleção, migração e mobile: '+file);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
