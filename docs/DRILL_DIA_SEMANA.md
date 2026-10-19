# Dia e semana nos gráficos do Matrizes

## Referência PCP — consultada sem modificações

- assets/js/pcp-report.js: PcpPeriodFlags.create cria os radios Dia/Semana; PcpWeekDrill contém a barra de orientação, o bind de série/eixo e o retorno.
- assets/js/pcp-gestao-pa.js: modes e drilledWeeks são estados por gráfico; visibleRows escolhe data.dias ou data.serie e restringe o drill à semana selecionada. As linhas diárias já vêm da API desse projeto.
- assets/js/pcp-comparativo.js e pcp-cirurgico.js: usos do mesmo controle e retorno.
- assets/css/pcp.css: .pcp-period-flags e .pcp-week-drill definem a pílula, o destaque e a orientação.

O Matrizes calcula as séries localmente a partir dos registros retornados pela API, portanto o porte agrupa os registros por data e chama as mesmas funções já usadas por semana. Não copia percentuais semanais para cada dia nem divide totais por sete. A chave de semana do PCP difere de MatrizesData.week: foi preservada a convenção ISO existente do Matrizes, inclusive na virada de ano.

## Componente compartilhado

assets/js/matrizes-period-drill.js expõe MatrizesWeekDrill:

- create: radios, estado por gráfico, barra e botão Voltar às semanas;
- bind: clique em série ou rótulo do eixo semanal faz drill; clique no eixo diário durante drill retorna;
- visibleRows: restringe os dias às semanas elegíveis após filtros e ao limite de semanas;
- dayLabel: dd/mm e dia da semana em duas linhas. A tabela Dados exibe data completa.

Semana é o padrão. Selecionar Dia mostra todos os dias reais das últimas oito semanas visíveis, ou de todo o período quando Mostrar todas as semanas estiver ativo. O limite não é convertido para oito dias. O drill mostra apenas os dias da semana clicada que satisfazem os filtros globais. Se os filtros retirarem a semana do contexto visível, o gráfico retorna para Semana.

Não foram alterados componentes de filtro, Limpar filtros ou navegação lateral. Gráficos de outras granularidades mantêm a seleção anterior. O drill semanal é local ao card e não impõe filtro aos demais gráficos/KPIs.

## Gráficos adaptados (16)

Produção (4): Produção Semanal; Aproveitamento na Granja; Ovos de Cama; Perdas da Produção.

Incubatório (5): Eclosão Semanal; Descarte de Pintos; Eclosão por Faixa Etária; Incubação; Dias em Estoque do Ovo Incubado.

Embriodiagnóstico (7): Não Eclodidos; Infertilidade; Contaminados; Trincados; Mortalidade Inicial · 0 a 7 Dias; Mortalidade Intermediária · 8 a 14 Dias; Mortalidade Final · 15 a 21 Dias.

Nenhum gráfico com eixo semana do ano foi excluído. Recria (semana de vida), curvas por idade, produção que já é diária, séries mensais e anuais não receberam toggle por não serem semana do ano.

## Cálculos e limitações preservados

- MatrizesData e MatrizesPages não foram alterados. Fórmulas, denominadores, pesos e definições de série continuam os existentes.
- A meta mensal de Ovos de Cama mantém sua referência semanal original na visão Semana e usa a data do grupo na visão Dia. Ausência ou conflito de cadastro continua NULL.
- Média de estoque permanece indisponível quando uma linha mistura várias idades sem quantidades separadas; mínimo e máximo continuam usando as idades informadas. Não é possível inventar uma média diária válida nesses casos.
- Referências não cadastradas, medições ausentes e dias sem registros não são convertidos em zero.
- A proporção visual fixa de Aproveitamento (70/30) foi preservada; os rótulos e tooltips continuam mostrando valores reais, inclusive no modo diário.
- Expandir usa o mesmo card, o mesmo estado e as mesmas séries. Dados reflete a granularidade e o drill ativos.

## Arquivos de execução alterados

- assets/js/matrizes-period-drill.js (novo)
- assets/js/matrizes-app.js
- assets/css/matrizes.css
- scripts/build-pages.mjs
- index.html, producao.html, incubatorio.html, embrio.html: carregamento do componente e versões de cache.

Testes novos: tests/matrizes-period-drill.test.cjs e tests/matrizes-period-drill.browser.cjs. Este documento é novo. Os HTMLs de redirecionamento não tiveram mudança de conteúdo.

## Validação

43 testes de cálculo/layout/modelo passaram, incluindo a suíte existente. O teste novo de navegador usa dados sintéticos e API interceptada, sem conectar ao banco ou executar robôs: cobre todos os 16 cards, preservação de séries/cores/eixos, retorno, fórmulas diárias, metas por mês, tabelas, expansão, oito/todas semanas, período, linhagem/lote, virada de mês/ano e dimensões desktop/tablet/telefone. Também foi executada a suíte de regressão de navegador existente. Os detalhes da execução ficam na entrega da tarefa.
