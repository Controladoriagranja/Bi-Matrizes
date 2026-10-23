# Correção do período dinâmico em todas as telas

## Causa raiz e evidência

O período padrão usava previousTwoMonths(), incluindo o fim no último dia do mês anterior. Em 23/10/2026, todas as telas começavam em 01/08/2026 e terminavam em 30/09/2026. O filtro matches() descartava eventos posteriores ao fim, mesmo quando eles já tinham sido recebidos da API.

O diagnóstico oficial enviado pelo usuário em 23/10/2026 confirmou igualdade entre banco e API para todas as nove tabelas consultadas: quantidade bruta, primeira/última data, contagens dos doze meses de 2026 e datas ausentes/inválidas. As tabelas são acerto_produtor_producao, acerto_produtor_recria, granja, inc, incubacao, eclosao, embrio, lotes e metas. Não foi constatada perda de outubro na paginação da API.

As datas máximas de evento no retorno foram: granja/eclosao 23/10, acerto Produção 22/10, Recria 19/10, inc 18/10, incubacao 17/10 e embrio 15/10. Todas tinham dados de outubro após normalização. Metas iam até dezembro e não devem definir o fim do relatório.

A sessão de Recria tinha início/fim vazios; Produção usava o padrão sem sessão salva; Incubatório tinha o intervalo 01/08–30/09 salvo. Isso explica por que Recria mostrava outubro. A atualização de Produção apareceu como 23/10/2026 · 13:14:24 após concluir a carga. O travessão do print anterior correspondia ao carregamento parcial.

Os ativos do frontend usavam cache: no-store nas consultas. Os resultados reais da API conferiram com o banco. Não foi necessário mudar cache HTTP, paginação, joins, extratores ou backend para resolver este corte. Os headers de resposta da API oficial não foram capturados pelo cliente apiGet; não se afirma uma configuração de Cloudflare que não foi observada.

## Comportamento corrigido

MatrizesData.defaultPeriod(rows, reference) conserva o início retornado pela função anterior, mas define o fim pelo maior row.date válido das fontes carregadas da página. Sem eventos válidos, usa o dia atual no relógio local do navegador, como fallback. Nunca usa carregado_em, periodo_inicio/fim ou a referência das metas como data do evento.

| Tela | Fontes consideradas para Data final automática |
|---|---|
| Recria | acerto_produtor_recria.ini_semana |
| Produção, Ovos de cama, Perdas, Aproveitamento e Curvas | granja.data e acerto_produtor_producao.ini_semana |
| Incubatório e todas as divisões, incluindo Aproveitamento de ovos | eclosao.eclosao, incubacao.data_incubacao e inc.recebimento |
| Embriodiagnóstico | embrio.data |

A data máxima considera as fontes da página antes dos filtros de Fazenda/Lote/Linhagem, para essas seleções não mudarem o período automático. Cada gráfico continua usando sua própria fonte e suas próprias datas; Incubação não passa a ter eventos até 23/10 apenas porque Eclosão tem.

O fim automático acompanha o carregamento de páginas e as atualizações. Limpar filtros restaura o início vigente e o maior evento disponível, removendo as seleções como já fazia. Selecionar meses mantém o comportamento anterior de limpar o intervalo de datas e de semanas; isso é uma seleção explícita, não um retorno ao modo automático.

## Preservação das seleções

A sessão mantém a mesma chave por módulo e passa a guardar endMode: auto ou manual. Escolher ou apagar Data final marca o período como manual. Alterar somente Data inicial não desativa a atualização automática do fim. Alterar Fazenda, Lote, Ano etc. também não congela o fim automático.

Sessões antigas sem endMode são preservadas como manuais: não é possível distinguir com segurança um padrão antigo de uma consulta histórica intencional. Portanto, após atualizar os arquivos, clicar uma vez em Limpar filtros em cada tela que ainda tiver 30/09 salvo ativa o novo modo automático. Não é preciso apagar sessão, token ou dados do navegador.

## Última atualização

O cabeçalho recebe o maior carregado_em dos registros brutos já recebidos, inclusive registros que não entram nos indicadores por falta de data/lote. Assim, a atualização não depende de datas de evento filtradas nem precisa esperar o último desenho do gráfico. A data de carga não altera o fim do período. Incubatório continua aguardando as três fontes completas para apresentar indicadores classificados por origem, enquanto o cabeçalho já pode informar a carga recebida.

## Regras mantidas

Nenhuma alteração em week(), contagem de semanas, fórmula, meta, ponderação, deduplicação, regra de origem ou visual. O início dos dois meses anteriores continua igual. A função anterior permanece disponível e testada. Semanas parciais já eram agrupadas pelos registros existentes e continuam aparecendo sem exigir sete dias e sem introduzir novo selo visual.

Não foi criada alteração de banco nem migração SQL. Os nove SQLs de diagnóstico e o consolidado foram gerados na pasta local diagnostico_corte_outubro, fora do repositório; não precisam ser executados novamente para esta correção. Não é necessário ajuste do backend pelo Anderson.

## Validação

1. Atualizar os arquivos do projeto e abrir cada tela pelo portal. Conferir que os scripts data/app usam a versão periodo-dinamico.
2. Se existir intervalo antigo salvo, clicar Limpar filtros uma vez. A Data inicial mantém a regra existente.
3. No conjunto diagnosticado, Data final será Produção/Incubatório 23/10, Recria 19/10 e Embriodiagnóstico 15/10. Novas cargas podem mudar esses valores, conforme a data do evento, sem edição de código.
4. Conferir S41/S42/S43 conforme existirem nas fontes e pela função vigente. Recria mantém seu eixo por semana de vida, não troca para semana do calendário.
5. Testar Data final manual, datas vazias, meses, semana, fazenda, linhagem e lote; atualizar/reabrir e confirmar que as escolhas foram preservadas.
6. Conferir Última atualização pela maior carga recebida, separadamente da data de evento.

Os testes automatizados cobrem as quatro telas e suas divisões, eventos em outubro, data de carga posterior ao evento, metas futuras fora do limite, semanas parciais, refresh automático, período manual/aberto, sessão legada, filtros, limpeza e persistência. As demais suítes verificam fórmulas, drill, tabelas, origem, temas e responsividade.
