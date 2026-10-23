/* Origem no Incubatório: coluna direta em eclosao/inc; referência em inc para incubacao.
 * Chave validada com o usuário: empresa + código da granja + lote.
 * Não aproxima nomes, não cruza empresas e não escolhe entre origens conflitantes.
 */
(function(root){
  'use strict';
  const text=value=>value==null?'':String(value).trim();
  function canonical(value){
    const original=text(value);
    return ['Próprio','Própria'].includes(original)?'Própria':['Terceiro','Terceiros'].includes(original)?'Terceiros':'';
  }
  function key(row){
    const raw=row.raw,company=text(row.company);
    const farm=text(raw.granja_codigo||raw.cab_cod)||(text(raw.granja||raw.integrado).match(/^([0-9]+)/)?.[1]||'');
    const lot=text(row.lot);
    return company&&farm&&lot?JSON.stringify([company,farm,lot]):null;
  }
  function buildReference(rows){
    const groups=new Map();
    for(const row of rows){
      const id=key(row),origin=text(row.raw.origem);
      if(!id||!origin)continue;
      if(!groups.has(id))groups.set(id,new Set());
      groups.get(id).add(origin);
    }
    return new Map([...groups].map(([id,values])=>[id,values.size===1?canonical([...values][0]):'']));
  }
  function resolve(row,reference){return reference.get(key(row))||'';}
  function average(rows,D){return {eggUse:D.mean(rows.map(row=>row.raw.ovos_incubaveis_pct))};}
  const recordColumns=[['date','Recebimento'],['week','Semana'],['origin','Origem dos ovos'],['farm','Fazenda'],['lot','Lote'],['lineage','Linhagem'],['age','Idade (semanas)'],['total','Total de ovos'],['eggs','Ovos incubáveis'],['percentage','Ovos incubáveis (%)']];
  const collator=new Intl.Collator('pt-BR',{numeric:true,sensitivity:'base'});
  function sortRecords(rows,sort,D){
    const field=recordColumns.some(([key])=>key===sort.key)?sort.key:'date';
    const numeric=['age','total','eggs','percentage'].includes(field);
    const value=row=>field==='total'?D.n(row.raw.total):field==='eggs'?D.n(row.raw.ovos_incubaveis):field==='percentage'?D.n(row.raw.ovos_incubaveis_pct):field==='age'?D.n(row.age):row[field];
    const direction=sort.direction==='desc'?-1:1;
    return rows.slice().sort((a,b)=>{
      const x=value(a),y=value(b),emptyX=x==null||x==='',emptyY=y==null||y==='';
      // Ausências ficam no fim em ambas as direções. Zero continua sendo válido.
      if(emptyX!==emptyY)return emptyX?1:-1;
      const comparison=emptyX?0:numeric?x-y:collator.compare(String(x),String(y));
      return comparison*direction||collator.compare(a.date,b.date)||collator.compare(a.farm,b.farm)||collator.compare(a.lot,b.lot);
    });
  }
  const api={canonical,key,buildReference,resolve,average,recordColumns,sortRecords};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MatrizesEggOrigin=api;
})(globalThis);
