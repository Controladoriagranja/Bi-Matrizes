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
  const api={canonical,key,buildReference,resolve,average};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MatrizesEggOrigin=api;
})(globalThis);
