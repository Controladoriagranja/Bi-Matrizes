const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),fixtures={granja:[],acerto_produtor_producao:[],acerto_produtor_recria:[],eclosao:[],incubacao:[],embrio:[],metas:[]};
for(let i=0;i<95;i++)for(let lot=0;lot<2;lot++){
 const date=new Date(Date.UTC(2026,6,i+1)).toISOString().slice(0,10),id=i*2+lot+1;
 const common={id,data:date,lote:lot?'B':'A',granja:'FAZENDA TESTE',galpao:'01',linhagem:lot?'HUBBARD':'COBB',idade:lot?52:30,empresa_codigo:'2',unidade_codigo:'1',carregado_em:'2026-10-03T10:00:00'};
 const weight=lot?900:100,eggs=weight*(0.5+(i%7)/20);
 fixtures.granja.push({...common,saldo_femeas:weight,ovos_produzidos:eggs,prod_std_pct:70+lot,incubaveis_granja:eggs*.97,aprov_std_pct:98,cama:eggs*.02,cama_std_pct:80,trincado:1,vazado:2,sujo:1,duas_gemas:1,deformado:1,pequeno:1});
 fixtures.acerto_produtor_producao.push({...common,ini_semana:date,cab_lote:common.lote,cab_granja:common.granja,saldo_femea:weight,producao:70,producao_std:68,tipo_movto:'Diário'});
 fixtures.eclosao.push({...common,eclosao:date,quantid:weight,nascidos:weight*.8,descarte:weight*.01,eclosao_std:85});
 fixtures.incubacao.push({...common,data_incubacao:date,quantidade:weight,dias_estoque:lot?'04-':'02-'});
 fixtures.embrio.push({...common,incubados:weight,nascidos:weight*.8,nao_eclodidos:weight*.2,total_analisado:weight,qtde:5,std:4,qtde_2:3,std_2:4,qtde_3:1,std_3:.5,qtde_4:5,std_4:4,qtde_7:1,qtde_8:1,qtde_9:1,qtde_10:0,std_9:.75,std_10:0});
}
for(const m of [7,8,9,10])fixtures.metas.push({id:m,indicador_codigo:'ovos_cama',referencia_mes:`2026-${String(m).padStart(2,'0')}-01`,valor_meta:m,ativo:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'404':data);});});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addInitScript(()=>sessionStorage.setItem('granjabi_auth_token','teste-isolado'));
 await context.route('https://api-bi-granja.controladoriagb05.workers.dev/**',async route=>{
  const url=new URL(route.request().url()),table=url.pathname.split('/').at(-1),rows=fixtures[table];
  assert.ok(rows,table);const size=Number(url.searchParams.get('tamanho')),page=Number(url.searchParams.get('pagina'));
  await route.fulfill({json:{tabela:table,pagina:page,tamanho:size,total:rows.length,total_paginas:Math.max(1,Math.ceil(rows.length/size)),dados:rows.slice((page-1)*size,page*size)}});
 });
 const page=await context.newPage(),errors=[],tested=[];page.on('pageerror',e=>errors.push(e.message));
 const out=path.join(root,'artifacts','drill');fs.mkdirSync(out,{recursive:true});
 const settle=()=>page.waitForTimeout(100);
 const chartData=id=>page.locator('#chart-'+id).evaluate(el=>{const c=echarts.getInstanceByDom(el),o=c.getOption();return {points:c.mzPoints,series:o.series.map(s=>({type:s.type,name:s.name,data:s.data,axis:s.yAxisIndex,color:s.itemStyle.color,stack:s.stack,line:s.lineStyle})),axis:c.mzSpec.axis,axes:o.yAxis.length};});
 try{
  for(const file of ['producao.html','incubatorio.html','embrio.html']){
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+file);await page.locator('#loadStatus').filter({hasText:'completo'}).waitFor();
   for(const [id,value] of [['startDate','2026-07-01'],['endDate','2026-10-03']]){await page.locator('#'+id).fill(value);await page.locator('#'+id).dispatchEvent('change');}
   await page.evaluate(data=>window.__testFixtures=data,fixtures);await settle();
   const ids=await page.locator('.mz-chart-card:has(.mz-period-flags)').evaluateAll(cards=>cards.map(c=>c.id.slice(5)));
   assert.equal(ids.length,file==='producao.html'?4:file==='incubatorio.html'?5:7);
   for(const id of ids){
    const weekly=await chartData(id);assert.equal(weekly.points.length,8);
    const card=page.locator('#card-'+id),flags=card.locator('.mz-period-flags');
    assert.ok(await flags.locator('input[value=semana]').isChecked());
    await page.locator('#chart-'+id).evaluate(el=>{echarts.getInstanceByDom(el).trigger('click',{componentType:'series',dataIndex:0});});await settle();
    const drilled=await chartData(id);assert.ok(drilled.points.length>0&&drilled.points.length<=7);
    assert.ok(drilled.points.every(p=>p.filterKey==='date'));assert.ok(await flags.locator('input[value=dia]').isChecked());
    assert.deepEqual(drilled.series.map(({data,...s})=>s),weekly.series.map(({data,...s})=>s),'Séries/cores/eixos preservados: '+id);
    assert.equal(drilled.axes,weekly.axes);
    await card.locator('[data-table]').click();assert.equal(await card.locator('tbody tr').count(),drilled.points.length);
    assert.equal(await card.locator('thead th').first().textContent(),'Dia');await card.locator('[data-table]').click();
    await card.locator('.mz-drill-back').click();assert.deepEqual((await chartData(id)).points,weekly.points);
    await flags.locator('input[value=dia]').check();const daily=await chartData(id);assert.ok(daily.points.length>8);
    const bad=await page.locator('#chart-'+id).evaluate(el=>{
     const c=echarts.getInstanceByDom(el),D=MatrizesData,spec=c.mzSpec,p=MatrizesPages[document.body.dataset.page];
     const raw=__testFixtures[spec.source==='extra'?p.extraTable:p.table],all=D.prepare(spec.source==='extra'?p.extraTable:p.table,raw);
     for(const point of c.mzPoints){const rows=all.filter(r=>r.date===point.filterValue),calc=D[spec.calc||p.calc](rows);
      const result={...calc,discardTarget:MATRIZES_SETTINGS.discardTarget,incubationTarget:MATRIZES_SETTINGS.incubationTarget};
      if(spec.id==='cama')result.bedStd=D.monthlyTarget(__testFixtures.metas,'ovos_cama',point.filterValue);
      for(const series of spec.series){const a=point[series.key],b=result[series.key];if(a!==b&&!(a==null&&b==null)&&Math.abs(a-b)>1e-8)return {key:series.key,a,b};}
     }return null;
    });assert.equal(bad,null,'Cálculo diário: '+id);
    await card.locator('[data-expand]').click();await settle();assert.deepEqual((await chartData(id)).points,daily.points);await page.keyboard.press('Escape');
    await flags.locator('input[value=semana]').check();assert.deepEqual((await chartData(id)).points,weekly.points);tested.push(id);
   }
   await page.locator('#toggleWeeks').click();
   const id=ids[0],card=page.locator('#card-'+id);const allWeeks=await chartData(id);assert.ok(allWeeks.points.length>8);
   await card.locator('input[value=dia]').check();assert.equal((await chartData(id)).points.length,95);
   await page.locator('#toggleWeeks').click();assert.ok((await chartData(id)).points.length<95);
   // O clique no eixo também abre e retorna; filtros preservam ou invalidam o drill.
   await card.locator('input[value=semana]').check();
   await page.locator('#chart-'+id).evaluate(el=>{const c=echarts.getInstanceByDom(el);c.trigger('click',{componentType:'xAxis',value:c.mzPoints[0].label});});
   assert.equal((await chartData(id)).axis,'Dia');
   await page.locator('#chart-'+id).evaluate(el=>{const c=echarts.getInstanceByDom(el);c.trigger('click',{componentType:'xAxis',value:c.mzPoints[0].label});});
   assert.notEqual((await chartData(id)).axis,'Dia');
   for(const width of [1440,768,390,320]){
    await page.setViewportSize({width,height:900});await card.locator('input[value=dia]').check();await settle();
    const geometry=await card.evaluate(el=>{const a=el.querySelector('.mz-chart-actions').getBoundingClientRect(),t=el.querySelector('h2').getBoundingClientRect();return {overlap:a.left<t.right&&a.right>t.left&&a.top<t.bottom&&a.bottom>t.top,card:el.getBoundingClientRect().width,action:a.width};});
    assert.equal(geometry.overlap,false);assert.ok(geometry.action<=geometry.card);
    await card.screenshot({path:path.join(out,file.replace('.html','')+'-'+width+'-dia.png')});
   }
   await page.locator('[data-theme-toggle]').click();await card.screenshot({path:path.join(out,file.replace('.html','')+'-dark.png')});
   // filtro global continua selecionado e elimina datas fora do período.
   await page.locator('#startDate').fill('2026-09-30');await page.locator('#startDate').dispatchEvent('change');
   assert.ok((await chartData(id)).points.every(p=>p.filterValue>='2026-09-30'));
   await page.locator('[data-filter-choice="lineage"] summary').click();
   await page.locator('[data-filter="lineage"][value="COBB"]').check();
   assert.ok(await page.locator('[data-filter="lineage"][value="COBB"]').isChecked());
   assert.equal(await page.locator('[data-filter="lot"][value="B"]').count(),0,'Filtro global mantém cascata com drill');
   await page.locator('[data-filter-choice="lineage"] summary').click();
   await page.locator('[data-filter-choice="lot"] summary').click();await page.locator('[data-filter="lot"][value="A"]').check();
   assert.ok((await chartData(id)).points.length>0);
   assert.ok(await card.locator('input[value=dia]').isChecked());
   await page.locator('[data-filter-choice="lot"] summary').click();
   await page.setViewportSize({width:1440,height:1000});
  }
  assert.equal(tested.length,16);assert.deepEqual(errors,[]);
  console.log('PASS: 16 gráficos; toggle, drill barra/eixo, retorno, fórmulas diárias, Dados, expansão, 8/todas semanas, período e 4 larguras.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
