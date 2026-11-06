# Inventário final — Bi-Matrizes

77 ocorrências de interface padronizadas, mais a definição documental de calendário pendente. O registro possui 60 entradas; indicadores compartilhados não duplicam fórmulas entre cards.

| Tela | Card/gráfico/tabela | Tipo | Antes | Status | IDs centrais | Fonte |
|---|---|---|---|---|---|---|
| Recria | Viabilidade | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | recria.viab | matrizes-data.simpleIndicators → recria por registro; média simples |
| Recria | Uniformidade | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | recria.uniform | matrizes-data.simpleIndicators → recria por registro; média simples |
| Recria | Peso Médio | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | recria.weight | matrizes-data.simpleIndicators → recria por registro; média simples |
| Recria | GAD | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | recria.gad | matrizes-data.simpleIndicators → recria por registro; média simples |
| Recria | Viabilidade | Gráfico | não | padronizado | recria.viab; recria.viabStd; recria.viabDiff | matrizes-app.points/calc → matrizes-data.recria |
| Recria | Viabilidade — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | recria.viab; recria.viabStd; recria.viabDiff | matrizes-app.renderChart → mesmos pontos do gráfico |
| Recria | Uniformidade e CV | Gráfico | não | padronizado | recria.uniform; recria.uniformStd; recria.cv | matrizes-app.points/calc → matrizes-data.recria |
| Recria | Uniformidade e CV — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | recria.uniform; recria.uniformStd; recria.cv | matrizes-app.renderChart → mesmos pontos do gráfico |
| Recria | Peso Médio | Gráfico | não | padronizado | recria.weight; recria.weightStd; recria.weightDiff | matrizes-app.points/calc → matrizes-data.recria |
| Recria | Peso Médio — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | recria.weight; recria.weightStd; recria.weightDiff | matrizes-app.renderChart → mesmos pontos do gráfico |
| Recria | GAD (Gramas por Ave por Dia) | Gráfico | não | padronizado | recria.gad; recria.gadStd | matrizes-app.points/calc → matrizes-data.recria |
| Recria | GAD (Gramas por Ave por Dia) — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | recria.gad; recria.gadStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Produção | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | production.production | matrizes-data.simpleIndicators → production por registro; média simples |
| Produção de Ovos | Aproveitamento | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | production.use | matrizes-data.simpleIndicators → production por registro; média simples |
| Produção de Ovos | Ovos de Cama | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | production.bed | matrizes-data.simpleIndicators → production por registro; média simples |
| Produção de Ovos | Perdas | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | production.loss | matrizes-data.simpleIndicators → production por registro; média simples |
| Produção de Ovos | Produção Semanal | Gráfico | não | padronizado | production.production; production.productionStd; production.diff | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Produção Semanal — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | production.production; production.productionStd; production.diff | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Produção Semanal — Lote | Lista por lote | não | padronizado | production.production | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Produção de Ovos | Aproveitamento na Granja | Gráfico | não | padronizado | production.use; production.loss; production.useStd | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Aproveitamento na Granja — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | production.use; production.loss; production.useStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Aproveitamento na Granja — Lote | Lista por lote | não | padronizado | production.use | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Produção de Ovos | Ovos de Cama | Gráfico | não | padronizado | production.bed; production.bedStd | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Ovos de Cama — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | production.bed; production.bedStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Perdas da Produção | Gráfico | não | padronizado | production.trincado; production.vazado; production.sujo; production.duas_gemas; production.deformado; production.pequeno | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Perdas da Produção — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | production.trincado; production.vazado; production.sujo; production.duas_gemas; production.deformado; production.pequeno | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Produção por Dia | Gráfico | não | padronizado | production.production; production.productionStd | matrizes-app.points/calc → matrizes-data.production |
| Produção de Ovos | Produção por Dia — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | production.production; production.productionStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção de Ovos | Curva de Produção por Lote | Gráfico | não | padronizado | curve.production; curve.productionStd | matrizes-app.points/calc → matrizes-data.curve |
| Produção de Ovos | Curva de Produção por Lote — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | curve.production; curve.productionStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosão | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | hatch.hatch | matrizes-data.simpleIndicators → hatch por registro; média simples |
| Incubatório | STD Eclosão | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | hatch.hatchStd | matrizes-data.simpleIndicators → hatch por registro; média simples |
| Incubatório | Descarte | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | hatch.discard | matrizes-data.simpleIndicators → hatch por registro; média simples |
| Incubatório | Eclosão Semanal | Gráfico | não | padronizado | hatch.hatch; hatch.hatchStd; hatch.diff | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosão Semanal — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | hatch.hatch; hatch.hatchStd; hatch.diff | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosão Semanal — Lote | Lista por lote | não | padronizado | hatch.hatch | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Incubatório | Descarte de Pintos | Gráfico | não | padronizado | hatch.discard; hatch.discardTarget | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Descarte de Pintos — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | hatch.discard; hatch.discardTarget | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Descarte de Pintos — Lote | Lista por lote | não | padronizado | hatch.discard | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Incubatório | Eclosão por Mês | Gráfico | não | padronizado | hatch.hatch; hatch.hatchStd; hatch.diff | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosão por Mês — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | hatch.hatch; hatch.hatchStd; hatch.diff | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Descarte por Mês | Gráfico | não | padronizado | hatch.discard; hatch.discardTarget | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Descarte por Mês — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | hatch.discard; hatch.discardTarget | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosão por Faixa Etária | Gráfico | não | padronizado | hatch.young; hatch.middle; hatch.old | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosão por Faixa Etária — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | hatch.young; hatch.middle; hatch.old | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosões Anuais | Gráfico | não | padronizado | hatch.hatch; hatch.hatchStd; hatch.diff; context.annual | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosões Anuais — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | hatch.hatch; hatch.hatchStd; hatch.diff; context.annual | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Eclosão por Idade | Gráfico | não | padronizado | hatch.hatch; hatch.hatchStd | matrizes-app.points/calc → matrizes-data.hatch |
| Incubatório | Eclosão por Idade — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | hatch.hatch; hatch.hatchStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Incubação | Gráfico | não | padronizado | incubation.incubated; incubation.incubationTarget | matrizes-app.points/calc → matrizes-data.incubation |
| Incubatório | Incubação — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | incubation.incubated; incubation.incubationTarget | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Dias em Estoque do Ovo Incubado | Gráfico | não | padronizado | incubation.minimum; incubation.stock; incubation.maximum | matrizes-app.points/calc → matrizes-data.incubation |
| Incubatório | Dias em Estoque do Ovo Incubado — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | incubation.minimum; incubation.stock; incubation.maximum | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Aproveitamento de Ovos por Semana | Gráfico | sim: fx de Aproveitamento de ovos | padronizado | eggUse.eggUse | matrizes-app.points/calc → MatrizesEggOrigin.average → MatrizesData.mean |
| Incubatório | Aproveitamento de Ovos por Semana — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | eggUse.eggUse | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Aproveitamento de Ovos por Semana — Lote | Lista por lote | não | padronizado | eggUse.eggUse | MatrizesLotList.aggregate → mesma calc, período e filtros do card |
| Incubatório | Aproveitamento de Ovos por Mês | Gráfico | sim: fx de Aproveitamento de ovos | padronizado | eggUse.eggUse | matrizes-app.points/calc → MatrizesEggOrigin.average → MatrizesData.mean |
| Incubatório | Aproveitamento de Ovos por Mês — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | eggUse.eggUse | matrizes-app.renderChart → mesmos pontos do gráfico |
| Incubatório | Aproveitamento de ovos — registros | Tabela de registros | sim: fx individual | padronizado | eggUse.eggUse; eggUse.records | matrizes-app.renderEggRecords / matrizes-egg-origin.average; matrizes.inc |
| Embriodiagnóstico | Não Eclodidos | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | embryo.unhatched | matrizes-data.simpleIndicators → embryo por registro; média simples |
| Embriodiagnóstico | Infertilidade | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | embryo.infertile | matrizes-data.simpleIndicators → embryo por registro; média simples |
| Embriodiagnóstico | Contaminados | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | embryo.contaminated | matrizes-data.simpleIndicators → embryo por registro; média simples |
| Embriodiagnóstico | Mortalidade Final | KPI | sim: mini-button com modal MatrizesFormulaUI individual | padronizado | embryo.final | matrizes-data.simpleIndicators → embryo por registro; média simples |
| Embriodiagnóstico | Não Eclodidos | Gráfico | não | padronizado | embryo.hatch; embryo.unhatched | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Não Eclodidos — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | embryo.hatch; embryo.unhatched | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Infertilidade | Gráfico | não | padronizado | embryo.infertile; embryo.infertileStd | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Infertilidade — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | embryo.infertile; embryo.infertileStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Contaminados | Gráfico | não | padronizado | embryo.contaminated; embryo.contaminatedStd | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Contaminados — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | embryo.contaminated; embryo.contaminatedStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Trincados | Gráfico | não | padronizado | embryo.crackInc; embryo.crackTrans | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Trincados — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | embryo.crackInc; embryo.crackTrans | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Mortalidade Inicial · 0 a 7 Dias | Gráfico | não | padronizado | embryo.initial; embryo.initialStd | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Mortalidade Inicial · 0 a 7 Dias — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | embryo.initial; embryo.initialStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Mortalidade Intermediária · 8 a 14 Dias | Gráfico | não | padronizado | embryo.middle; embryo.middleStd | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Mortalidade Intermediária · 8 a 14 Dias — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | embryo.middle; embryo.middleStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Embriodiagnóstico | Mortalidade Final · 15 a 21 Dias | Gráfico | não | padronizado | embryo.final; embryo.finalStd | matrizes-app.points/calc → matrizes-data.embryo |
| Embriodiagnóstico | Mortalidade Final · 15 a 21 Dias — Dados | Tabela do gráfico | usa cabeçalho do gráfico; em geral sem fx | padronizado | embryo.final; embryo.finalStd | matrizes-app.renderChart → mesmos pontos do gráfico |
| Produção / Incubatório / Embriodiagnóstico | Definição do calendário empresarial | Regra contextual dos gráficos semanais | regra implícita em MatrizesData.week | A DEFINIR — documentação da regra empresarial | context.week | matrizes-data.week; código preservado |
