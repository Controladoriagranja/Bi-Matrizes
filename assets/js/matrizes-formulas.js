/* Compatibilidade: toda a apresentação é do componente único. Sem modal próprio. */
window.MatrizesFormulaUI={
 open:({key,page})=>IndicatorFormulaUI.open(page.calc+'.'+key),
 openEggUse:()=>IndicatorFormulaUI.open('eggUse.eggUse')
};
