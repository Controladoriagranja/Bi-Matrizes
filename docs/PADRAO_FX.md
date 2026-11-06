# Padronização fx — Bi-Matrizes

Segundo projeto executado somente depois da conclusão do bi-zootecnico. Não há
dependência entre repositórios: registro, JS e CSS são cópias locais autônomas.
A referência BI-PCP foi apenas consultada.

## Inventário e conteúdo

Ver [tabela final](INVENTARIO_FX.md), [inventário anterior](INVENTARIO_FX_ANTES.md)
e `inventario-fx.json`. As páginas antigas de referência que não integram a navegação atual foram preservadas; os três endereços antigos de seções continuam redirecionando. As 77 ocorrências incluem 15 KPIs, 28 gráficos, 28 tabelas
Dados, cinco listas Lote e a tabela de registros de aproveitamento. Os 29 cards
de gráficos/tabelas e todos os KPIs têm o mesmo fx. Dados e Lote compartilham o
fx do próprio cabeçalho e os mesmos IDs; não há botão redundante por linha.

O registro central possui 60 entradas, incluindo STD, diferenças e regras de
contexto. KPIs e gráficos do mesmo indicador compartilham entrada, com as duas
consolidações explicitamente identificadas. O modal é único por página, mantém
todas as fórmulas relevantes da tela, abre na seção clicada com destaque e usa
o título fixo Fórmulas do relatório. Tem descrição padrão, colunas qualificadas,
passos e um bloco destacado para exceções. A dimensão de sexo de Recria informa
as colunas reais de fêmeas e machos, sem presumir o sexo do rascunho móvel.

## Preservação de regras

- `matrizes-data.js`, funções de negócio, `matrizes-pages.js`, funções de origem,
  lista de lotes, drill, filtros flutuantes, API, configurações e estilos de dados
  não são modificados por esta entrega. Valores, fórmulas, metas, consultas,
  números de semana e contratos permanecem os mesmos.
- KPIs: média simples por registro válido. Gráficos: razões de somas ou médias
  ponderadas conforme a função existente. O registro destaca a diferença.
- Produção: denominações próprias por aves/ovos; Perdas complementa Aproveitamento;
  barras 70%/30% são proporção visual fixa, com rótulos/tooltip reais. Não se
  substitui Perdas pela soma dos motivos.
- Ovos de cama: meta mensal ativa de matrizes.metas, referência pela primeira
  data real do grupo; sem meta/conflito, —. Não reaproveitar outro mês.
- Curva do Acerto: percentual pronto, ponderação pelo saldo; preferDaily intacto.
- Aproveitamento: média simples de inc.ovos_incubaveis_pct; não recalcular a razão
  de ovos incubáveis/total, nem ponderar por quantidade. Zero é válido; NULL não
  entra. Tabela de registros preserva o valor original e usa recebimento.
- Incubação/estoque: extremos sobre idades interpretáveis com quantidade positiva;
  média ponderada só se cada linha elegível tiver exatamente uma idade. Não
  inventar distribuição das sequências como 04-03-02-.
- Contaminados: exigir os dois componentes na mesma linha; STD tem a mesma
  exigência. Os motivos usam amostra analisada; eclosão/não eclodidos usam incubados.
- Filtros e exceções atuais preservados, inclusive origem e classificação por
  empresa/código/lote. Eclosões Anuais já usa allPeriods: compara o histórico
  ignorando ano/mês/semana/datas, mantendo as outras regras; isso fica explícito.
- Todas as contas dos indicadores deste frontend foram localizadas no JS. Por
  isso não se exibe um trecho JS rotulado como Ver regra atual da API. O campo
  opcional do registro está vazio; não foi inventado SQL ou cálculo de backend.
- Duas casas decimais e Fazenda por código/nome da entrega anterior preservadas.

## A DEFINIR

Somente a definição documental do calendário empresarial: o pedido afirma uma
contagem não ISO, mas a função atual MatrizesData.week ajusta pela quinta-feira
e calcula ano/semana em UTC. Ela não foi modificada e nenhum rótulo ou semana
mudou. O registro `context.week` sinaliza discretamente a divergência; precisa
de confirmação da regra corporativa antes de se escrever outra descrição.
Os 77 componentes foram adaptados; nenhuma conta de indicador ficou indefinida.

## Remoções

O antigo modal individual MatrizesFormulaUI e o modal específico de aproveitamento
foram substituídos pelo único componente de fórmulas. O arquivo legado é apenas
um adaptador para abrir esse mesmo modal. Removidos seus controladores no app,
os botões com data-formula/data-egg-formula e quatro regras CSS exclusivas do
modal antigo. Não há fórmulas em HTML de cada card.

## Validação e limites

- 62 testes unitários: dados, calendário, cálculos, formatação, origem, lotes,
  layout, novo registro, IDs e ausência de lógica frontend atribuída à API.
- Chrome headless com API/dados sintéticos nas quatro telas: 15 KPIs e 29 cards,
  todos os botões, instância única, foco, teclado/fechamento, nenhuma consulta
  causada por fx, valores/séries antes/depois iguais, Dados, expansão e Lote.
- Visual em 1440/768/390/320 px e claro/escuro; capturas inspecionadas. Título e
  controles superiores não se sobrepõem. Sem telefone físico ou API real.
- Regressões de Dia/Semana (17 gráficos), listas por lote, busca e painel móvel; suíte geral das quatro telas com valores, eixos, navegação, filtros, tabelas, paginação, sessão ausente e resposta incompleta.
- A suíte de origem/aproveitamento também passou: classificação, referência, percentuais, ordenação, falha da API e quatro larguras. Seus seletores legados de Fazenda foram alinhados à identidade por código já existente, e o fluxo móvel ao painel flutuante atual, sem mudar esses comportamentos no runtime.
- Testes antigos de fórmula passam a usar o novo componente e verificam regras,
  não os exemplos numéricos do modal removido. Não há lint separado configurado.

## Arquivos alterados

- `assets/js/formulas-registry.js`
- `assets/js/indicator-formulas.js`
- `assets/js/matrizes-app.js`
- `assets/js/matrizes-formulas.js`
- `assets/css/indicator-formulas.css`
- `assets/css/matrizes.css`
- `scripts/build-pages.mjs`
- `index.html`
- `producao.html`
- `incubatorio.html`
- `embrio.html`
- `tests/indicator-formulas.browser.cjs`
- `tests/indicator-formulas.test.cjs`
- `tests/matrizes-browser.mjs`
- `tests/matrizes-egg-origin.browser.cjs`
- `tests/matrizes-mobile-filters.browser.cjs`
- `docs/INVENTARIO_FX.md`
- `docs/INVENTARIO_FX_ANTES.md`
- `docs/inventario-fx.json`
- `docs/PADRAO_FX.md`

Sem mudanças de backend, banco, carga real, backup, commit, push ou deploy.
