import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(import.meta.dirname,'..');
const filtersOnly=process.argv.includes('--filters-only');
const examplePaths=process.argv.slice(2).filter(arg=>arg!=='--filters-only');
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
    fixtures.acerto_produtor_recria.push({...common,ini_semana:date,cab_lote:common.lote,cab_granja:common.granja,cab_galpao:'01',cab_linhagem:i%2?'COBB':'HUBBARD',ida_sem:i+1,cab_femeas:1000,saldo_femea:990,viab_fem:99,std_viab_fem:98,ps_medio_femeas:100+i*30,ps_medio_std_femeas:100+i*28,unif_femeas:85,unif_std_femeas:80,cv_femeas:6,consu_ali_gr_femeas:25+i*3,consu_ali_std_femeas:24+i*3,consu_ali_gr_machos:30+i*3,consu_ali_std_machos:29+i*3,cab_macho:100,saldo_macho:99,viab_mac:99,std_viab_mac:98,ps_medio_machos:120+i*40,ps_medio_std_machos:120+i*39,unif_machos:80,unif_std_machos:80,cv_machos:7,situacao:'Aberto'});
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
  const errors=[],warnings=[],page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(['warning','error'].includes(message.type()))warnings.push(message.text());});
  const base=`http://127.0.0.1:${server.address().port}`;
  const files=['index.html','producao.html','incubatorio.html','embrio.html'];
  const settle=async()=>{await page.waitForFunction(()=>[...document.querySelectorAll('.mz-chart')].every(el=>!echarts.getInstanceByDom(el)?.mzPresentationFrame));await page.waitForTimeout(300);};
  const stats=async id=>page.locator(`#chart-${id}`).evaluate(el=>{
    const chart=echarts.getInstanceByDom(el),positions=chart.mzLabelPositions||[],option=chart.getOption();
    return {drawn:chart.getZr().storage.getDisplayList().filter(item=>item.type==='tspan'&&item.z>=100&&item.style.opacity!==0).length,count:positions.length,rotated:positions.filter(item=>item.rotation).length,external:positions.filter(item=>item.external).length,
      candidates:chart.mzPoints.reduce((n,point)=>n+chart.mzSpec.series.filter(series=>series.type==='bar'&&point[series.key]!=null).length,0),
      series:JSON.stringify(option.series.map(item=>item.data)),tooltip:option.tooltip[0].formatter(chart.mzSpec.series.map((_,index)=>({seriesIndex:index,dataIndex:0,marker:''}))),
      positions:positions.map(({seriesIndex,index,x,y,width,height,rotation,inside,external})=>({seriesIndex,index,x,y,width,height,rotation,inside,external}))};
  });
  const metrics=[];

  for(const file of files) {
    if(!page.url().endsWith(`/${file}`))await page.goto(`${base}/${file}`);
    await page.waitForFunction(()=>document.querySelector('#loadStatus')?.textContent.includes('completo')).catch(async error=>{throw new Error(`${file}: ${await page.locator('#error').textContent()} / ${errors.join(' | ')} / ${error.message}`);});
    assert.equal(await page.locator('#error').isVisible(),false);
    if(filtersOnly){
      const ensureOpen=async key=>{if(await page.locator(`[data-filter-choice="${key}"]`).getAttribute('open')===null)await page.locator(`[data-filter-choice="${key}"] summary`).click();};
      assert.equal(await page.locator('#clearFilters').count(),1);assert.equal(await page.locator('.mz-topbar #clearFilters').count(),1);
      assert.equal(await page.locator('[data-select-all="month"],[data-select-all="sex"]').count(),0);
      assert.equal(await page.locator('[data-filter-choice][open]').count(),0,'Não abrir filtros ao carregar');
      const keys=await page.locator('[data-filter-choice]').evaluateAll(elements=>elements.map(el=>el.dataset.filterChoice));
      for(const key of keys){
        await page.locator('#clearFilters').click();await ensureOpen(key);
        const all=page.locator(`[data-select-all="${key}"]`),options=page.locator(`[data-filter="${key}"]`);
        assert.equal(await all.count(),1);assert.equal(await all.evaluate(el=>el.closest('.mz-options').firstElementChild===el.parentElement),true);
        if(!await options.count()){assert.equal(await all.isDisabled(),true);continue;}
        await all.check();await ensureOpen(key);assert.equal(await options.evaluateAll(inputs=>inputs.every(el=>el.checked)),true,`${key}: marcar todas`);
        assert.equal(await all.getAttribute('aria-checked'),'true');
        await all.uncheck();assert.equal(await options.evaluateAll(inputs=>inputs.every(el=>!el.checked)),true,`${key}: desmarcar todas`);
      }
      await page.locator('#clearFilters').click();await ensureOpen('lineage');
      await page.locator('[data-filter="lineage"][value="COBB"]').check();
      assert.equal(await page.locator('[data-select-all="lineage"]').getAttribute('aria-checked'),'mixed');
      assert.equal(await page.locator('[data-filter-choice="lineage"]').getAttribute('open'),null);
      assert.notEqual(await page.locator('[data-filter-choice="lot"]').getAttribute('open'),null);
      assert.equal(await page.locator('[data-filter="lot"][value="B"]').count(),0,'Preservar cascata existente');
      await page.locator('[data-filter="lot"][value="A"]').check();
      assert.equal(await page.locator('[data-filter-choice="lot"]').getAttribute('open'),null);
      assert.notEqual(await page.locator('[data-filter-choice="lineage"]').getAttribute('open'),null);
      assert.equal(await page.locator('[data-filter-choice][open]').count(),1,'Sem loop entre filtros');
      assert.equal(await page.evaluate(()=>document.activeElement.closest('[data-filter-choice]')?.dataset.filterChoice),'lineage');
      await page.locator('#clearFilters').click();await ensureOpen('lot');await page.locator('[data-search="lot"]').fill('A');
      await page.locator('[data-select-all="lot"]').check();await ensureOpen('lot');
      assert.equal(await page.locator('[data-filter="lot"][value="A"]').isChecked(),true);assert.equal(await page.locator('[data-filter="lot"][value="B"]').isChecked(),false);
      await page.locator('[data-select-all="lot"]').uncheck();await ensureOpen('lot');await page.locator('[data-search="lot"]').fill('sem resultado');
      assert.equal(await page.locator('[data-select-all="lot"]').isDisabled(),true);
      await page.locator('#clearFilters').click();await ensureOpen('age');
      const sticky=await page.locator('[data-filter-choice="age"] .mz-options').evaluate(el=>{el.scrollTop=el.scrollHeight;return {top:el.getBoundingClientRect().top,labelTop:el.querySelector('.mz-select-all').getBoundingClientRect().top,position:getComputedStyle(el.querySelector('.mz-select-all')).position};});
      assert.equal(sticky.position,'sticky');assert.ok(Math.abs(sticky.top-sticky.labelTop)<=1);
      await page.locator('[data-filter-choice="age"] summary').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('[data-filter-choice="age"]').getAttribute('open'),null);
      for(const width of [1440,768,430,390,320]){
        await page.setViewportSize({width,height:844});await settle();await page.locator('#clearFilters').click();
        const before=await page.locator('#clearFilters').boundingBox();await page.locator('.mz-layout').evaluate(el=>el.scrollTop=1000);const after=await page.locator('#clearFilters').boundingBox();
        assert.equal(after.y,before.y);assert.equal(after.x,before.x);assert.ok(after.x+after.width<=width);
        const geometry=await page.evaluate(()=>{const r=selector=>document.querySelector(selector).getBoundingClientRect();const lineage=r('[data-filter-choice="lineage"]'),lot=r('[data-filter-choice="lot"]'),clear=r('#clearFilters'),theme=r('[data-theme-toggle]');return {linked:lot.top>=lineage.bottom,aligned:Math.abs(lot.left-lineage.left)<1,overlap:clear.left<theme.right&&clear.right>theme.left&&clear.top<theme.bottom&&clear.bottom>theme.top};});
        assert.equal(geometry.linked,true);assert.equal(geometry.aligned,true);assert.equal(geometry.overlap,false);
        await page.locator('#clearFilters').click();assert.equal(await page.locator('[data-select-all]:checked').count(),0);assert.equal(await page.locator('[data-filter-choice][open]').count(),0);
      }
      await page.locator('[data-filter-choice="lineage"] summary').focus();await page.keyboard.press('Enter');await page.locator('[data-filter="lineage"]').first().focus();await page.keyboard.press('Space');
      assert.notEqual(await page.locator('[data-filter-choice="lot"]').getAttribute('open'),null,'Seleção pelo teclado também abre o parceiro');
      await page.locator('#clearFilters').click();await page.locator('.mz-layout').evaluate(el=>el.scrollTop=0);
      await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-filter-controls-mobile-light.png'))});
      await page.locator('[data-theme-toggle]').click();await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-filter-controls-mobile-dark.png'))});await page.locator('[data-theme-toggle]').click();
      await page.setViewportSize({width:1440,height:1000});await ensureOpen('lineage');await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-filter-controls-desktop.png'))});
      continue;
    }

    await page.waitForFunction(()=>echarts.getInstanceByDom(document.querySelector('.mz-chart'))?.getOption().graphic?.[0]?.elements?.some(item=>item.type==='text'&&item.z>5)).catch(()=>{throw new Error('Rotulos ausentes em '+file);});
    await page.locator('.mz-chart').first().evaluate(el=>{
      const option=echarts.getInstanceByDom(el).getOption();
      if(!option.graphic?.[0]?.elements?.some(item=>item.type==='text'&&item.z>5))throw new Error('Camada de rotulos vazia');
      if(option.tooltip[0].trigger!=='axis')throw new Error('Tooltip incompleto');
      if(option.series.some(item=>item.data.some(value=>value!==null&&typeof value!=='number')))throw new Error('Valores alterados');
      const mixed=option.series.some(item=>item.type==='bar')&&option.series.some(item=>item.type==='line');
      for(const series of option.series){
        if(series.type==='line'&&mixed){if(series.label.show||series.lineStyle.width<3)throw new Error('Linha mista sem destaque');}
        else if(!series.label.show)throw new Error('Rótulos ausentes');
      }
    });

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
    if(file==='index.html'&&!examplePaths.length){
      const beforeSelection=await page.locator('#recordCount').textContent();
      await page.locator('#chart-viabilidade').evaluate(el=>echarts.getInstanceByDom(el).trigger('click',{componentType:'series',dataIndex:11}));
      assert.match(await page.locator('#recordCount').textContent(),/^1 de /);
      assert.match(await page.locator('#chartSelectionStatus').textContent(),/12/);
      assert.equal(await page.locator('#table-peso tbody tr').nth(11).locator('td').first().textContent(),'430,00 g');
      await page.locator('#chart-viabilidade').evaluate(el=>echarts.getInstanceByDom(el).getZr().trigger('click',{target:null}));
      assert.equal(await page.locator('#recordCount').textContent(),beforeSelection);
    }
    const font=await page.locator('body').evaluate(el=>getComputedStyle(el).fontFamily);assert.match(font,/Geist Variable/);
    for(const selector of ['#clearFilters','.mz-chart-head h2','.mz-choice summary','.mz-chart svg text'])assert.match(await page.locator(selector).first().evaluate(el=>getComputedStyle(el).fontFamily),/Geist Variable/);
    await page.locator('.side-nav-rail').click();
    assert.equal(await page.locator('.side-nav-link').count(),4);
    assert.equal(await page.locator('.side-nav-link[aria-current="page"]').getAttribute('href'),file);
    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-menu.png')),fullPage:true});
    await page.keyboard.press('Escape');assert.equal(await page.locator('.side-nav-root.open').count(),0);
    await page.locator('[data-table]').first().click();assert.equal(await page.locator('.mz-table-wrap').first().isVisible(),true);
    await page.locator('[data-table]').first().click();
    const targets=file==='index.html'?['viabilidade','uniformidade','peso','gad']:file==='producao.html'?['producao','aproveitamento','cama','perdas','diaria']:file==='incubatorio.html'?['etaria','eclosao','incubacao','estoque']:['nao-eclodidos','infertilidade'];
    for(const id of targets){
      await settle();const normal=await stats(id);assert.equal(normal.drawn,normal.count,`${id}: rótulos aceitos devem ser desenhados`);
      await page.locator(`#card-${id}`).screenshot({path:path.join(screenshotDir,`${id}-labels-normal-light.png`)});
      await page.locator(`[data-expand="${id}"]`).click();await settle();const expanded=await stats(id);assert.equal(expanded.drawn,expanded.count,`${id}: rótulos ampliados devem ser desenhados`);
      assert.equal(expanded.series,normal.series,`${id}: expansão alterou os dados`);assert.equal(expanded.tooltip,normal.tooltip,`${id}: tooltip alterado`);
      assert.ok(expanded.count>=normal.count,`${id}: expansão reduziu rótulos`);
      if(!examplePaths.length&&id==='viabilidade'){
        assert.equal(expanded.count,44);assert.ok(expanded.count>=normal.count*1.5);assert.ok(normal.rotated>0);
        await page.setViewportSize({width:2400,height:1000});await settle();const wide=await stats(id);
        assert.equal(wide.count,44);assert.equal(wide.rotated,0,'Mais largura deve permitir orientação horizontal');assert.equal(wide.series,normal.series);
        await page.locator('#chart-viabilidade').evaluate(el=>el.style.width='600px');await settle();const container=await stats(id);
        assert.ok(container.count<wide.count,'ResizeObserver deve reagir a mudança só do container');assert.equal(container.series,normal.series);
        assert.equal(await page.locator('#chart-viabilidade').evaluate(el=>echarts.getInstanceByDom(el).getWidth()),600);
        await page.locator('#chart-viabilidade').evaluate(el=>el.style.width='');await settle();

        await page.setViewportSize({width:1440,height:1000});await settle();
      }
      if(id==='perdas'&&normal.count<normal.candidates)assert.ok(expanded.count>normal.count,'Perdas: expansão deve revelar segmentos omitidos');
      await page.locator(`#card-${id}`).screenshot({path:path.join(screenshotDir,`${id}-labels-expanded-light.png`)});
      await page.locator('[data-theme-toggle]').evaluate(el=>el.click());await settle();
      await page.locator(`#card-${id}`).screenshot({path:path.join(screenshotDir,`${id}-labels-expanded-dark.png`)});
      await page.keyboard.press('Escape');await settle();
      await page.locator(`#card-${id}`).screenshot({path:path.join(screenshotDir,`${id}-labels-normal-dark.png`)});
      await page.locator('[data-theme-toggle]').click();await settle();
      await page.setViewportSize({width:390,height:844});await settle();
      await page.locator(`#card-${id}`).screenshot({path:path.join(screenshotDir,`${id}-labels-mobile-light.png`)});
      await page.locator('[data-theme-toggle]').click();await settle();
      await page.locator(`#card-${id}`).screenshot({path:path.join(screenshotDir,`${id}-labels-mobile-dark.png`)});
      await page.locator('[data-theme-toggle]').click();await page.setViewportSize({width:1440,height:1000});await settle();
      metrics.push({id,normal,expanded});fs.writeFileSync(path.join(screenshotDir,'labels-metrics.json'),JSON.stringify(metrics,null,2));
    }
    await page.locator('[data-expand]').first().click();assert.equal(await page.locator('.mz-chart-card.expanded').count(),1);
    await page.keyboard.press('Escape');await settle();assert.equal(await page.locator('.mz-chart-card.expanded').count(),0);
    if(file==='index.html'&&!examplePaths.length){
      await page.locator('#chart-uniformidade').evaluate(el=>{
        const chart=echarts.getInstanceByDom(el),spec=chart.mzSpec;
        const points=Array.from({length:52},(_,i)=>({label:String(i),uniform:80+Math.sin(i/4)*10,uniformStd:80,cv:6+Math.cos(i/5)}));
        chart.mzPoints=points;
        chart.setOption({xAxis:{data:points.map(point=>point.label)},dataZoom:[{type:'inside',start:0,end:100}],series:MatrizesChartStyle.series(spec,points,{...{dark:false,text:'#555',grid:'#ddd',bg:'#fff',fg:'#222',series:['#7a1726','#e8913b','#95949b']}},el.clientWidth,el.clientHeight,chart)});
        chart.dispatchAction({type:'dataZoom',start:0,end:100});
      });await settle();const before=await stats('uniformidade');
      await page.locator('#chart-uniformidade').evaluate(el=>echarts.getInstanceByDom(el).dispatchAction({type:'dataZoom',startValue:10,endValue:17}));await settle();const zoom=await stats('uniformidade');
      fs.writeFileSync(path.join(screenshotDir,'zoom-debug.json'),JSON.stringify({before,zoom},null,2));assert.equal(zoom.series,before.series,'Zoom não pode alterar o array de dados');assert.ok(zoom.count/8>before.count/52*2,'Zoom deve aumentar materialmente a densidade por ponto');
      assert.ok(zoom.positions.every(item=>item.index>=10&&item.index<=17));assert.equal(zoom.drawn,zoom.count);
      await page.locator('#card-uniformidade').screenshot({path:path.join(screenshotDir,'uniformidade-labels-zoom.png')});
      await page.locator('#chart-uniformidade').evaluate(el=>echarts.getInstanceByDom(el).dispatchAction({type:'dataZoom',start:0,end:100}));await settle();const restored=await stats('uniformidade');
      assert.equal(restored.series,before.series);assert.equal(restored.count,before.count);metrics.push({id:'zoom-52-para-8',before,zoom,restored});
      await page.locator('[data-theme-toggle]').click();await page.locator('[data-theme-toggle]').click();await settle();
    }
    if(file==='index.html'){
      await page.waitForFunction(()=>echarts.getInstanceByDom(document.querySelector('.mz-chart'))?.getOption().graphic?.[0]?.elements?.some(item=>item.type==='text'&&item.z>5)).catch(()=>{throw new Error('Rotulos ausentes em '+file);});
    await page.locator('.mz-chart').first().evaluate(el=>{const chart=echarts.getInstanceByDom(el);chart.setOption({dataZoom:[{type:'inside',start:0,end:100}]});chart.dispatchAction({type:'dataZoom',start:40,end:70});});
      await page.waitForTimeout(40);
      assert.equal(await page.locator('.mz-chart').first().evaluate(el=>echarts.getInstanceByDom(el).getOption().series[0].data.length),22);
      await page.locator('.mz-chart').first().evaluate(el=>echarts.getInstanceByDom(el).dispatchAction({type:'dataZoom',start:0,end:100}));
    }

    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-desktop.png')),fullPage:true});
    await page.locator('[data-theme-toggle]').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.ok(await page.locator('.mz-chart').first().evaluate(el=>echarts.getInstanceByDom(el).getZr().storage.getDisplayList().some(item=>item.z>=100&&item.type==='tspan'&&item.style.opacity!==0)),'Rotulos visiveis apos mudar tema');
    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-desktop-dark.png')),fullPage:true});
    await page.locator('[data-theme-toggle]').click();

    if(file==='producao.html') {
      await page.locator('#chart-aproveitamento').evaluate(el=>{
        const option=echarts.getInstanceByDom(el).getOption();
        if(option.series[0].data.some(value=>value!=null&&value!==70)||option.series[1].data.some(value=>value!=null&&value!==30))throw new Error('Proporcao visual incorreta');
        const text=option.tooltip[0].formatter([{seriesIndex:0,dataIndex:0,marker:''},{seriesIndex:1,dataIndex:0,marker:''}]);
        if(!text.includes('Aproveitamento (%)')||text.includes('Aproveitamento (%): 70'))throw new Error('Tooltip deve preservar percentual real');
      });
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
        const scrollAfter=await page.locator('.mz-filters').evaluate(el=>({top:el.scrollTop,max:el.scrollHeight-el.clientHeight}));
        assert.ok(Math.abs(scrollAfter.top-Math.min(position,scrollAfter.max))<2,'Posição dos filtros preservada dentro da nova altura');
      }
      await page.locator('[data-theme-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
      await page.screenshot({path:path.join(screenshotDir,'producao-dark.png'),fullPage:true});
      await page.locator('[data-theme-toggle]').click();
    }
    // Regressão: altura intrínseca dos filtros deve empurrar o relatório para baixo.
    const checkMobileFlow=async()=>{
      const boxes=await page.evaluate(()=>{
        const rect=selector=>{const {top,bottom,left,right,height}=document.querySelector(selector).getBoundingClientRect();return {top,bottom,left,right,height};};
        return {filters:rect('.mz-filters'),main:rect('.mz-main'),fields:rect('#filterFields'),header:rect('.mz-topbar'),layout:rect('.mz-layout'),
          clipped:[...document.querySelectorAll('.mz-topbar strong,.mz-topbar button,.mz-breadcrumb')].some(el=>{const r=el.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}),
          filterScroll:document.querySelector('.mz-filters').scrollHeight>document.querySelector('.mz-filters').clientHeight+1};
      });
      assert.ok(boxes.main.top>=boxes.filters.bottom+15,`${file}: relatório sobreposto aos filtros`);
      assert.ok(boxes.fields.bottom<=boxes.filters.bottom,`${file}: campos saíram do painel de filtros`);
      assert.ok(boxes.layout.top>=boxes.header.bottom-1,`${file}: conteúdo sob o cabeçalho`);
      assert.equal(boxes.clipped,false,`${file}: cabeçalho fora da tela`);
      assert.equal(boxes.filterScroll,false,`${file}: painel mobile com rolagem interna`);
    };
    for(const [width,height] of [[320,640],[360,740],[390,844],[430,932],[768,1024],[844,390]]){
      await page.setViewportSize({width,height});await settle();
      await page.locator('.mz-layout').evaluate(el=>el.scrollTop=0);await checkMobileFlow();
    }
    await page.setViewportSize({width:390,height:844});await settle();
    await page.locator('.mz-layout').evaluate(el=>el.scrollTop=0);
    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-mobile-filters-top.png'))});
    await page.locator('[data-filter-choice="farm"] summary').click();await checkMobileFlow();
    await page.locator('[data-filter="farm"]').first().check();await settle();await checkMobileFlow();
    await page.locator('#clearFilters').click();await settle();const mobileBefore=await page.locator('#recordCount').textContent();
    await page.locator('[data-month="1"]').click();await settle();assert.match(await page.locator('#recordCount').textContent(),/^0 de /);await checkMobileFlow();
    await page.locator('#clearFilters').click();await settle();assert.equal(await page.locator('#recordCount').textContent(),mobileBefore);await checkMobileFlow();
    await page.locator('.mz-heading').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-mobile-report-below.png'))});
    const mobileScroll=await page.locator('.mz-layout').evaluate(el=>el.scrollTop);
    await page.locator('.side-nav-rail').click();await page.locator('.side-nav-close').click();
    assert.ok(Math.abs(await page.locator('.mz-layout').evaluate(el=>el.scrollTop)-mobileScroll)<2,'Menu preserva rolagem mobile');
    await page.locator('[data-expand]').first().click();await settle();
    assert.equal(await page.locator('.mz-chart-card.expanded').count(),1);await page.keyboard.press('Escape');await settle();await checkMobileFlow();
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
    await page.waitForTimeout(180);
    await page.locator('.mz-chart-card').first().screenshot({path:path.join(screenshotDir,file.replace('.html','-chart-mobile-light.png'))});
    await page.locator('[data-theme-toggle]').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.screenshot({path:path.join(screenshotDir,file.replace('.html','-mobile-dark.png')),fullPage:true});
    await page.locator('.mz-chart-card').first().screenshot({path:path.join(screenshotDir,file.replace('.html','-chart-mobile-dark.png'))});
    await page.locator('[data-theme-toggle]').click();
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
  assert.deepEqual(errors,[],'Erros JavaScript no navegador');assert.deepEqual(warnings,[],'Warnings novos no navegador');
  const embeddedPage=await context.newPage();
  await embeddedPage.goto(`${base}/index.html`);
  await embeddedPage.locator("#loadStatus").filter({hasText:"completo"}).waitFor();
  await embeddedPage.setContent(`<div style="position:fixed;inset:20px;display:flex;flex-direction:column;overflow:hidden"><div style="height:36px;flex-shrink:0">CENTRAL</div><iframe src="${base}/producao.html" style="border:0;flex:1;width:100%;min-height:0"></iframe></div>`);
  const report=embeddedPage.frameLocator('iframe');
  await report.locator('#loadStatus').filter({hasText:'completo'}).waitFor({timeout:30000});
  await report.locator('.mz-topbar').evaluate(el=>el.ownerDocument.querySelector('.mz-layout').scrollTop=900);
  assert.equal(await report.locator('.mz-topbar').evaluate(el=>el.getBoundingClientRect().top),0,'Cabe?alho deve permanecer fixo dentro da CENTRAL');
  await embeddedPage.setViewportSize({width:390,height:844});
  for(const file of files){
    await embeddedPage.locator('iframe').evaluate((el,url)=>{el.src=url;},`${base}/${file}`);
    await report.locator('#loadStatus').filter({hasText:'completo'}).waitFor({timeout:30000});
    const checkFrameFlow=async()=>{
      const flow=await report.locator('.mz-main').evaluate(el=>{
        const doc=el.ownerDocument,f=doc.querySelector('.mz-filters').getBoundingClientRect(),m=el.getBoundingClientRect();
        return {filtersBottom:f.bottom,mainTop:m.top,overflow:doc.documentElement.scrollWidth>doc.defaultView.innerWidth};
      });
      assert.ok(flow.mainTop>=flow.filtersBottom+15,`${file}: sobreposição dentro da CENTRAL mobile`);assert.equal(flow.overflow,false);
    };
    await checkFrameFlow();
    await report.locator('[data-filter-choice="farm"] summary').click();await checkFrameFlow();
    await report.locator('.mz-layout').evaluate(el=>el.scrollTop=0);
    await embeddedPage.screenshot({path:path.join(screenshotDir,file.replace('.html','-central-mobile-filters.png'))});
    await report.locator('.mz-heading').scrollIntoViewIfNeeded();await checkFrameFlow();
    assert.equal(await report.locator('.mz-topbar').evaluate(el=>el.getBoundingClientRect().top),0);
    await embeddedPage.screenshot({path:path.join(screenshotDir,file.replace('.html','-central-mobile-report.png'))});
  }
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
  fs.writeFileSync(path.join(screenshotDir,'labels-metrics.json'),JSON.stringify(metrics,null,2));
  if(filtersOnly)console.log('PASS: filtros das quatro telas; selecionar/desmarcar tudo, parcial, pesquisa visível, sticky, abertura vinculada, teclado, limpeza fixa e responsividade sem warnings');
  console.log(`PASS: 4 telas desktop/mobile, menu lateral e navegação, tema, filtros, dados, ampliação, 6 tabelas com todas as páginas, sessão ausente e paginação incompleta. ${examplePaths.length?'Exemplos reais dos anexos.':'Dados sintéticos.'}`);
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}


