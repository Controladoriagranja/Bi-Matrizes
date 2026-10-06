import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(import.meta.dirname,'..');
const examplePaths=process.argv.slice(2);
const tables=['acerto_produtor_producao','acerto_produtor_recria','eclosao','embrio','granja','inc','incubacao'];
const fixtures={};
if(examplePaths.length) {
  assert.equal(examplePaths.length,7,'Passe os sete exemplos na ordem descrita no script.');
  for(const file of examplePaths) {const data=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));fixtures[data.tabela]=data.dados;}
} else {
  for(const table of tables)fixtures[table]=[];
  for(let i=0;i<25;i++) {
    const date=i===24?'2026-10-01':i>=20?`2026-09-${String(i-19).padStart(2,'0')}`:`2026-08-${String(i+1).padStart(2,'0')}`;
    const common={id:i+1,carregado_em:'2026-10-05T10:37:00',data:date,lote:i%2?'A':'B',granja:'FAZENDA EXEMPLO',galpao:'01',linhagem:i%2?'COBB':'HUBBARD',idade:30+i%3,empresa_codigo:'2',unidade_codigo:'1'};
    fixtures.granja.push({...common,saldo_femeas:1000,ovos_produzidos:700,prod_std_pct:68,incubaveis_granja:679,cama:21,cama_std_pct:4,aprov_std_pct:97,trincado:5,sujo:4,vazado:3,duas_gemas:4,deformado:3,pequeno:2});
    fixtures.acerto_produtor_producao.push({...common,ini_semana:date,cab_lote:common.lote,cab_granja:common.granja,cab_galpao:'01',cab_linhagem:i%2?'COBB':'HUBBARD',ida_sem:common.idade,saldo_femea:1000,producao:'70,00',producao_std:'68,00',tipo_movto:'Diário'});
    fixtures.acerto_produtor_recria.push({...common,ini_semana:date,cab_lote:common.lote,cab_granja:common.granja,cab_galpao:'01',cab_linhagem:i%2?'COBB':'HUBBARD',ida_sem:i+1,cab_femeas:1000,saldo_femea:990,viab_fem:99,std_viab_fem:98,ps_medio_femeas:100+i*30,ps_medio_std_femeas:100+i*28,unif_femeas:85,unif_std_femeas:80,cv_femeas:6,cab_macho:100,saldo_macho:99,viab_mac:99,std_viab_mac:98,ps_medio_machos:120+i*40,ps_medio_std_machos:120+i*39,unif_machos:80,unif_std_machos:80,cv_machos:7,situacao:'Aberto'});
    fixtures.eclosao.push({...common,eclosao:date,incubacao:'2026-07-11',quantid:'1.000',nascidos:'800',descarte:'8',eclosao_std:'85,00',origem:'Próprio'});
    fixtures.embrio.push({...common,integrado:common.granja,incubados:'1.000',nascidos:'800',nao_eclodidos:'200',total_analisado:'100',qtde:'5',std:'4,00',qtde_2:'3',std_2:'4,00',qtde_3:'1',std_3:'0,50',qtde_4:'5',std_4:'4,00',qtde_7:'1',qtde_8:'1',qtde_9:'1',qtde_10:'0',std_9:'0,75',std_10:'0,00'});
    fixtures.inc.push({...common,recebimento:date,total:700,origem:'Próprio'});
    fixtures.incubacao.push({...common,data_incubacao:date,quantidade:700,dias_estoque:i?'03-':'04-03-02-'});
  }
}
const contentTypes={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.md':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':contentTypes[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
const screenshotDir=path.join(root,'artifacts','qa');fs.mkdirSync(screenshotDir,{recursive:true});
try {
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>sessionStorage.setItem('granjabi_auth_token','test-only-token'));
  const requests=[];
  await context.route('https://api-bi-granja.controladoriagb05.workers.dev/**',async route=>{
    const request=route.request(),url=new URL(request.url()),table=url.pathname.split('/').at(-1);
    assert.equal(request.headers().authorization,'Bearer test-only-token');
    assert.ok(fixtures[table],`Tabela desconhecida: ${table}`);
    const number=Number(url.searchParams.get('pagina')),size=10,records=fixtures[table];requests.push({table,number});
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({esquema:'matrizes',tabela:table,colunas:Object.keys(records[0]||{}),total:records.length,pagina:number,tamanho:size,total_paginas:Math.max(1,Math.ceil(records.length/size)),dados:records.slice((number-1)*size,number*size)})});
  });
  const errors=[],page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const base=`http://127.0.0.1:${server.address().port}`;
  const files=['index.html','producao.html','incubatorio.html','embrio.html'];
  for(const file of files) {
    if(!page.url().endsWith(`/${file}`))await page.goto(`${base}/${file}`);
    await page.waitForFunction(()=>document.querySelector('#loadStatus')?.textContent.includes('histórico completo'));
    assert.equal(await page.locator('#error').isVisible(),false);
    if(file==='index.html')assert.ok((await page.locator('.mz-kpi small').first().textContent()).includes('Média simples do período selecionado'));
    if(file==='index.html')for(const id of ['viabilidade','uniformidade','peso','gad']){
      const rows=page.locator(`#table-${id} tbody tr`);assert.equal(await rows.count(),22);
      assert.equal(await rows.first().locator('th').textContent(),'1');assert.equal(await rows.last().locator('th').textContent(),'22');
      assert.ok(!(await page.locator(`#caption-${id}`).textContent()).includes('8 semanas'));
    }

    for(const id of file==='index.html'?[]:file==='producao.html'?['producao','aproveitamento','cama','perdas']:file==='embrio.html'?['nao-eclodidos','infertilidade','contaminados','trincados','mortalidade-inicial','mortalidade-media','mortalidade-final']:['eclosao','descarte','etaria','incubacao','estoque'])assert.ok(await page.locator(`#table-${id} tbody tr`).count()<=8);
    assert.equal(await page.getByText('Regras dos indicadores',{exact:true}).count(),0);
    assert.equal(await page.locator('#receiptsButton').count(),0);
    assert.ok(await page.locator('#clearFilters').evaluate(el=>el.classList.contains('button-ghost-danger')));

    assert.equal(await page.locator('.mz-chart svg').count(),await page.locator('.mz-chart').count());
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${file}: overflow desktop`);
    if(file!=='index.html') {
    await page.locator('#toggleWeeks').click();assert.equal(await page.locator('#toggleWeeks').getAttribute('aria-pressed'),'true');
    await page.locator('#toggleWeeks').click();assert.equal(await page.locator('#toggleWeeks').getAttribute('aria-pressed'),'false');
    } else assert.equal(await page.locator('#toggleWeeks').isVisible(),false);
    await page.locator('[data-formula]').first().click();assert.equal(await page.locator('.mz-formula-dialog').isVisible(),true);
    assert.match(await page.locator('.mz-formula-dialog').textContent(),/Média simples/);await page.keyboard.press('Escape');
    await page.evaluate(()=>document.querySelector('.mz-layout').scrollTop=700);
    assert.ok(await page.locator('.mz-layout').evaluate(el=>el.scrollTop)>0,'O conteúdo realmente rolou');
    assert.equal(await page.locator('.mz-topbar').evaluate(el=>el.getBoundingClientRect().top),0);
    await page.evaluate(()=>document.querySelector('.mz-layout').scrollTop=0);
    const font=await page.locator('body').evaluate(el=>getComputedStyle(el).fontFamily);assert.match(font,/Geist Variable/);
    for(const selector of ['#clearFilters','.mz-chart-head h2','.mz-choice summary','.mz-chart svg text'])assert.match(await page.locator(selector).first().evaluate(el=>getComputedStyle(el).fontFamily),/Geist Variable/);
    await page.locator('.side-nav-rail').click();
    assert.equal(await page.locator('.side-nav-link').count(),4);
    assert.equal(await page.locator('.side-nav-link[aria-current="page"]').getAttribute('href'),file);
    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-menu.png')),fullPage:true});
    await page.keyboard.press('Escape');assert.equal(await page.locator('.side-nav-root.open').count(),0);
    await page.locator('[data-table]').first().click();assert.equal(await page.locator('.mz-table-wrap').first().isVisible(),true);
    await page.locator('[data-table]').first().click();
    await page.locator('[data-expand]').first().click();assert.equal(await page.locator('.mz-chart-card.expanded').count(),1);
    await page.keyboard.press('Escape');assert.equal(await page.locator('.mz-chart-card.expanded').count(),0);
    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-desktop.png')),fullPage:true});
    if(file==='producao.html') {
      const before=await page.locator('#recordCount').textContent();
      assert.equal(await page.locator('#startDate').inputValue(),'2026-08-01');
      assert.equal(await page.locator('#endDate').inputValue(),'2026-09-30');
      if(!examplePaths.length){
        await page.locator('[data-month="8"]').click();
        assert.match(await page.locator('#recordCount').textContent(),/^20 de /);
        assert.equal(await page.locator('#startDate').inputValue(),'');
        await page.locator('[data-month="9"]').click();
        assert.match(await page.locator('#recordCount').textContent(),/^24 de /);
        await page.locator('#clearFilters').click();
      }

      await page.locator('[data-month="1"]').click();assert.match(await page.locator('#recordCount').textContent(),/^0 de /);
      await page.locator('#clearFilters').click();assert.equal((await page.locator('#recordCount').textContent()).split(' · ')[0],before.split(' · ')[0]);
      if(!examplePaths.length){
        await page.locator('[data-filter-choice="lineage"] summary').click();
        await page.locator('[data-filter="lineage"][value="COBB"]').check();
        assert.equal(await page.locator('[data-filter="lot"][value="B"]').count(),0);
        assert.equal(await page.locator('[data-filter="lot"][value="A"]').count(),1);
        const position=await page.evaluate(()=>{const filters=document.querySelector('.mz-filters');filters.scrollTop=filters.scrollHeight;return filters.scrollTop;});
        await page.locator('#clearFilters').click();
        assert.ok(Math.abs(await page.locator('.mz-filters').evaluate(el=>el.scrollTop)-position)<2,'Posição dos filtros preservada');
      }
      await page.locator('[data-theme-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
      await page.screenshot({path:path.join(screenshotDir,'producao-dark.png'),fullPage:true});
      await page.locator('[data-theme-toggle]').click();
    }
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) {
      await page.screenshot({path:path.join(screenshotDir,'mobile-overflow.png'),fullPage:true});
      console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right})).slice(0,15)));
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${file}: overflow mobile`);
    assert.equal(await page.locator('#filterFields').isVisible(),true);
    assert.equal(await page.locator('#toggleFilters').count(),0);
    assert.equal(await page.locator('.mz-topbar').evaluate(el=>getComputedStyle(el).position),'fixed');
    await page.locator('.mz-layout').evaluate(el=>el.scrollTop=500);
    assert.equal(await page.locator('.mz-topbar').evaluate(el=>el.getBoundingClientRect().top),0);
    await page.locator('.mz-layout').evaluate(el=>el.scrollTop=0);
    await page.locator('.side-nav-rail').click();
    assert.equal(await page.locator('.side-nav-panel').getAttribute('aria-hidden'),'false');
    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-menu-mobile.png')),fullPage:true});
    await page.locator('.side-nav-close').click();
    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-mobile.png')),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    const next=files[files.indexOf(file)+1];
    if(next){await page.locator('.side-nav-rail').click();await page.locator(`.side-nav-link[href="${next}"]`).click();await page.waitForURL(`${base}/${next}`);}
  }
  for(const table of tables.filter(table=>table!=='inc'))assert.ok(requests.some(r=>r.table===table&&r.number===3),`${table}: última página não consultada`);
  assert.deepEqual(errors,[],'Erros JavaScript no navegador');
  const embeddedPage=await context.newPage();
  await embeddedPage.goto(`${base}/index.html`);
  await embeddedPage.setContent(`<div style="position:fixed;inset:20px;display:flex;flex-direction:column;overflow:hidden"><div style="height:36px;flex-shrink:0">CENTRAL</div><iframe src="${base}/producao.html" style="border:0;flex:1;width:100%;min-height:0"></iframe></div>`);
  const report=embeddedPage.frameLocator('iframe');
  await report.locator('#loadStatus').filter({hasText:'completo'}).waitFor({timeout:30000});
  await report.locator('.mz-topbar').evaluate(el=>el.ownerDocument.querySelector('.mz-layout').scrollTop=900);
  assert.equal(await report.locator('.mz-topbar').evaluate(el=>el.getBoundingClientRect().top),0,'Cabe?alho deve permanecer fixo dentro da CENTRAL');
  await embeddedPage.close();
  await context.close();
  // Missing CENTRAL session must stop before any network request.
  const noAuth=await browser.newContext(),unauthPage=await noAuth.newPage();let unauthRequests=0;
  await noAuth.route('https://api-bi-granja.controladoriagb05.workers.dev/**',route=>{unauthRequests++;return route.abort();});
  await unauthPage.goto(`${base}/index.html`);await unauthPage.locator('#error').waitFor({state:'visible'});
  assert.match(await unauthPage.locator('#error').textContent(),/Sessão do Portal BI não encontrada/);assert.equal(unauthRequests,0);
  await unauthPage.screenshot({path:path.join(screenshotDir,'sessao-ausente.png'),fullPage:true});await noAuth.close();
  // Inconsistent pagination never produces a partial dashboard.
  const broken=await browser.newContext();await broken.addInitScript(()=>sessionStorage.setItem('granjabi_auth_token','test-only-token'));
  await broken.route('https://api-bi-granja.controladoriagb05.workers.dev/**',route=>{
    const url=new URL(route.request().url()),number=Number(url.searchParams.get('pagina'));
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({tabela:url.pathname.split('/').at(-1),pagina:number,tamanho:10,total:25,total_paginas:3,dados:number===1?fixtures.granja.slice(0,10):[]})});
  });
  const brokenPage=await broken.newPage();await brokenPage.goto(`${base}/producao.html`);await brokenPage.locator('#error').waitFor({state:'visible'});
  assert.match(await brokenPage.locator('#error').textContent(),/incompleta/);
  assert.equal(await brokenPage.locator('.mz-kpi strong').first().textContent(),'—');await broken.close();
  console.log(`PASS: 4 telas desktop/mobile, menu lateral e navegação, tema, filtros, dados, ampliação, 6 tabelas com todas as páginas, sessão ausente e paginação incompleta. ${examplePaths.length?'Exemplos reais dos anexos.':'Dados sintéticos.'}`);
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
