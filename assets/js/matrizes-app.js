(() => {
  'use strict';
  const D=window.MatrizesData, pages=window.MatrizesPages, settings=window.MATRIZES_SETTINGS;
  const pageId=document.body.dataset.page, page=pages[pageId];
  if (!page) return;
  const $=id=>document.getElementById(id);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const filterLabels={year:'Ano',week:'Semana',farm:'Fazenda',lot:'Lote',house:'Galpão',lineage:'Linhagem',age:'Idade (semanas)',origin:'Origem',stage:'Estágio da incubadora',status:'Situação atual'};
  const state={rows:[],extra:[],charts:new Map(),filters:{},sex:'femeas',start:'',end:'',loaded:false,controller:null,gad:new Map(),hasSavedFilters:false};
  const storageKey=`bi-matrizes-filtros-${page.module}`;
  try {
    const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');
    if(saved) {
      state.hasSavedFilters=true;
      state.sex=saved.sex==='machos'?'machos':'femeas'; state.start=saved.start||''; state.end=saved.end||'';
      Object.entries(saved.filters||{}).forEach(([key,values])=>{if(Array.isArray(values))state.filters[key]=new Set(values.map(String));});
    }
  } catch (_) { /* A sessão pode impedir armazenamento. */ }
  const selected=key=>state.filters[key]||(state.filters[key]=new Set());
  function saveFilters() {
    state.hasSavedFilters=true;
    try {sessionStorage.setItem(storageKey,JSON.stringify({sex:state.sex,start:state.start,end:state.end,filters:Object.fromEntries(Object.entries(state.filters).map(([k,v])=>[k,[...v]]))}));} catch (_) {}
  }
  function format(value,unit='%',digits=2) {
    if(value==null||!Number.isFinite(Number(value)))return '—';
    const precision=unit==='ovos'?0:digits;
    return Number(value).toLocaleString('pt-BR',{minimumFractionDigits:precision,maximumFractionDigits:precision})+(unit==='%'?'%':unit?` ${unit}`:'');
  }
  function dayLabel(value) {
    const d=D.date(value);
    return d?d.toLocaleDateString('pt-BR',{timeZone:'UTC'}):value;
  }
  function groupLabel(value,key) {
    if(key==='date')return dayLabel(value);
    if(key==='monthPeriod')return `${months[Number(String(value).slice(5,7))-1]}/${String(value).slice(0,4)}`;
    if(key==='week')return String(value).replace('-S',' · S');
    return String(value);
  }
  function calc(rows,kind=page.calc) {
    let result=kind==='recria'?D.recria(rows,state.sex,state.gad):D[kind](rows);
    return {...result,discardTarget:settings.discardTarget,incubationTarget:settings.incubationTarget};
  }
  function sexRows(rows) {
    if(page.calc!=='recria')return rows;
    const fields=D.recriaFields(state.sex);
    return rows.filter(row=>D.n(row.raw[fields.housed])>0);
  }
  function matches(row,skip,allPeriods=false) {
    for(const [key,values] of Object.entries(state.filters)) {
      if(key===skip||skip?.has?.(key)||!values.size||allPeriods&&['year','month','week'].includes(key))continue;
      if(!values.has(String(row[key]??'')))return false;
    }
    return allPeriods||(!state.start||row.date>=state.start)&&(!state.end||row.date<=state.end);
  }
  const unavailableFilters=rows=>new Set(page.filters.filter(key=>key!=='sex'&&!rows.some(row=>row[key]!==''&&row[key]!=null)));
  const filtered=(rows,extra=false,allPeriods=false)=>sexRows(rows).filter(row=>matches(row,extra?unavailableFilters(rows):null,allPeriods));
  const groupValue=(row,key)=>key==='monthPeriod'?row.date.slice(0,7):row[key];
  function points(rows,spec) {
    const key=spec.group||page.group;
    return D.group(rows,r=>groupValue(r,key)).map(([value,items])=>({label:groupLabel(value,key),...calc(items,spec.calc||page.calc)}));
  }
  function renderShell() {
    $('matrizesApp').innerHTML=`
      <header class="mz-topbar">
        <div class="mz-breadcrumb"><span>Matrizes</span><span aria-hidden="true">/</span><strong>${page.module}</strong></div>
        <div class="mz-top-actions"><div class="mz-update">Última carga<strong id="ultimaAtualizacao">—</strong></div><button class="mz-button" data-theme-toggle aria-label="Alternar tema" title="Alternar tema"><span data-theme-icon>☾</span></button></div>
      </header>
      <div class="mz-layout">
        <aside class="mz-filters" aria-label="Filtros dos indicadores"><div class="mz-filters-head"><h2>Filtros</h2><button id="toggleFilters" class="mz-button mz-filter-toggle" aria-expanded="false" aria-controls="filterFields">Mostrar</button></div><div class="mz-filter-fields hidden-mobile" id="filterFields"></div></aside>
        <main class="mz-main ${pageId==='embrio'?'mz-embryo':''}">
          <div class="mz-heading"><div><div class="mz-eyebrow">Matrizes e incubatório</div><h1>${page.title}</h1><p>${page.subtitle}</p></div><button id="refresh" class="mz-button">↻ Atualizar</button></div>
          <div class="mz-status" role="status" aria-live="polite"><strong id="loadStatus">Aguardando consulta</strong><span id="recordCount">—</span></div>
          <div id="error" class="mz-notice mz-error hidden" role="alert"></div>
          <div id="notice" class="mz-notice hidden"></div>
          <section class="mz-kpis" id="kpis" aria-label="Indicadores do período"></section>
          <section class="mz-charts" aria-label="Gráficos">${page.charts.map((spec,index)=>`${spec.section&&spec.section!==page.charts[index-1]?.section?`<h2 class="mz-section-title">${spec.section}</h2>`:''}
            <article class="mz-chart-card ${spec.wide?'wide':''}" id="card-${spec.id}"><div class="mz-chart-head"><div><h2>${spec.title}</h2><p id="caption-${spec.id}">${spec.axis} · ${spec.unit||'Percentual'}</p></div><div class="mz-chart-actions"><button type="button" data-table="${spec.id}" aria-expanded="false" aria-controls="table-${spec.id}">Dados</button><button type="button" data-expand="${spec.id}" aria-label="Ampliar ${spec.title}" aria-expanded="false">⤢</button></div></div><div id="chart-${spec.id}" class="mz-chart" role="img" aria-label="${spec.title}. Os valores estão disponíveis no botão Dados."></div><div id="table-${spec.id}" class="mz-table-wrap hidden"></div></article>`).join('')}</section>
          ${page.extraTable==='incubacao'?'<section class="mz-receipts"><button id="receiptsButton" class="mz-button" aria-expanded="false" aria-controls="receiptsPanel">Ovos enviados pela granja e recebidos no incubatório</button><div id="receiptsPanel" class="mz-comparison hidden"></div></section>':''}
          <footer class="mz-footer"><span id="periodCaption">Selecione o contexto nos filtros.</span><a href="docs/INDICADORES_MATRIZES.md" target="_blank" rel="noopener">Regras dos indicadores</a></footer>
        </main>
      </div>`;
    if(window.ThemeManager)document.querySelector('[data-theme-icon]').textContent=ThemeManager.get()==='dark'?'☀':'☾';
    $('refresh').addEventListener('click',load);
    $('toggleFilters').addEventListener('click',()=>{
      const collapsed=$('filterFields').classList.toggle('hidden-mobile');
      $('toggleFilters').setAttribute('aria-expanded',String(!collapsed));
      $('toggleFilters').textContent=collapsed?'Mostrar':'Ocultar';
    });
    document.querySelectorAll('[data-table]').forEach(button=>button.addEventListener('click',()=>{
      const hidden=$(`table-${button.dataset.table}`).classList.toggle('hidden');button.setAttribute('aria-expanded',String(!hidden));
    }));
    document.querySelectorAll('[data-expand]').forEach(button=>button.addEventListener('click',()=>expand(button.dataset.expand)));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeExpanded();});
    window.addEventListener('resize',()=>state.charts.forEach(chart=>chart.resize()));
    document.addEventListener('dashboard:theme-changed',()=>renderCharts());
    $('receiptsButton')?.addEventListener('click',receipts);
  }
  function closeExpanded() {
    document.querySelectorAll('.mz-chart-card.expanded').forEach(card=>{
      card.classList.remove('expanded');const button=card.querySelector('[data-expand]');
      button.textContent='⤢';button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',`Ampliar ${card.querySelector('h2').textContent}`);button.focus();
    });
    document.body.classList.remove('mz-expanded');state.charts.forEach(chart=>chart.resize());
  }
  function expand(id) {
    const card=$(`card-${id}`),wasOpen=card.classList.contains('expanded');closeExpanded();
    if(!wasOpen){card.classList.add('expanded');document.body.classList.add('mz-expanded');const button=card.querySelector('[data-expand]');button.textContent='×';button.setAttribute('aria-expanded','true');button.setAttribute('aria-label','Fechar gráfico ampliado');state.charts.get(id)?.resize();}
  }
  function filterChoice(key,rows) {
    const values=[...new Set(rows.map(r=>String(r[key]??'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
    if(!values.length&&['stage','origin','status','house','lineage'].includes(key))return '';
    const sel=selected(key),label=filterLabels[key];
    // Keep a selected option visible even when another filter excludes its data.
    const allValues=[...new Set([...values,...sel])];
    const display=v=>key==='week'?groupLabel(v,'week'):v;
    return `<div class="mz-filter"><span id="label-${key}">${label}</span><details class="mz-choice" data-filter-choice="${key}"><summary aria-labelledby="label-${key}">${sel.size?`${sel.size} selecionado(s)`:'Todos'}</summary><div class="mz-options">${['lot','farm'].includes(key)?`<input class="mz-search" data-search="${key}" type="search" placeholder="Pesquisar ${label.toLowerCase()}" aria-label="Pesquisar ${label.toLowerCase()}">`:''}${allValues.length?allValues.map(value=>`<label><input type="checkbox" data-filter="${key}" value="${escape(value)}" ${sel.has(value)?'checked':''}><span>${escape(display(value))}</span></label>`).join(''):'<p class="mz-unavailable">Sem opções</p>'}</div></details></div>`;
  }
  function renderFilters() {
    const open=new Set([...document.querySelectorAll('[data-filter-choice][open]')].map(el=>el.dataset.filterChoice));
    const rows=sexRows([...state.rows,...state.extra]);
    $('filterFields').innerHTML=filterChoice('year',rows)+`
      <div class="mz-filter"><span>Meses</span><div class="mz-months">${months.map((label,i)=>`<button type="button" data-month="${i+1}" class="${selected('month').has(String(i+1))?'active':''}" aria-pressed="${selected('month').has(String(i+1))}">${label}</button>`).join('')}</div></div>`+
      filterChoice('week',rows)+page.filters.map(key=>key==='sex'?`
        <div class="mz-filter"><span>Sexo</span><div class="mz-sex">${[['femeas','Fêmeas'],['machos','Machos']].map(([value,label])=>`<button type="button" data-sex="${value}" class="${state.sex===value?'active':''}" aria-pressed="${state.sex===value}">${label}</button>`).join('')}</div></div>`:filterChoice(key,rows)).join('')+`
      <div class="mz-filter"><label for="startDate">Data inicial</label><input id="startDate" type="date" value="${escape(state.start)}" ${state.end?`max="${escape(state.end)}"`:''}></div>
      <div class="mz-filter"><label for="endDate">Data final</label><input id="endDate" type="date" value="${escape(state.end)}" ${state.start?`min="${escape(state.start)}"`:''}></div>
      <div class="mz-filter"><button id="clearFilters" class="mz-clear">Limpar filtros</button></div>`;
    document.querySelectorAll('[data-filter-choice]').forEach(el=>{el.open=open.has(el.dataset.filterChoice);});
    document.querySelectorAll('[data-filter]').forEach(input=>input.addEventListener('change',()=>{
      const set=selected(input.dataset.filter);input.checked?set.add(input.value):set.delete(input.value);saveFilters();render();
    }));
    document.querySelectorAll('[data-month]').forEach(button=>button.addEventListener('click',()=>{
      const set=selected('month');set.has(button.dataset.month)?set.delete(button.dataset.month):set.add(button.dataset.month);saveFilters();render();
    }));
    document.querySelectorAll('[data-sex]').forEach(button=>button.addEventListener('click',()=>{state.sex=button.dataset.sex;saveFilters();render();}));
    document.querySelectorAll('[data-search]').forEach(input=>input.addEventListener('input',()=>{
      const term=input.value.toLocaleLowerCase('pt-BR');input.parentElement.querySelectorAll('label').forEach(label=>label.hidden=!label.textContent.toLocaleLowerCase('pt-BR').includes(term));
    }));
    $('startDate').addEventListener('change',()=>{state.start=$('startDate').value;saveFilters();render();});
    $('endDate').addEventListener('change',()=>{state.end=$('endDate').value;saveFilters();render();});
    $('clearFilters').addEventListener('click',()=>{state.filters={};state.start='';state.end='';saveFilters();render();});
  }
  function renderKpis(rows) {
    let data,context='Consolidado do período';
    if(page.calc==='recria') {
      const latest=[...D.group(rows,r=>r.age)].pop();
      data=calc(latest?.[1]||[]);context=latest?`Semana de vida ${latest[0]}`:'Sem registros';
    } else data=calc(rows);
    $('kpis').innerHTML=page.kpis.map(([key,label,unit])=>`<article class="mz-kpi"><span>${label}</span><strong>${format(data[key],unit,unit==='g'?0:2)}</strong><small>${data[key]==null?'Sem medição disponível':context}</small></article>`).join('');
  }
  function colors() {
    const css=getComputedStyle(document.documentElement);
    return {text:css.getPropertyValue('--muted-foreground').trim(),grid:css.getPropertyValue('--border').trim(),bg:css.getPropertyValue('--card').trim(),fg:css.getPropertyValue('--foreground').trim(),series:[css.getPropertyValue('--primary').trim(),'#e8913b','#95949b','#6d9975','#c3a548','#7895b6']};
  }
  function renderChart(spec,data) {
    if(!window.echarts)throw new Error('Não foi possível carregar a biblioteca de gráficos.');
    const c=colors(),unit=spec.unit||'%',hasData=data.some(p=>spec.series.some(s=>p[s.key]!=null));
    const hasSecond=spec.series.some(s=>s.axis===1);
    let chart=state.charts.get(spec.id);
    if(!chart){chart=echarts.init($(`chart-${spec.id}`));state.charts.set(spec.id,chart);}
    const series=spec.series.map((s,i)=>({
      name:s.name,type:s.type,data:data.map(p=>p[s.key]??null),yAxisIndex:s.axis||0,
      stack:s.stack,connectNulls:false,symbolSize:4,showSymbol:data.length<24,
      barMaxWidth:24,itemStyle:{color:c.series[s.color??i%c.series.length],borderRadius:s.stack?0:[3,3,0,0]},
      lineStyle:{width:2,type:s.dash?'dashed':'solid'},
      emphasis:{focus:'series'},labelLayout:{hideOverlap:true},label:{show:s.type==='bar'&&data.length<=8,position:s.stack?'inside':'top',fontSize:9,formatter:p=>p.value==null?'':Number(p.value).toLocaleString('pt-BR',{maximumFractionDigits:1})}
    }));
    const axis={type:'value',axisLine:{show:false},axisTick:{show:false},axisLabel:{fontSize:9,color:c.text,formatter:v=>format(v,unit,unit==='ovos'||unit==='g'?0:1)},splitLine:{lineStyle:{color:c.grid}}};
    chart.setOption({
      animationDuration:250,color:c.series,textStyle:{fontFamily:'Geist Variable, Geist, sans-serif',color:c.text},
      tooltip:{trigger:'axis',backgroundColor:c.bg,borderColor:c.grid,textStyle:{color:c.fg,fontSize:11},valueFormatter:(value)=>value==null?'Sem medição':Number(value).toLocaleString('pt-BR',{maximumFractionDigits:2})},
      legend:{bottom:0,type:'scroll',textStyle:{color:c.text,fontSize:9},itemWidth:13,itemHeight:7},
      grid:{top:28,left:12,right:hasSecond?12:18,bottom:data.length>24?66:38,containLabel:true},
      xAxis:{type:'category',data:data.map(p=>p.label),axisLine:{lineStyle:{color:c.grid}},axisTick:{show:false},axisLabel:{fontSize:9,color:c.text,hideOverlap:true}},
      yAxis:hasSecond?[axis,{...axis,position:'right',splitLine:{show:false},axisLabel:{...axis.axisLabel,formatter:v=>format(v,spec.series.find(s=>s.axis===1).unit||'pp',1)}}]:axis,
      dataZoom:data.length>24?[{type:'inside',start:0,end:100},{type:'slider',height:13,bottom:22,borderColor:c.grid,textStyle:{color:c.text,fontSize:8}}]:[],
      graphic:hasData?[]:[{type:'text',left:'center',top:'middle',style:{text:state.loaded?'Sem dados para os filtros selecionados':'Aguardando dados da API',font:'12px "Geist Variable", sans-serif',fill:c.text}}],
      series
    },true);
    $(`chart-${spec.id}`).setAttribute('aria-label',`${spec.title}. ${data.length} períodos. ${hasData?'Consulte os valores no botão Dados.':'Sem dados disponíveis.'}`);
    $(`table-${spec.id}`).innerHTML=`<table class="mz-data-table"><caption class="hidden">${spec.title}</caption><thead><tr><th scope="col">${spec.axis}</th>${spec.series.map(s=>`<th scope="col">${escape(s.name)} (${s.unit||unit})</th>`).join('')}</tr></thead><tbody>${data.length?data.map(p=>`<tr><th scope="row">${escape(p.label)}</th>${spec.series.map(s=>`<td>${format(p[s.key],s.unit||unit)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${spec.series.length+1}">Sem dados</td></tr>`}</tbody></table>`;
    if(spec.id==='descarte'||spec.id==='descarte-mes')$(`caption-${spec.id}`).textContent=`${spec.axis} · %${settings.discardTarget==null?' · Meta não configurada':''}`;
    if(spec.id==='incubacao')$(`caption-${spec.id}`).textContent=`${spec.axis} · ovos${settings.incubationTarget==null?' · Meta não configurada':''}`;
  }
  function renderCharts() {
    page.charts.forEach(spec=>{
      const rows=filtered(spec.source==='extra'?state.extra:state.rows,spec.source==='extra',spec.allPeriods);
      renderChart(spec,points(rows,spec));
      if(spec.allPeriods)$(`caption-${spec.id}`).textContent=`${spec.axis} · Histórico completo, independente do período selecionado`;
      if(spec.source==='extra'){
        const ignored=[...unavailableFilters(state.extra)].filter(key=>selected(key).size).map(key=>filterLabels[key]);
        if(ignored.length)$(`caption-${spec.id}`).textContent+=` · ${ignored.join(' / ')} indisponível nesta fonte`;
      }
    });
  }
  function render() {
    const rows=filtered(state.rows);
    state.gad=D.withGad(sexRows(state.rows),state.sex);
    renderFilters();renderKpis(rows);renderCharts();
    $('recordCount').textContent=state.loaded?`${rows.length.toLocaleString('pt-BR')} de ${state.rows.length.toLocaleString('pt-BR')} registros${page.extraTable?` · ${filtered(state.extra,true).length.toLocaleString('pt-BR')} registros ${page.extraTable==='incubacao'?'de incubação':'da curva'}`:''}`:'—';
    const dates=rows.map(r=>r.date).sort();
    $('periodCaption').textContent=dates.length?`Período: ${dayLabel(dates[0])} a ${dayLabel(dates.at(-1))}. Percentuais calculados pelas quantidades do período.`:'Sem registros no contexto selecionado.';
    const messages=[];
    if(state.loaded&&page.extraTable==='incubacao'&&filtered(state.extra,true).some(r=>D.stockDays(r.raw.dias_estoque).length!==1))messages.push('Estoque médio indisponível nos períodos com várias idades de ovos na mesma linha. O mínimo e o máximo usam as idades informadas; a média exige a quantidade de ovos de cada idade.');
    if(state.loaded&&page.extraTable==='acerto_produtor_producao')messages.push('A curva por lote usa o histórico do Acerto do Produtor; o gráfico diário usa os registros de produção da granja. Selecione um lote para acompanhar sua curva individual.');
    $('notice').textContent=messages.join(' ');$('notice').classList.toggle('hidden',!messages.length);
    // Additional receipts data is always refreshed against the current filters.
    if(receiptState.loaded&&!$('receiptsPanel')?.classList.contains('hidden'))renderReceipts();
  }
  async function loadTable(table,signal,onProgress) {
    const endpoint=(APP_CONFIG.endpoints.matrizesDados||'/api/portal/matrizes/dados/')+encodeURIComponent(table);
    const records=[],ids=new Set();let total=null,pagesTotal=null,pageSize=null;
    for(let pageNumber=1;;pageNumber++) {
      const response=await apiGet(endpoint,{pagina:pageNumber,tamanho:500},{signal});
      if(response.tabela!==table||!Array.isArray(response.dados))throw new Error(`Resposta inválida para a tabela ${table}.`);
      const reportedPages=Number(response.total_paginas),reportedTotal=Number(response.total);
      if(!Number.isSafeInteger(reportedPages)||reportedPages<1||!Number.isSafeInteger(reportedTotal)||reportedTotal<0||Number(response.pagina)!==pageNumber)throw new Error(`Paginação inválida na tabela ${table}.`);
      if(pagesTotal==null){pagesTotal=reportedPages;total=reportedTotal;pageSize=Number(response.tamanho);}
      if(pagesTotal!==reportedPages||total!==reportedTotal)throw new Error('A base mudou durante a consulta. Atualize para carregar um conjunto consistente.');
      if(pageNumber>1&&(!response.dados.length||Number(response.tamanho)!==pageSize))throw new Error(`Página incompleta na tabela ${table}. Atualize a consulta.`);
      for(const row of response.dados){if(row.id!=null){if(ids.has(String(row.id)))throw new Error(`A API repetiu registros entre páginas de ${table}.`);ids.add(String(row.id));}records.push(row);}
      onProgress?.(`${table}: ${records.length.toLocaleString('pt-BR')} / ${total.toLocaleString('pt-BR')} registros`);
      if(pageNumber>=pagesTotal)break;
      if(records.length>=total)throw new Error(`Total e paginação divergentes em ${table}.`);
    }
    if(records.length!==total)throw new Error(`Consulta incompleta em ${table}: ${records.length} de ${total} registros. Os indicadores não serão calculados com uma base parcial.`);
    return enrich(D.prepare(table,records));
  }
  function enrich(rows) {
    for(const row of rows){
      const machine=settings.machines.find(m=>String(m.empresa)===row.company&&String(m.unidade)===row.unit&&String(m.maquina)===row.machine);
      const origin=settings.lotOrigins.find(m=>String(m.empresa)===row.company&&String(m.unidade)===row.unit&&String(m.lote)===row.lot);
      if(machine)row.stage=machine.estagio;
      if(!row.origin&&origin)row.origin=origin.origem;
    }
    return rows;
  }
  async function load() {
    state.controller?.abort();const controller=new AbortController();state.controller=controller;
    const timeout=setTimeout(()=>controller.abort('timeout'),120000);
    $('refresh').disabled=true;$('error').classList.add('hidden');state.loaded=false;state.rows=[];state.extra=[];
    receiptState.controller?.abort();receiptState.loaded=false;receiptState.rows=[];receiptState.granja=[];
    if($('receiptsPanel')){$('receiptsPanel').classList.add('hidden');$('receiptsButton').setAttribute('aria-expanded','false');}
    $('ultimaAtualizacao').textContent='—';$('loadStatus').textContent='Conectando ao Worker';render();
    try {
      // Sequential table loads keep progress readable and avoid saturating the API.
      state.rows=await loadTable(page.table,controller.signal,message=>{$('loadStatus').textContent=message;});
      if(page.extraTable)state.extra=D.preferDaily(await loadTable(page.extraTable,controller.signal,message=>{$('loadStatus').textContent=message;}));
      state.loaded=true;
      const supported=new Set(['year','month','week',...page.filters]);
      for(const key of Object.keys(state.filters)) {
        if(!supported.has(key)||!state.rows.concat(state.extra).some(r=>r[key]!==''&&r[key]!=null))delete state.filters[key];
      }
      if(!state.hasSavedFilters&&!selected('year').size&&!page.allYears){const latest=[...state.rows].sort((a,b)=>b.date.localeCompare(a.date))[0];if(latest)selected('year').add(latest.year);}
      const latestLoad=[...state.rows,...state.extra].map(r=>D.text(r.raw.carregado_em)).filter(Boolean).sort().at(-1);
      $('ultimaAtualizacao').textContent=latestLoad?`${dayLabel(latestLoad.slice(0,10))} · ${latestLoad.slice(11,16)}`:'Não informada';
      $('loadStatus').textContent='Dados carregados · histórico completo';render();
    } catch(error) {
      if(state.controller!==controller)return;
      state.rows=[];state.extra=[];state.loaded=false;$('loadStatus').textContent='Consulta indisponível';
      $('error').textContent=controller.signal.aborted?'A consulta excedeu o tempo de espera. Tente atualizar novamente.':error.message;
      $('error').classList.remove('hidden');render();
    } finally {clearTimeout(timeout);if(state.controller===controller)$('refresh').disabled=false;}
  }
  const receiptState={rows:[],granja:[],loaded:false,controller:null};
  async function receipts() {
    const panel=$('receiptsPanel'),button=$('receiptsButton');
    if(!panel.classList.contains('hidden')){panel.classList.add('hidden');button.setAttribute('aria-expanded','false');return;}
    panel.classList.remove('hidden');button.setAttribute('aria-expanded','true');
    if(receiptState.loaded){renderReceipts();return;}
    const controller=new AbortController();receiptState.controller=controller;
    const timeout=setTimeout(()=>controller.abort(),120000);button.disabled=true;
    panel.innerHTML='<p class="mz-notice" role="status">Consultando ovos enviados e recebidos…</p>';
    try {
      receiptState.granja=await loadTable('granja',controller.signal);
      receiptState.rows=await loadTable('inc',controller.signal);
      receiptState.loaded=true;renderReceipts();
    } catch(error) {panel.innerHTML=`<p class="mz-notice mz-error" role="alert">${escape(controller.signal.aborted?'Consulta interrompida.':error.message)}</p>`;}
    finally{clearTimeout(timeout);button.disabled=false;}
  }
  function renderReceipts() {
    const rows=receiptState.rows.filter(r=>matches(r)),granja=receiptState.granja.filter(r=>matches(r));
    const shipped=D.sum(granja,r=>r.raw.incubaveis_granja),received=D.sum(rows,r=>r.raw.total);
    $('receiptsPanel').innerHTML=`<div class="mz-notice">Enviados: ovos incubáveis da granja, pela data de produção. Recebidos: total no incubatório, pela data de recebimento. As datas representam etapas diferentes; estes totais não constituem conciliação de remessas.</div><div class="mz-kpis"><article class="mz-kpi"><span>Incubáveis na granja</span><strong>${format(shipped,'ovos',0)}</strong><small>${granja.length} registros</small></article><article class="mz-kpi"><span>Recebidos no incubatório</span><strong>${format(received,'ovos',0)}</strong><small>${rows.length} registros</small></article></div>`;
  }
  renderShell();render();load();
})();
