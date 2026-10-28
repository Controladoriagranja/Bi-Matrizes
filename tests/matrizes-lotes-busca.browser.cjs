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
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addInitScript(()=>sessionStorage.setItem('granjabi_auth_token','teste-isolado'));
 let delay=false,fail=false;
 await context.route('https://api-bi-granja.controladoriagb05.workers.dev/**',async route=>{
  if(delay)await new Promise(resolve=>setTimeout(resolve,150));
  const u=new URL(route.request().url()),table=u.pathname.split('/').at(-1),rows=fixtures[table],size=Number(u.searchParams.get('tamanho')),page=Number(u.searchParams.get('pagina'));
  assert.ok(rows,table);if(fail)return route.fulfill({status:503,json:{detail:'Falha simulada'}});
  await route.fulfill({json:{tabela:table,pagina:page,tamanho:size,total:rows.length,total_paginas:Math.ceil(rows.length/size),dados:rows.slice((page-1)*size,page*size)}});
 });
 const page=await context.newPage(),errors=[],testedFilters=new Set();page.on('pageerror',error=>errors.push(error.message));
 const base='http://127.0.0.1:'+server.address().port;
 const complete=()=>page.locator('#loadStatus').filter({hasText:'histórico completo'}).waitFor();
 const period=async()=>{for(const [id,value] of [['startDate','2026-07-01'],['endDate','2026-10-23']]){await page.locator('#'+id).fill(value);await page.locator('#'+id).dispatchEvent('change');}};
 const open=async key=>{const details=page.locator(`[data-filter-choice="${key}"]`);if(await details.getAttribute('open')===null)await details.locator('summary').click();};
 const option=key=>page.locator(`[data-filter="${key}"]`);
 const chart=async id=>page.locator('#chart-'+id).evaluate(el=>{const c=echarts.getInstanceByDom(el);return {points:c.mzPoints,zoom:c.getOption().dataZoom};});
 try{
  // Prova da causa raiz anterior: hidden=true nao escondia um label com display:flex.
  const oldCss='.mz-options label { display:flex; }';
  await page.setContent('<style>'+oldCss+'</style><div class="mz-options"><label hidden>Opção oculta</label></div>');
  assert.equal(await page.locator('label').evaluate(el=>getComputedStyle(el).display),'flex');
  for(const file of ['index.html','producao.html','incubatorio.html','embrio.html']){
   await page.goto(base+'/'+file);await complete();await period();
   if(file==='producao.html'){
    delay=true;await page.locator('#refresh').click();await open('farm');await page.locator('[data-search="farm"]').fill('sao jose');await complete();delay=false;
    assert.equal(await page.locator('[data-search="farm"]').inputValue(),'sao jose');
    assert.equal(await page.evaluate(()=>document.activeElement?.dataset.search),'farm','Foco da busca preservado durante a carga');
    await page.locator('[data-clear-search="farm"]').click();await page.locator('[data-filter-choice="farm"] summary').click();
   }
   const keys=await page.locator('[data-filter-choice]').evaluateAll(nodes=>nodes.map(el=>el.dataset.filterChoice));
   for(const key of keys){
    testedFilters.add(key);await open(key);
    const count=await option(key).count(),input=page.locator(`[data-search="${key}"]`);
    assert.equal(await input.getAttribute('placeholder'),'Digite para buscar...');await input.fill('zzzz-sem-correspondencia');
    assert.equal(await option(key).evaluateAll(nodes=>nodes.filter(el=>!el.closest('label').hidden).length),0);
    assert.ok(await page.locator(`[data-filter-choice="${key}"] .mz-search-empty`).isVisible());
    assert.ok(await page.locator(`[data-select-all="${key}"]`).isDisabled());
    if(count)assert.equal(await option(key).first().isVisible(),false,'CSS esconde de fato '+key);
    await page.locator(`[data-clear-search="${key}"]`).click();
    assert.equal(await option(key).evaluateAll(nodes=>nodes.filter(el=>!el.closest('label').hidden).length),count);
    await page.locator(`[data-filter-choice="${key}"] summary`).click();
   }
   await open('farm');await page.locator('[data-search="farm"]').fill('sAo JoSe');
   assert.equal(await option('farm').evaluateAll(nodes=>nodes.filter(el=>!el.closest('label').hidden).length),1);
   await page.locator('[data-filter="farm"][value="FAZENDA SÃO JOSÉ"]').check();
   assert.equal(await page.locator('[data-search="farm"]').inputValue(),'sAo JoSe','Busca preservada ao redesenhar');
   assert.equal(await page.locator('[data-filter="lineage"][value="COBB"]').count(),1);
   await page.locator('[data-clear-search="farm"]').click();assert.ok(await page.locator('[data-filter="farm"][value="FAZENDA SÃO JOSÉ"]').isChecked());
   await page.locator('[data-filter-choice="farm"] summary').click();
   await open('lot');await page.locator('[data-filter="lot"][value="L30"]').check();
   await page.locator('[data-search="lot"]').fill('L0');await page.locator('[data-select-all="lot"]').check();
   assert.ok(await page.locator('[data-filter="lot"][value="L30"]').isChecked());
   assert.equal(await page.locator('[data-filter="lot"]:checked').count(),10);
   await page.locator('[data-select-all="lot"]').uncheck();assert.equal(await page.locator('[data-filter="lot"]:checked').count(),1,'Preserva selecionado fora da busca');
   await page.locator('#clearFilters').click();await period();
   if(file==='index.html'||file==='embrio.html'){assert.equal(await page.locator('.mz-period-flags input[value=lote]').count(),0);continue;}
   const ids=file==='producao.html'?['producao','aproveitamento']:['eclosao','descarte','ovos-aproveitamento'];
   assert.equal(await page.locator('.mz-period-flags input[value=lote]').count(),ids.length);
   for(const id of ids){
    const card=page.locator('#card-'+id),before=await chart(id);
    await card.locator('input[value=lote]').check();const list=page.locator('#lots-'+id);
    assert.ok(await list.isVisible());assert.equal(await page.locator('#chart-'+id).isVisible(),false);
    assert.equal(await list.locator('li').count(),10);assert.match(await list.locator('.mz-lot-more').textContent(),/10 de 31 lotes/);
    if(id==='producao'||id==='eclosao'){
     assert.equal(await list.locator('.mz-lot-value').first().textContent(),'68,0%');
     assert.equal(await list.locator('.mz-lot-dot').first().getAttribute('aria-label'),'Pior que a meta');
     assert.match(await list.locator('.mz-lot-detail').first().textContent(),/-2,0 pontos percentuais/);
     assert.equal(await list.locator('.mz-lot-dot').nth(2).getAttribute('aria-label'),'Igual ou melhor que a meta');
    }
    if(id==='ovos-aproveitamento')assert.equal(await list.locator('.mz-lot-value').first().textContent(),'40,0%','Media simples pronta');
    if(id==='ovos-aproveitamento'||id==='descarte')assert.equal(await list.locator('.mz-lot-dot').count(),0,'Sem meta, sem bolinha');
    await list.locator('[data-lots-more]').click();assert.equal(await list.locator('li').count(),20);await list.locator('[data-lots-more]').click();assert.equal(await list.locator('li').count(),30);await list.locator('[data-lots-more]').click();assert.equal(await list.locator('li').count(),31);
    assert.equal(await list.locator('.mz-lot-name strong').filter({hasText:'Lote L01'}).count(),2,'Mesmo lote em fazendas diferentes');
    await card.locator('input[value=semana]').check();assert.deepEqual((await chart(id)).points,before.points);
    // Drill -> Lote respeita aquela semana; retornar a Dia restaura o drill.
    await page.locator('#chart-'+id).evaluate(el=>echarts.getInstanceByDom(el).trigger('click',{componentType:'series',dataIndex:0}));
    const drilled=await chart(id);await card.locator('input[value=lote]').check();assert.match(await list.locator('.mz-lot-scope').textContent(),/Lotes · Semana/);
    await card.locator('input[value=dia]').check();assert.deepEqual((await chart(id)).points,drilled.points,'Restaura dias da semana');
    await card.locator('.mz-drill-back').click();
   }
   // Janela de oito semanas efetiva; Mostrar todas inclui historico e muda resultado.
   const id=ids[0],card=page.locator('#card-'+id),list=page.locator('#lots-'+id);
   await card.locator('input[value=lote]').check();assert.equal(await list.locator('.mz-lot-value').first().textContent(),'68,0%');
   await page.locator('#toggleWeeks').click();assert.equal(await list.locator('.mz-lot-name strong').first().textContent(),'Lote L02');
   await page.locator('#toggleWeeks').click();assert.equal(await list.locator('.mz-lot-name strong').first().textContent(),'Lote L01');assert.equal(await list.evaluate(el=>el.scrollTop),0,'Novo contexto comeca pelos piores lotes');
   await card.locator('input[value=semana]').check();
   const beforeKeyboard=await chart(id);await card.locator('input[value=semana]').focus();await page.keyboard.press('ArrowRight');assert.ok(await card.locator('input[value=lote]').isChecked());await page.keyboard.press('ArrowLeft');assert.ok(await card.locator('input[value=semana]').isChecked());assert.deepEqual((await chart(id)).points,beforeKeyboard.points);
   await page.locator('#chart-'+id).evaluate(el=>{const c=echarts.getInstanceByDom(el);c.setOption({dataZoom:[{type:'inside',start:20,end:70}]});});
   await card.locator('input[value=lote]').check();await card.locator('input[value=semana]').check();assert.equal((await chart(id)).zoom[0].start,20);
   await card.locator('input[value=lote]').check();
   const out=path.join(root,'artifacts','lotes-busca');fs.mkdirSync(out,{recursive:true});
   for(const width of [1440,768,390,320]){
    await page.setViewportSize({width,height:900});
    for(const theme of ['light','dark']){
     await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.dispatchEvent(new Event('dashboard:theme-changed'));},theme);await page.waitForTimeout(80);
     assert.equal(await list.evaluate(el=>el.scrollWidth>el.clientWidth),false,'Sem rolagem lateral na lista');
     if(width<=600){assert.equal(await list.locator('.mz-lot-meta').first().isVisible(),false);assert.equal(await list.locator('.mz-lot-detail').first().isVisible(),false);assert.equal(await list.locator('.mz-lot-track').first().isVisible(),false);}
     const overlap=await card.evaluate(el=>{const a=el.querySelector('h2').getBoundingClientRect(),b=el.querySelector('.mz-chart-actions').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});assert.equal(overlap,false);
     await card.screenshot({path:path.join(out,file+'-'+width+'-'+theme+'.png')});
    }
   }
   await card.locator('[data-expand]').click();assert.ok(await list.isVisible());await page.keyboard.press('Escape');
   await page.setViewportSize({width:1440,height:1000});
   // Período vazio e carregamento, sem consulta nova para alternar Lote.
   await page.locator('#startDate').fill('2027-01-01');await page.locator('#startDate').dispatchEvent('change');assert.match(await list.textContent(),/Sem lotes no período selecionado/);
   delay=true;await page.locator('#refresh').click();assert.match(await list.textContent(),/Carregando lotes/);await complete();delay=false;
   await page.locator('#clearFilters').click();await page.setViewportSize({width:1440,height:1000});
  }
  assert.deepEqual(errors,[]);console.log('PASS: busca real em '+[...testedFilters].join(', ')+'; acento, X, nenhum resultado, selecoes e cascata. Cinco cards Lote: formulas, meta, 8/todas, 10/+10, fazendas, drill/retorno/zoom, vazio/carga, expansao, 4 larguras e temas.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
