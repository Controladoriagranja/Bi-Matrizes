# Inventário anterior — Bi-Matrizes

Realizado antes de alterar o segundo projeto. Inclui quatro telas e suas divisões, tabelas Dados e listas Lote.

| Tela | Card/bloco | Tipo | fx anterior | Fonte |
|---|---|---|---|---|
| Recria | Viabilidade | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → recria por registro; média simples |
| Recria | Uniformidade | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → recria por registro; média simples |
| Recria | Peso Médio | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → recria por registro; média simples |
| Recria | GAD | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → recria por registro; média simples |
| Recria | Viabilidade | Gráfico | não | matrizes-app.points/calc → matrizes-data.recria |
| Recria | Viabilidade — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Recria | Uniformidade e CV | Gráfico | não | matrizes-app.points/calc → matrizes-data.recria |
| Recria | Uniformidade e CV — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Recria | Peso Médio | Gráfico | não | matrizes-app.points/calc → matrizes-data.recria |
| Recria | Peso Médio — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Recria | GAD (Gramas por Ave por Dia) | Gráfico | não | matrizes-app.points/calc → matrizes-data.recria |
| Recria | GAD (Gramas por Ave por Dia) — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Produção | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → production por registro; média simples |
| Produção de Ovos | Aproveitamento | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → production por registro; média simples |
| Produção de Ovos | Ovos de Cama | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → production por registro; média simples |
| Produção de Ovos | Perdas | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → production por registro; média simples |
| Produção de Ovos | Produção Semanal | Gráfico | não | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Produção Semanal — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Produção Semanal — Lote | Lista por lote | não | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Produção de Ovos | Aproveitamento na Granja | Gráfico | não | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Aproveitamento na Granja — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Aproveitamento na Granja — Lote | Lista por lote | não | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Produção de Ovos | Ovos de Cama | Gráfico | não | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Ovos de Cama — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Perdas da Produção | Gráfico | não | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Perdas da Produção — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Produção por Dia | Gráfico | não | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Produção por Dia — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Curva de Produção por Lote | Gráfico | não | matrizes-app.points/calc → matrizes-data.curve |
| Produção de Ovos | Curva de Produção por Lote — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosão | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → hatch por registro; média simples |
| Incubatório | STD Eclosão | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → hatch por registro; média simples |
| Incubatório | Descarte | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → hatch por registro; média simples |
| Incubatório | Eclosão Semanal | Gráfico | não | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosão Semanal — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosão Semanal — Lote | Lista por lote | não | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Incubatório | Descarte de Pintos | Gráfico | não | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Descarte de Pintos — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Descarte de Pintos — Lote | Lista por lote | não | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Incubatório | Eclosão por Mês | Gráfico | não | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosão por Mês — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Descarte por Mês | Gráfico | não | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Descarte por Mês — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosão por Faixa Etária | Gráfico | não | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosão por Faixa Etária — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosões Anuais | Gráfico | não | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosões Anuais — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosão por Idade | Gráfico | não | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosão por Idade — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Incubação | Gráfico | não | matrizes-app.points/calc → matrizes-data.incubation |
| Incubatório | Incubação — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Dias em Estoque do Ovo Incubado | Gráfico | não | matrizes-app.points/calc → matrizes-data.incubation |
| Incubatório | Dias em Estoque do Ovo Incubado — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Aproveitamento de Ovos por Semana | Gráfico | sim: fx de Aproveitamento de ovos | matrizes-app.points/calc → matrizes-data.eggUse / MatrizesEggOrigin.average |
| Incubatório | Aproveitamento de Ovos por Semana — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Aproveitamento de Ovos por Semana — Lote | Lista por lote | não | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Incubatório | Aproveitamento de Ovos por Mês | Gráfico | sim: fx de Aproveitamento de ovos | matrizes-app.points/calc → matrizes-data.eggUse / MatrizesEggOrigin.average |
| Incubatório | Aproveitamento de Ovos por Mês — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Aproveitamento de ovos — registros | Tabela de registros | sim: fx individual | matrizes-app.renderEggRecords / matrizes-egg-origin.average; matrizes.inc |
| Embriodiagnóstico | Não Eclodidos | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → embryo por registro; média simples |
| Embriodiagnóstico | Infertilidade | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → embryo por registro; média simples |
| Embriodiagnóstico | Contaminados | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → embryo por registro; média simples |
| Embriodiagnóstico | Mortalidade Final | KPI | sim: mini-button com modal MatrizesFormulaUI individual | matrizes-data.simpleIndicators → embryo por registro; média simples |
| Embriodiagnóstico | Não Eclodidos | Gráfico | não | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Não Eclodidos — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Infertilidade | Gráfico | não | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Infertilidade — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Contaminados | Gráfico | não | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Contaminados — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Trincados | Gráfico | não | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Trincados — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Mortalidade Inicial · 0 a 7 Dias | Gráfico | não | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Mortalidade Inicial · 0 a 7 Dias — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Mortalidade Intermediária · 8 a 14 Dias | Gráfico | não | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Mortalidade Intermediária · 8 a 14 Dias — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Mortalidade Final · 15 a 21 Dias | Gráfico | não | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Mortalidade Final · 15 a 21 Dias — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | matrizes-app.renderChart → mesmos pontos do gráfico |
