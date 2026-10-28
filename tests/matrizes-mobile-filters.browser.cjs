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
 const base='http://127.0.0.1:'+server.address().port,errors=[];
 let requests=0;
 async function setup(options={}){
  const context=await browser.newContext({viewport:{width:390,height:844},...options});
  await context.addInitScript(()=>sessionStorage.setItem('granjabi_auth_token','teste-isolado'));
  await context.route('https://api-bi-granja.controladoriagb05.workers.dev/**',async route=>{
   requests++;const u=new URL(route.request().url()),table=u.pathname.split('/').at(-1),rows=fixtures[table],size=Number(u.searchParams.get('tamanho')),page=Number(u.searchParams.get('pagina'));
   await route.fulfill({json:{tabela:table,pagina:page,tamanho:size,total:rows.length,total_paginas:Math.ceil(rows.length/size),dados:rows.slice((page-1)*size,page*size)}});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));return {context,page};
 }
 const loaded=page=>page.locator('#loadStatus').filter({hasText:'histórico completo'}).waitFor();
 const open=async page=>{if(await page.locator('.mobile-filter-toggle').getAttribute('aria-expanded')==='false')await page.locator('.mobile-filter-toggle').click();await page.waitForTimeout(300);};
 const choice=async(page,key)=>{const el=page.locator(`[data-filter-choice="${key}"]`);if(await el.getAttribute('open')===null)await el.locator('summary').click();};
 const chartState=page=>page.locator('.mz-chart').first().evaluate(el=>JSON.stringify([echarts.getInstanceByDom(el).mzPoints,document.getElementById('recordCount').textContent]));
 const apply=async page=>{await page.locator('.mobile-filter-apply').click();await page.waitForTimeout(300);assert.equal(await page.locator('.mobile-filter-toggle').getAttribute('aria-expanded'),'false');};
 try{
  const {context,page}=await setup();
  for(const file of (process.env.GESTURE_ONLY?[]:['index.html','producao.html','incubatorio.html','embrio.html'])){
   await page.goto(base+'/'+file);await loaded(page);
   const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(el=>el.id));assert.equal(ids.length,new Set(ids).size,'Sem IDs duplicados');
   assert.equal(await page.locator('.mz-filters').isVisible(),false);assert.ok(await page.locator('.mobile-filter-shell').isVisible());
   const pill=await page.locator('.mobile-filter-surface').boundingBox();assert.equal(Math.round(pill.width),152);assert.equal(Math.round(pill.height),56);
   assert.ok(await page.locator('#mobileFilterContent').evaluate(el=>el.inert));
   const sessionBefore=await page.evaluate(()=>JSON.stringify(sessionStorage));const before=await chartState(page),kpis=await page.locator('#kpis').textContent(),network=requests;
   const node=await page.locator('#filterFields').evaluate(el=>{window.originalFields=el;return true;});
   await open(page);assert.equal(await page.locator('#mobileFilterContent').evaluate(el=>el.inert),false);
   const mid=await page.locator('.mobile-filter-surface').boundingBox();assert.ok(Math.abs(mid.height-(844-40)*.64)<2);
   await page.locator('.mobile-filter-expand').click();await page.waitForTimeout(300);
   assert.ok(Math.abs((await page.locator('.mobile-filter-surface').boundingBox()).height-804)<2);
   // Search/cascade change only the draft, not the charts, counters or session.
   await choice(page,'farm');await page.locator('[data-search="farm"]').fill('sAo joSe');
   assert.equal(await page.locator('[data-filter="farm"]').evaluateAll(nodes=>nodes.filter(el=>!el.closest('label').hidden).length),1);
   await page.locator('[data-filter="farm"][value="FAZENDA SÃO JOSÉ"]').check();
   assert.equal(await chartState(page),before);assert.equal(await page.locator('#kpis').textContent(),kpis);
   assert.match(await page.locator('.mobile-filter-footer p').textContent(),/Seleções alteradas/);
   assert.equal(await page.evaluate(()=>JSON.stringify(sessionStorage)),sessionBefore,'Rascunho não é salvo como aplicado');
   await page.locator('[data-filter-choice="farm"] summary').click();await choice(page,'lot');
   await page.locator('[data-search="lot"]').fill('L0');await page.locator('[data-select-all="lot"]').check();
   assert.equal(await page.locator('[data-filter="lot"]:checked').count(),9);assert.equal(await chartState(page),before);
   // Escape closes list first, panel second; reopening preserves search and marks.
   await page.locator('[data-search="lot"]').focus();await page.keyboard.press('Escape');
   assert.equal(await page.locator('.mobile-filter-toggle').getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');assert.equal(await page.locator('.mobile-filter-toggle').getAttribute('aria-expanded'),'false');
   await open(page);await choice(page,'lot');assert.equal(await page.locator('[data-filter="lot"]:checked').count(),9);
   assert.equal(await page.locator('[data-search="lot"]').inputValue(),'L0');
   await apply(page);assert.notEqual(await chartState(page),before);assert.equal(requests,network,'Aplicar não refaz a consulta da base');
   const applied=await chartState(page);await open(page);
   await page.locator('#clearFilters').click();assert.equal(await chartState(page),applied,'Limpar só limpa rascunho');
   assert.equal(await page.locator('[data-filter]:checked').count(),0);await apply(page);assert.equal(await chartState(page),before);
   await open(page);await page.locator('[data-month="1"]').click();assert.equal(await chartState(page),before,'Mês também é rascunho');await apply(page);assert.match(await page.locator('#recordCount').textContent(),/^0 de /);
   await open(page);await page.locator('#clearFilters').click();await apply(page);assert.equal(await chartState(page),before);
   if(file==='incubatorio.html'){
    await open(page);await page.locator('[data-filter="origin"][value="Terceiros"]').check();assert.equal(await chartState(page),before);
    assert.equal(await page.locator('[data-filter="farm"]').count(),1,'Origem afunila fazendas no rascunho');await apply(page);assert.notEqual(await chartState(page),before);
    await open(page);await page.locator('#clearFilters').click();await apply(page);assert.equal(await chartState(page),before);
   }
   // Applying a pending draft once when crossing to desktop; same nodes return home.
   await open(page);await choice(page,'lot');await page.locator('[data-filter="lot"][value="L02"]').check();
   await page.evaluate(()=>{window.chartWrites=0;const c=echarts.getInstanceByDom(document.querySelector('.mz-chart')),original=c.setOption.bind(c);c.setOption=(...args)=>{if(args[1]===true)window.chartWrites++;return original(...args);};});
   await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(400);
   assert.ok(await page.locator('.mz-filters').isVisible());assert.equal(await page.locator('.mobile-filter-shell').isVisible(),false);
   assert.ok(await page.locator('.mz-filters #filterFields').evaluate(el=>el===window.originalFields));
   assert.equal(await page.locator('[data-filter="lot"][value="L02"]').isChecked(),true);
   assert.equal(await page.evaluate(()=>window.chartWrites),1,'Rascunho aplicado uma única vez ao voltar ao PC');
   const saved=await page.evaluate(()=>Object.keys(sessionStorage).filter(key=>key.endsWith(document.querySelector(".mz-breadcrumb strong").textContent)&&key.startsWith('bi-matrizes-filtros')).map(key=>JSON.parse(sessionStorage.getItem(key))));
   assert.deepEqual(saved[0].filters.lot,['L02']);
   // Desktop maintains immediate updates.
   await choice(page,'lot');const desktopBefore=await chartState(page);await page.locator('[data-filter="lot"][value="L03"]').check();assert.notEqual(await chartState(page),desktopBefore);
   await page.setViewportSize({width:820,height:1180});await page.waitForTimeout(350);assert.ok(await page.locator('.mobile-filter-shell').isVisible());
   await open(page);assert.equal(await page.locator('[data-filter="lot"]:checked').count(),2);await page.locator('#clearFilters').click();await apply(page);
   await page.setViewportSize({width:390,height:844});
   console.log('PASS draft/search/cascade/apply/clear/desktop: '+file);
  }
  // Gestures and keyboard snap states, page scroll, safe geometry and themes.
  await page.goto(base+'/incubatorio.html');await loaded(page);await open(page);
  const handle=page.locator('.mobile-filter-handle'),surface=page.locator('.mobile-filter-surface');
  let box=await handle.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+20);await page.mouse.down();await page.mouse.move(box.x+box.width/2,35,{steps:15});await page.mouse.up();await page.waitForTimeout(300);
  assert.ok((await surface.boundingBox()).height>790,'Arraste expande');
  box=await handle.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+20);await page.mouse.down();await page.mouse.move(box.x+box.width/2,810,{steps:15});await page.mouse.up();await page.waitForTimeout(300);
  assert.equal(Math.round((await surface.boundingBox()).height),56,'Arraste recolhe');
  await page.locator('.mobile-filter-toggle').focus();await page.keyboard.press('ArrowUp');await page.waitForTimeout(300);assert.ok((await surface.boundingBox()).height>400);
  await page.keyboard.press('End');await page.waitForTimeout(300);assert.ok((await surface.boundingBox()).height>790);
  await page.keyboard.press('Home');await page.waitForTimeout(300);assert.equal(Math.round((await surface.boundingBox()).height),56);
  await page.locator('.mz-layout').evaluate(el=>el.scrollTop=600);assert.ok(await page.locator('.mz-layout').evaluate(el=>el.scrollTop)>0);
  assert.ok((await surface.boundingBox()).y>700,'Cápsula permanece acessível na rolagem');
  await open(page);await page.locator('.mobile-filter-scroll').evaluate(el=>el.scrollTop=500);assert.ok(await page.locator('.mobile-filter-scroll').evaluate(el=>el.scrollTop)>0);
  await page.locator('.side-nav-rail').click();assert.equal(await page.locator('.mobile-filter-shell').isVisible(),false);assert.ok(await page.locator('.mobile-filter-shell').evaluate(el=>el.inert));
  await page.locator('.side-nav-close').click();assert.ok(await page.locator('.mobile-filter-shell').isVisible());
  await page.keyboard.press('Escape');await page.locator('[data-formula]').first().click();assert.equal(await page.locator('.mobile-filter-shell').isVisible(),false);await page.locator('dialog').evaluate(el=>el.close());
  await page.locator('[data-expand]').first().click();assert.equal(await page.locator('.mobile-filter-shell').isVisible(),false);await page.keyboard.press('Escape');
  fs.mkdirSync(path.join(root,'artifacts','mobile-filters'),{recursive:true});
  for(const width of [320,390,768,1024])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:width>700?1180:844});await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
   await open(page);await page.locator('.mobile-filter-expand').click();await page.waitForTimeout(300);
   const geometry=await page.locator('.mobile-filter-surface').boundingBox();assert.ok(geometry.x>=10&&geometry.x+geometry.width<=width-10);assert.ok(geometry.y>=0);
   assert.ok(await page.locator('.mobile-filter-apply').isVisible());assert.equal(await page.locator('.mobile-filter-shell').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
   await page.locator('.mobile-filter-scroll').evaluate(el=>el.scrollTop=0);
   await page.screenshot({path:path.join(root,'artifacts','mobile-filters',`${width}-${theme}.png`)});
   await page.locator('.mobile-filter-toggle').click();await page.waitForTimeout(300);
   if(width===390)await page.screenshot({path:path.join(root,'artifacts','mobile-filters',`${width}-${theme}-capsule.png`)});
  }
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.mobile-filter-shell').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  await page.setViewportSize({width:390,height:844});await open(page);await page.locator('.mobile-filter-expand').click();
  await page.locator('.mobile-filter-shell').evaluate(el=>{el.style.setProperty('--mobile-safe-bottom','34px');window.dispatchEvent(new Event('resize'));});
  assert.ok((await surface.boundingBox()).y>=0,'Área segura não empurra o painel para fora da tela');
  assert.equal(Math.round((await surface.boundingBox()).height),770);
  await page.locator('.mobile-filter-shell').evaluate(el=>{el.style.removeProperty('--mobile-safe-bottom');window.dispatchEvent(new Event('resize'));});
  // VisualViewport keyboard simulation: maximum uses usable height, footer stays visible.
  await page.evaluate(()=>{Object.defineProperty(window.visualViewport,'height',{configurable:true,value:430});window.visualViewport.dispatchEvent(new Event('resize'));});await page.waitForTimeout(300);
  assert.equal(Math.round((await surface.boundingBox()).height),390);assert.ok((await surface.boundingBox()).y>=0);
  await context.close();
  // Touch tablets in landscape and standalone/PWA mode follow the same component.
  const tablet=await setup({viewport:{width:1366,height:1024},hasTouch:true,isMobile:true});
  await tablet.page.addInitScript(()=>{const match=window.matchMedia.bind(window);window.matchMedia=query=>query==='(display-mode: standalone)'?{matches:true,media:query,addEventListener(){},removeEventListener(){}}:match(query);});
  await tablet.page.goto(base+'/producao.html');await loaded(tablet.page);assert.ok(await tablet.page.locator('.mobile-filter-shell').isVisible());await open(tablet.page);
  const cdp=await tablet.context.newCDPSession(tablet.page);
  async function touchDrag(to){
   const r=await tablet.page.locator('.mobile-filter-handle').boundingBox(),x=r.x+r.width/2,y=r.y+20;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(to-y)*i/12}]});await tablet.page.waitForTimeout(18);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await tablet.page.waitForTimeout(300);
  }
  await touchDrag(30);assert.ok((await tablet.page.locator('.mobile-filter-surface').boundingBox()).height>980,'Arraste por toque expande');
  await touchDrag(995);assert.equal(Math.round((await tablet.page.locator('.mobile-filter-surface').boundingBox()).height),56,'Arraste por toque recolhe');
  await open(tablet.page);await apply(tablet.page);await tablet.context.close();
  // Lifecycle/error contract of the shared component, isolated from the data layer.
  const unit=await setup();await unit.page.setContent('<aside id="home"><div id="fields"></div><button id="clear">Limpar filtros</button></aside>');
  await unit.page.addScriptTag({url:base+'/assets/js/mobile-filters.js'});
  await unit.page.evaluate(()=>{
   window.attempts=0;window.releaseApply=null;window.failApply=true;
   MobileFilterPanel.create({fields:document.getElementById('fields'),container:document.getElementById('home'),clear:document.getElementById('clear'),getCount:()=>1,isDirty:()=>true,onModeChange(){},onApply:async()=>{attempts++;await new Promise(resolve=>releaseApply=resolve);if(failApply)throw new Error('Falha simulada');}});
   document.querySelector('.mobile-filter-toggle').click();document.querySelector('.mobile-filter-apply').click();document.querySelector('.mobile-filter-apply').click();
  });
  assert.equal(await unit.page.evaluate(()=>attempts),1);assert.ok(await unit.page.locator('.mobile-filter-apply').isDisabled());
  await unit.page.evaluate(()=>releaseApply());await unit.page.waitForTimeout(50);
  assert.match(await unit.page.locator('.mobile-filter-footer p').textContent(),/Não foi possível aplicar/);assert.equal(await unit.page.locator('.mobile-filter-apply').isDisabled(),false);
  assert.equal(await unit.page.locator('.mobile-filter-toggle').getAttribute('aria-expanded'),'true');
  await unit.page.evaluate(()=>{failApply=false;document.querySelector('.mobile-filter-apply').click();releaseApply();});await unit.page.waitForTimeout(50);
  assert.equal(await unit.page.evaluate(()=>attempts),2);assert.equal(await unit.page.locator('.mobile-filter-toggle').getAttribute('aria-expanded'),'false');await unit.context.close();
  assert.deepEqual(errors,[]);console.log('PASS gestures, responsiveness, light/dark, reduced motion, keyboard simulation and touch tablet/PWA simulation');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
