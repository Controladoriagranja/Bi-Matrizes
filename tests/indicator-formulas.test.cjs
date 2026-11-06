const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={window:{},document:{body:{dataset:{page:'incubatorio'}},getElementById(){return null;}}};vm.createContext(box);
vm.runInContext(fs.readFileSync('assets/js/matrizes-pages.js','utf8'),box);vm.runInContext(fs.readFileSync('assets/js/formulas-registry.js','utf8'),box);const R=box.window.FormulaRegistry;
test('todas as séries e KPIs existentes referenciam indicadores documentados',()=>{
 for(const [id,page] of Object.entries(box.MatrizesPages)){
  box.document.body.dataset.page=id;
  for(const [key] of page.kpis)assert.ok(R.get(page.calc+'.'+key));
  for(const chart of page.charts)for(const key of R.chartIds(chart).split(' '))assert.ok(R.get(key),key);
 }
});
test('regras reais diferenciadas e definição empresarial pendente sem alterar o calendário',()=>{
 assert.equal(R.get('context.week').status,'A DEFINIR');
 assert.match(R.get('eggUse.eggUse').formula,/inc\.ovos_incubaveis_pct/);assert.match(R.get('eggUse.eggUse').rules.join(' '),/NÃO recalcular/);
 assert.match(R.get('production.use').rules.join(' '),/70%\/30%/);assert.match(R.get('production.bedStd').rules.join(' '),/cadastro mensal/);
 assert.match(R.get('incubation.stock').rules.join(' '),/TODOS/);assert.match(R.get('recria.gad').rules.join(' '),/não calcular ganho/);
});
test('descrição padrão, colunas qualificadas e nenhum cálculo frontend rotulado como API',()=>{
 for(const entry of R.entries.values()){
  assert.equal(entry.description,'Cálculo aplicado aos componentes no contexto selecionado.');assert.ok(entry.steps.length&&entry.rules.length);
  assert.equal(entry.apiRule,'');for(const column of entry.columns)assert.match(column,/^[a-z0-9_]+\.[a-z0-9_]+$/);
 }
 const source=fs.readFileSync('assets/js/formulas-registry.js','utf8');assert.doesNotMatch(source,/https?:\/\/|192\.168\.|DATABASE_URL|API_PASSWORD|[A-Z]:\\\\/i);
});
