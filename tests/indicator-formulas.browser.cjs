const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),fixtures={granja:[],eclosao:[],inc:[],incubacao:[],acerto_produtor_producao:[],acerto_produtor_recria:[],embrio:[],metas:[]};
for(let week=0;week<10;week++)for(let lot=0;lot<30;lot++)for(let day=0;day<2;day++){
 const date=new Date(Date.UTC(2026,6,27+week*7+day*3)).toISOString().slice(0,10),weight=day?900:100;
 const rate=lot===0&&week<2?90:(day?70:50)+lot,eggs=weight*rate/100;
 const common={id:fixtures.granja.length+1,data:date,lote:'L'+String(lot+1).padStart(2,'0'),granja:'1972 - FAZENDA SÃO JOSÉ',granja_codigo:'1972',linhagem:lot%2?'ROSS':'COBB',galpao:'01',idade:30,empresa_codigo:'2',unidade_codigo:'12',carregado_em:'2026-10-23T10:00:00'};
 fixtures.granja.push({...common,saldo_femeas:weight,ovos_produzidos:eggs,incubaveis_granja:eggs*(80+lot/2)/100,prod_std_pct:70,aprov_std_pct:90,cama:eggs*.02});
 fixtures.eclosao.push({...common,eclosao:date,quantid:weight,nascidos:eggs,eclosao_std:70,descarte:10,origem:'Próprio'});
 fixtures.inc.push({...common,recebimento:date,origem:'Próprio',total:weight,ovos_incubaveis:weight*.9,ovos_incubaveis_pct:(day?60:20)+lot});
 fixtures.acerto_produtor_recria.push({...common,ini_semana:date,cab_lote:common.lote,cab_granja:'FAZENDA SÃO JOSÉ',cab_femeas:1000,saldo_femea:990,viab_fem:99,std_viab_fem:98,ida_sem:week+1,situacao:'Aberto'});
 fixtures.embrio.push({...common,integrado:common.granja,incubados:weight,nascidos:eggs,total_analisado:100,qtde:2,origem:'Próprio'});
}
// Mesmo lote em outra fazenda permanece separado.
for(const [table,field] of [['granja','data'],['eclosao','eclosao'],['inc','recebimento'],['acerto_produtor_recria','ini_semana'],['embrio','data']]){
 const row={...fixtures[table].at(-1),id:9999,lote:'L01',cab_lote:'L01',granja:'3094 - GRANJA ÁGUA LIMPA',cab_granja:'GRANJA ÁGUA LIMPA',granja_codigo:'3094',origem:'Terceiro',prod_std_pct:80,eclosao_std:80,saldo_femeas:1000,ovos_produzidos:900,incubaveis_granja:850,quantid:1000,nascidos:900,ovos_incubaveis_pct:85};
 fixtures[table].push(row);
}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'404':data);});});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addInitScript(()=>sessionStorage.setItem('granjabi_auth_token','synthetic-formulas-token'));
 let requests=0;await context.route('https://api-bi-granja.controladoriagb05.workers.dev/**',async route=>{
  requests++;const u=new URL(route.request().url()),table=u.pathname.split('/').at(-1),rows=fixtures[table],size=Number(u.searchParams.get('tamanho')),page=Number(u.searchParams.get('pagina'));
  return route.fulfill({json:{tabela:table,pagina:page,tamanho:size,total:rows.length,total_paginas:Math.ceil(rows.length/size),dados:rows.slice((page-1)*size,page*size)}});
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 const snapshot=()=>page.evaluate(()=>JSON.stringify({kpis:document.querySelector('#kpis').innerText.replaceAll('ƒx',''),records:document.querySelector('#recordCount').textContent,series:[...document.querySelectorAll('.mz-chart')].map(el=>echarts.getInstanceByDom(el).getOption().series.map(s=>s.data))}));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  for(const file of ['index.html','producao.html','incubatorio.html','embrio.html']){
   await page.goto(base+'/'+file);await page.locator('#loadStatus').filter({hasText:'histórico completo'}).waitFor();await page.waitForTimeout(200);
   const counts=await page.evaluate(()=>({charts:document.querySelectorAll('.mz-chart-card').length,chartFx:document.querySelectorAll('.mz-chart-head .if-button').length,kpis:document.querySelectorAll('.mz-kpi').length,kpiFx:document.querySelectorAll('.mz-kpi .if-button').length}));
   assert.equal(counts.charts,counts.chartFx);assert.equal(counts.kpis,counts.kpiFx);assert.equal(await page.locator('.mz-formula-dialog,[data-formula],[data-egg-formula]').count(),0);
   const buttons=page.locator('button[data-formula-id]'),values=await snapshot(),network=requests;
   for(let i=0;i<await buttons.count();i++){
    const b=buttons.nth(i),id=(await b.getAttribute('data-formula-id')).split(' ')[0];await b.click();
    const modal=page.locator('#indicatorFormulaDialog');assert.ok(await modal.isVisible());assert.equal(await modal.locator('h2').textContent(),'Fórmulas do relatório');
    assert.equal(await modal.locator('.if-selected').getAttribute('data-formula-section'),id);assert.equal(await modal.locator('.if-reference').count(),0,'Não atribuir cálculos frontend à API');
    assert.equal(await modal.locator('.if-label').filter({hasText:'DESCRIÇÃO'}).count(),await modal.locator('.if-metric').count());
    assert.equal(await modal.locator('.if-rules').count(),await modal.locator('.if-metric').count());
    await page.keyboard.press('Escape');assert.ok(await b.evaluate(el=>el===document.activeElement));
   }
   assert.equal(await page.locator('#indicatorFormulaDialog').count(),1);assert.equal(await snapshot(),values);assert.equal(requests,network,'Fx não busca dados');
   await buttons.first().focus();await page.keyboard.press('Enter');await page.locator('.if-close').click();await buttons.first().focus();await page.keyboard.press('Space');
   await page.locator('#indicatorFormulaDialog').evaluate(el=>{const r=el.getBoundingClientRect();el.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left-5,clientY:r.top-5}));});assert.equal(await page.locator('#indicatorFormulaDialog').isVisible(),false);
   await fs.promises.mkdir(path.join(root,'artifacts/fx'),{recursive:true});
   for(const width of [1440,768,390,320])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:900});await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
    await buttons.first().click();const box=await page.locator('#indicatorFormulaDialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);
    assert.equal(await page.locator('#indicatorFormulaDialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);assert.ok(await page.locator('.if-close').isVisible());
    await page.screenshot({path:path.join(root,'artifacts/fx',file+'-'+width+'-'+theme+'.png')});await page.keyboard.press('Escape');
    const overlaps=await page.locator('.mz-chart-card').evaluateAll(cards=>cards.filter(card=>{const a=card.querySelector('h2').getBoundingClientRect(),b=card.querySelector('.mz-chart-actions').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}).length);assert.equal(overlaps,0,'Ações não cobrem título');
   }
   await page.setViewportSize({width:1440,height:1000});
   // Mesma fórmula e foco ao expandir, abrir Dados, entrar em Dia e listar Lotes.
   const first=page.locator('.mz-chart-card').first();await first.locator('[data-expand]').click();await first.locator('.if-button').click();await page.keyboard.press('Escape');assert.ok(await first.evaluate(el=>el.classList.contains('expanded')));await page.keyboard.press('Escape');
   const weekly=page.locator('.mz-chart-card:has(.mz-period-flags)').first();
   if(await weekly.count()){
    await weekly.locator('input[value=dia]').check();const before=await snapshot();await weekly.locator('.if-button').click();await page.keyboard.press('Escape');assert.equal(await snapshot(),before);
   }
   const lot=page.locator('.mz-chart-card:has(input[value=lote])').first();
   if(await lot.count()){
    await lot.locator('input[value=lote]').check();const content=await lot.locator('.mz-lot-list').textContent();await lot.locator('.if-button').click();await page.keyboard.press('Escape');assert.equal(await lot.locator('.mz-lot-list').textContent(),content);assert.ok(await lot.locator('.mz-lot-list').isVisible());
   }
   console.log('PASS Matrizes fx/modal: '+file+'; '+counts.kpis+' KPIs e '+counts.charts+' cards/tabelas; quatro larguras e temas.');
  }
  assert.deepEqual(errors,[]);console.log('PASS: instância única, foco, teclado, sem consultas/mudança de valores, dados, expansão, Dia/Semana/Lote.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
