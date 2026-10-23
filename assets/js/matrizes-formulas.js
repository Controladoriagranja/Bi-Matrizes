/* Consulta visual exclusiva das fórmulas dos cards de Matrizes. */
(() => {
  const D=window.MatrizesData;
  const sources={
    production:{production:'100 × ovos_produzidos ÷ saldo_femeas',use:'100 × incubaveis_granja ÷ ovos_produzidos',bed:'100 × cama ÷ ovos_produzidos',loss:'100 − aproveitamento do registro'},
    hatch:{hatch:'100 × nascidos ÷ quantid',hatchStd:'eclosao_std',discard:'100 × descarte ÷ nascidos'},
    incubation:{incubated:'quantidade',minimum:'menor idade informada em dias_estoque',maximum:'maior idade informada em dias_estoque',stock:'dias_estoque, quando há uma única idade informada'},
    embryo:{unhatched:'100 × nao_eclodidos ÷ incubados',infertile:'100 × qtde ÷ total_analisado',contaminated:'100 × (qtde_9 + qtde_10) ÷ total_analisado',final:'100 × qtde_4 ÷ total_analisado'}
  };
  let dialog;
  function ensureDialog() {
    if(!dialog){
      dialog=document.createElement('dialog');dialog.className='mz-formula-dialog';dialog.setAttribute('aria-labelledby','mzFormulaTitle');
      document.body.append(dialog);
      dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    }
  }
  function open({key,page,sex,rows,value}) {
    ensureDialog();
    const title=page.kpis.find(item=>item[0]===key)?.[1]||key;
    const source=page.calc==='recria'?D.recriaFields(sex)[key]:sources[page.calc]?.[key];
    const values=rows.map(row=>D.simpleIndicators([row],page.calc,sex)[key]).filter(value=>Number.isFinite(value));
    const format=number=>number==null?'—':number.toLocaleString('pt-BR',{maximumFractionDigits:2});
    dialog.replaceChildren();
    const heading=document.createElement('h2');heading.id='mzFormulaTitle';heading.textContent=title;
    const close=document.createElement('button');close.className='mz-button';close.textContent='Fechar';close.addEventListener('click',()=>dialog.close());
    dialog.append(heading,close);
    for(const text of ['Média simples do período selecionado','Fórmula: soma dos valores válidos ÷ quantidade de valores válidos',`Valor de cada registro: ${source||key}`,`Fonte: matrizes.${page.table}`,`Consulta atual: ${values.length} valores válidos entre ${rows.length} registros filtrados.`,`${format(values.reduce((sum,item)=>sum+item,0))} ÷ ${values.length} = ${format(value)}`,'Cada registro válido tem o mesmo peso. Valores ausentes são excluídos; zeros em peso, uniformidade e GAD indicam ausência de medição. Não há ponderação pela quantidade de aves nestes cards.','Esta regra é própria dos cards de Matrizes. Os gráficos mantêm suas regras de consolidação documentadas.']){
      const paragraph=document.createElement('p');paragraph.textContent=text;dialog.append(paragraph);
    }
    dialog.showModal();
  }
  function openEggUse({rows,value}) {
    ensureDialog();dialog.replaceChildren();
    const values=rows.map(row=>D.n(row.raw.ovos_incubaveis_pct)).filter(value=>value!=null);
    const format=number=>number==null?'—':number.toLocaleString('pt-BR',{maximumFractionDigits:2});
    const heading=document.createElement('h2');heading.id='mzFormulaTitle';heading.textContent='Aproveitamento de ovos';
    const close=document.createElement('button');close.className='mz-button';close.textContent='Fechar';close.addEventListener('click',()=>dialog.close());
    dialog.append(heading,close);
    for(const text of ['Média simples dos percentuais prontos','Fonte: matrizes.inc · coluna ovos_incubaveis_pct','Em cada dia, semana ou mês: soma dos percentuais válidos dos registros ÷ quantidade de percentuais válidos.',`Consulta atual: ${values.length} percentuais válidos entre ${rows.length} registros filtrados.`,`${format(values.reduce((sum,item)=>sum+item,0))} ÷ ${values.length} = ${format(value)}%`,'Cada registro tem o mesmo peso. Valores nulos são excluídos; zero é um percentual válido. O percentual de cada registro é preservado, sem recalcular pelas quantidades de ovos.']) {
      const paragraph=document.createElement('p');paragraph.textContent=text;dialog.append(paragraph);
    }
    dialog.showModal();
  }
  window.MatrizesFormulaUI={open,openEggUse};
})();
