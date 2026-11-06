# Fazenda: código e nome

Aplicação nas quatro telas ativas do BI Matrizes: Recria, Produção de Ovos,
Incubatório e Embriodiagnóstico; desktop, celular, tablet e mesmo frontend no PWA.

## Correção

Antes, a normalização removia o código e usava apenas o nome como identidade.
Assim, `1972 - GRANJA SALOME LTDA` e `3094 - GRANJA SALOME LTDA` se tornavam uma
única opção. A fonte do seletor também era reduzida pelo período e pela cascata.

Agora a identidade de Fazenda é o código existente na origem, e a apresentação
é `código - nome`. O código vem de `granja_codigo`, `cab_cod` ou do prefixo
numérico do texto de fazenda já recebido. O mesmo código é selecionado entre as
fontes das divisões; códigos diferentes não se confundem mesmo com nomes iguais.

O filtro de Fazenda sempre lista todas as fazendas dos dados carregados para a
tela, independentemente de período, origem, linhagem ou outros filtros. A busca
continua afunilando essa lista por código ou nome, e Selecionar tudo continua
agindo somente nos resultados visíveis. Esta é a exceção de Fazenda à cascata,
conforme o pedido do usuário; os demais filtros continuam com a lógica existente.
Uma fazenda selecionada não é desmarcada por mudar outro filtro. Uma combinação
sem registros mostra o estado vazio normal do relatório.

Os filtros continuam afetando todos os indicadores da tela. As referências de
origem no Incubatório permanecem usando empresa/código/lote, sem alteração.
Os cálculos, fórmulas, metas e regra de semanas não mudaram. A identificação do
registro de Acerto agora também preserva fazendas homônimas com códigos distintos,
em vez de tratá-las como se fossem a mesma fazenda na deduplicação existente.

## Sessões existentes e ausência de código

Uma seleção antiga salva apenas como nome representava todos os códigos daquele
nome; ao carregar a tela, ela é convertida para os códigos correspondentes,
preservando esse alcance. Seleções novas são salvas por código e permanecem
separadas ao recarregar. O rascunho móvel usa a mesma migração e identidade.

Não se inventa código nem se aproxima uma fazenda sem código de outra pelo nome.
Se uma origem não enviar código separado nem no texto, a opção usa o nome recebido
como identificação provisória e continua sem prefixo. Nessa situação, separar
fazendas homônimas exige que a origem forneça o código. Nenhum cadastro de fazendas
externo ou endpoint novo foi presumido; o catálogo é o dos dados efetivamente
carregados na tela, não uma nova consulta cadastral ao banco.

## Arquivos

- `assets/js/matrizes-data.js`: identidade, código e nome da fazenda.
- `assets/js/matrizes-app.js`: catálogo completo, seleção por código, cascata e
  migração da sessão anterior.
- `scripts/build-pages.mjs` e `index.html`, `producao.html`, `incubatorio.html`,
  `embrio.html`: versões dos scripts para atualização do cache do navegador.
- `tests/matrizes-data.test.cjs`: fontes, homônimas e ausência de código.
- `tests/matrizes-farms.browser.cjs`: comportamento nas quatro telas.
- `tests/matrizes-default-period.browser.cjs`,
  `tests/matrizes-lotes-busca.browser.cjs`,
  `tests/matrizes-mobile-filters.browser.cjs`: seletores e expectativas adaptados
  à identidade por código e ao catálogo completo de Fazenda.
- Este documento.

## Validação

59 testes unitários, incluindo fazendas homônimas em sete fontes e preservação
de dois registros de Acerto com mesma data/lote mas códigos de fazenda distintos.

Testes em Chrome headless com API e dados simulados conferem as quatro telas:
1972 e 3094 com nomes idênticos; fazenda histórica fora do período ainda disponível;
seleção individual sem misturar dados; pesquisa por nome e código; catálogo não
reduzido por linhagem/mês; origem e tabela de registros do Incubatório; sessão
antiga e nova; seleção múltipla; rascunho no celular e catálogo no tablet; ausência
de novas consultas fora das recargas explícitas. Regressões cobrem período
automático/manual, busca, lista por lote e painel flutuante.

```text
node --test tests/*.test.cjs
node tests/matrizes-farms.browser.cjs
node tests/matrizes-default-period.browser.cjs
node tests/matrizes-lotes-busca.browser.cjs
node tests/matrizes-mobile-filters.browser.cjs
```

Não houve teste com dados autenticados reais ou aparelho físico. Sem alteração
de backend, SQL, backup, commit, push ou deploy. O ajuste anterior de duas casas
decimais foi preservado.
