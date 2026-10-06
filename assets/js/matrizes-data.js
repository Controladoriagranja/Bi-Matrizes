/* Indicadores calculados exclusivamente com registros retornados pelo Worker.
 * Regras, unidades e pendências: docs/INDICADORES_MATRIZES.md.
 */
(function (root) {
  'use strict';
  const n = value => {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    let s = String(value).trim().replace(/\s|%/g, '');
    if (!s || !/^-?[\d.,]+$/.test(s)) return null;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const result = Number(s);
    return Number.isFinite(result) ? result : null;
  };
  const text = value => value == null ? '' : String(value).trim();
  function date(value) {
    const s = text(value);
    let parts;
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) parts = s.slice(0, 10).split('-').map(Number);
    else {
      const match = s.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
      if (!match) return null;
      parts = [Number(match[3]), Number(match[2]), Number(match[1])];
      if (parts[0] < 100) parts[0] += 2000;
    }
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return d.getUTCFullYear() === parts[0] && d.getUTCMonth() === parts[1] - 1 && d.getUTCDate() === parts[2] ? d : null;
  }
  const iso = d => d ? d.toISOString().slice(0, 10) : '';
  function week(d) {
    if (!d) return '';
    const t = new Date(d);
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const year = t.getUTCFullYear();
    const number = Math.ceil((((t - new Date(Date.UTC(year, 0, 1))) / 86400000) + 1) / 7);
    return `${year}-S${String(number).padStart(2, '0')}`;
  }
  const ratio = (a, b) => a != null && b != null && b > 0 ? 100 * a / b : null;
  function sum(rows, getter) {
    const values = rows.map(r => n(getter(r))).filter(v => v != null);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  }
  function rate(rows, numerator, denominator) {
    const valid = rows.filter(r => n(numerator(r)) != null && n(denominator(r)) > 0);
    return ratio(sum(valid, numerator), sum(valid, denominator));
  }
  function weighted(rows, getter, weight) {
    const valid = rows.filter(r => n(getter(r)) != null && n(weight(r)) > 0);
    const denominator = sum(valid, weight);
    return denominator > 0 ? valid.reduce((total, row) => total + n(getter(row)) * n(weight(row)), 0) / denominator : null;
  }
  const positive = v => n(v) > 0 ? n(v) : null;
  const farmName = v => text(v).replace(/^\d+\s*[-–]?\s*/, '');
  const statusName = v => /aberto|ativ/i.test(text(v)) ? 'Ativos' : /fechado|encerr/i.test(text(v)) ? 'Encerrados' : text(v);

  function normalize(table, raw) {
    const d = date(table.startsWith('acerto_') ? raw.ini_semana : table === 'eclosao' ? raw.eclosao : table === 'incubacao' ? raw.data_incubacao : table === 'inc' ? raw.recebimento : raw.data);
    const reportLot=text(raw.cab_lote || raw.lote);
    const lotMatch=raw.cab_lote?reportLot.match(/^(\d+)\.\d+P?$/i):null;
    const house=text(raw.cab_galpao || raw.galpao);
    return {
      raw, table, date: iso(d), year: d ? String(d.getUTCFullYear()) : '',
      month: d ? String(d.getUTCMonth() + 1) : '', week: week(d),
      farm: farmName(raw.cab_granja || raw.granja_nome || raw.granja || raw.integrado),
      lot: lotMatch?lotMatch[1]:reportLot, house: /^\d+$/.test(house)?String(Number(house)):house,
      lineage: text(raw.cab_linhagem || raw.linhagem), age: n(raw.ida_sem ?? raw.idade),
      origin: text(raw.origem), status: statusName(raw.situacao),
      machine: text(raw.maq_inc || raw.maquina), stage: text(raw.estagio_incubadora),
      company: text(raw.empresa_codigo || raw.empresa_contexto), unit: text(raw.unidade_codigo || raw.unidade_contexto)
    };
  }
  function prepare(table, records) {
    const map = new Map();
    for (const raw of records) {
      const row = normalize(table, raw);
      if (!row.date || !row.lot || /^(total|subtotal)\b/i.test(row.lot)) continue;
      // Acerto records are repeated by report extraction; retain the latest version
      // of the same lot/house/date/sex/granularity. Other reports only drop exact
      // business duplicates, since delivery/batch identifiers are not supplied.
      const key = table.startsWith('acerto_')
        ? JSON.stringify([row.company, row.unit, row.farm, raw.cab_lote, row.lot, row.house, raw.cab_lado, row.date, raw.sexo_relatorio, raw.tipo_movto])
        : JSON.stringify(Object.keys(raw).sort().filter(k => !['id', 'processo', 'carregado_em', 'periodo_inicio', 'periodo_fim', 'data_inicial', 'data_final', 'descricao', 'resumido', 'empresa_unidade'].includes(k) && !/powerbi|embriodiagnostico_periodo/.test(k)).map(k => [k, raw[k]]));
      const old = map.get(key);
      if (!old || text(raw.carregado_em) >= text(old.raw.carregado_em)) map.set(key, row);
    }
    return [...map.values()];
  }
  function previousTwoMonths(reference=new Date()) {
    const end=new Date(Date.UTC(reference.getFullYear(),reference.getMonth(),0));
    const start=new Date(Date.UTC(reference.getFullYear(),reference.getMonth()-2,1));
    return {start:iso(start),end:iso(end)};
  }
  function lifeWeekGroups(rows,start=1,end=22) {
    const groups=new Map(group(rows,row=>row.age));
    return Array.from({length:end-start+1},(_,index)=>{const age=start+index;return [age,groups.get(age)||[]];});
  }
  function chartGroups(rows,key,limit=8) {
    const groups=group(rows,row=>key==='monthPeriod'?row.date.slice(0,7):row[key]);
    return limit==null?groups:groups.slice(-limit);
  }
  function group(rows, getter) {
    const groups = new Map();
    rows.forEach(row => {
      const key = getter(row);
      if (key === '' || key == null) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return [...groups].sort(([a], [b]) => String(a).localeCompare(String(b), 'pt-BR', {numeric: true}));
  }
  function recriaFields(sex) {
    return sex === 'machos'
      ? {viab:'viab_mac', viabStd:'std_viab_mac', weight:'ps_medio_machos', weightStd:'ps_medio_std_machos', uniform:'unif_machos', uniformStd:'unif_std_machos', cv:'cv_machos', birds:'saldo_macho', housed:'cab_macho', initial:'cab_ps_med_machos', gad:'consu_ali_gr_machos', gadStd:'consu_ali_std_machos'}
      : {viab:'viab_fem', viabStd:'std_viab_fem', weight:'ps_medio_femeas', weightStd:'ps_medio_std_femeas', uniform:'unif_femeas', uniformStd:'unif_std_femeas', cv:'cv_femeas', birds:'saldo_femea', housed:'cab_femeas', initial:'cab_ps_med_femeas', gad:'consu_ali_gr_femeas', gadStd:'consu_ali_std_femeas'};
  }
  function recria(rows, sex, gadMap) {
    const f = recriaFields(sex), birds = r => r.raw[f.birds], housed = r => r.raw[f.housed];
    const result = {
      viab: weighted(rows, r => r.raw[f.viab], housed), viabStd: weighted(rows, r => r.raw[f.viabStd], housed),
      weight: weighted(rows, r => positive(r.raw[f.weight]), birds), weightStd: weighted(rows, r => positive(r.raw[f.weightStd]), birds),
      uniform: weighted(rows, r => positive(r.raw[f.uniform]), birds), uniformStd: weighted(rows, r => positive(r.raw[f.uniformStd]), birds),
      cv: weighted(rows, r => positive(r.raw[f.cv]), birds),
      gad: weighted(rows, r => positive(r.raw[f.gad]), birds), gadStd: weighted(rows, r => positive(r.raw[f.gadStd]), birds)
    };
    result.viabDiff = result.viab == null || result.viabStd == null ? null : result.viab - result.viabStd;
    result.weightDiff = result.weight == null || !result.weightStd ? null : (result.weight/result.weightStd-1)*100;
    return result;
  }
  function production(rows) {
    const eggs = r => r.raw.ovos_produzidos, birds = r => r.raw.saldo_femeas;
    const result = {
      production: rate(rows, eggs, birds), productionStd: weighted(rows,r=>r.raw.prod_std_pct,birds),
      use: rate(rows,r=>r.raw.incubaveis_granja,eggs), useStd: weighted(rows,r=>r.raw.aprov_std_pct,eggs),
      bed: rate(rows,r=>r.raw.cama,eggs), bedStd: weighted(rows,r=>r.raw.cama_std_pct,eggs)
    };
    result.loss = result.use == null ? null : 100-result.use;
    result.diff = result.production == null || result.productionStd == null ? null : result.production-result.productionStd;
    for (const key of ['trincado','vazado','sujo','duas_gemas','deformado','pequeno']) result[key] = rate(rows,r=>r.raw[key],eggs);
    return result;
  }
  function curve(rows) {
    const birds = r=>r.raw.saldo_femea;
    // The report's production percentage already accounts for the length of
    // daily or weekly movements; a weekly egg total / ending balance would not.
    const result = {production:weighted(rows,r=>r.raw.producao,birds),productionStd:weighted(rows,r=>r.raw.producao_std,birds)};
    return result;
  }
  function hatch(rows) {
    const eggs = r=>r.raw.quantid, chicks=r=>r.raw.nascidos;
    const result = {hatch:rate(rows,chicks,eggs),hatchStd:weighted(rows,r=>r.raw.eclosao_std,eggs),discard:rate(rows,r=>r.raw.descarte,chicks)};
    result.diff = result.hatch == null || result.hatchStd == null ? null : result.hatch-result.hatchStd;
    for (const [key, predicate] of [['young',a=>a<=35],['middle',a=>a>=36&&a<=50],['old',a=>a>=51]]) result[key]=rate(rows.filter(r=>r.age!=null&&predicate(r.age)),chicks,eggs);
    return result;
  }
  function stockDays(value) {
    const s = text(value);
    if (/^\d+(?:[.,]\d+)?$/.test(s)) return [n(s)];
    if (/^(?:\d{1,3}-)+$/.test(s)) return s.slice(0,-1).split('-').map(Number);
    return [];
  }
  function incubation(rows) {
    const eligible = rows.filter(r=>n(r.raw.quantidade)>0);
    const allDays = eligible.flatMap(r=>stockDays(r.raw.dias_estoque));
    const exact = eligible.length > 0 && eligible.every(r=>stockDays(r.raw.dias_estoque).length===1);
    return {incubated:sum(rows,r=>r.raw.quantidade),minimum:allDays.length?Math.min(...allDays):null,
      maximum:allDays.length?Math.max(...allDays):null,
      stock:exact?weighted(eligible,r=>stockDays(r.raw.dias_estoque)[0],r=>r.raw.quantidade):null};
  }
  function embryo(rows) {
    const eggs=r=>r.raw.incubados, sample=r=>r.raw.total_analisado;
    const result = {hatch:rate(rows,r=>r.raw.nascidos,eggs),unhatched:rate(rows,r=>r.raw.nao_eclodidos,eggs)};
    for (const [key,count,std] of [['infertile','qtde','std'],['initial','qtde_2','std_2'],['middle','qtde_3','std_3'],['final','qtde_4','std_4'],['crackInc','qtde_7','std_7'],['crackTrans','qtde_8','std_8']]) {
      result[key]=rate(rows,r=>r.raw[count],sample);
      result[key+'Std']=weighted(rows,r=>r.raw[std],sample);
    }
    result.contaminated=rate(rows,r=>n(r.raw.qtde_9)!=null&&n(r.raw.qtde_10)!=null?n(r.raw.qtde_9)+n(r.raw.qtde_10):null,sample);
    result.contaminatedStd=weighted(rows,r=>n(r.raw.std_9)!=null&&n(r.raw.std_10)!=null?n(r.raw.std_9)+n(r.raw.std_10):null,sample);
    return result;
  }
  function mean(values) {
    const valid=values.map(n).filter(value=>value!=null);
    return valid.length?valid.reduce((total,value)=>total+value,0)/valid.length:null;
  }
  // Regras dos cards deste relatório. Não dependem do módulo Zootécnico.
  function simpleIndicators(rows,kind,sex='femeas') {
    if(kind==='recria') {
      const fields=recriaFields(sex);
      return Object.fromEntries(['viab','uniform','weight','gad'].map(key=>[key,mean(rows.map(row=>key==='viab'?n(row.raw[fields[key]]):positive(row.raw[fields[key]])))]));
    }
    const calculate={production,hatch,incubation,embryo,curve}[kind];
    const values=rows.map(row=>calculate([row]));
    return Object.fromEntries([...new Set(values.flatMap(value=>Object.keys(value)))].map(key=>[key,mean(values.map(value=>value[key]))]));
  }
  function preferDaily(rows) {
    const dailyLots = new Set(rows.filter(r=>/di.rio/i.test(text(r.raw.tipo_movto))).map(r=>JSON.stringify([r.company,r.unit,r.lot,r.house])));
    return rows.filter(r=>!dailyLots.has(JSON.stringify([r.company,r.unit,r.lot,r.house]))||/di.rio/i.test(text(r.raw.tipo_movto)));
  }
  const api = {n,text,date,iso,week,ratio,sum,rate,weighted,normalize,prepare,group,previousTwoMonths,lifeWeekGroups,chartGroups,recriaFields,mean,simpleIndicators,recria,production,curve,hatch,stockDays,incubation,embryo,preferDaily};
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.MatrizesData=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
