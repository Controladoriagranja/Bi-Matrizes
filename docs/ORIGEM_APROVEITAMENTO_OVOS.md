# Origem e Aproveitamento de ovos - Incubatório

## Escopo

Alteração exclusiva da tela Incubatório. Recria, Produção e Embriodiagnóstico mantêm suas fontes, filtros e cálculos. Arquivos compartilhados e as quatro páginas geradas recebem atualização de versão dos assets; o novo módulo de origem é carregado somente em incubatorio.html.

Entre Semana e Fazenda, Origem dos ovos apresenta Própria e Terceiros como duas flags independentes. Nenhuma marcada mantém todas as linhas, inclusive não classificadas. Uma ou ambas marcadas incluem somente as origens correspondentes. Limpar filtros limpa as flags junto com os demais filtros. A seleção anterior Próprio/Terceiro é migrada para os novos rótulos ao restaurar a sessão.

## Fonte e referência

- Eclosão, descarte e histórico: coluna origem de matrizes.eclosao.
- Nova divisão Aproveitamento: coluna origem de matrizes.inc.
- Incubação e estoque: referência em matrizes.inc por empresa + código numérico da granja + lote, autorizada pelo usuário após diagnóstico SQL.
- O código da granja é extraído do prefixo numérico do campo granja de inc/incubacao. Os nomes e o separador com/sem hífen não determinam a correspondência. Empresa e lote são comparados exatamente após remover espaços externos. Não há correspondência aproximada nem equiparação de empresas ou unidades.
- A referência utiliza todo o histórico de inc carregado, antes dos filtros de período. As datas representam etapas diferentes e não são igualadas. Não é um cadastro com vigência temporal: reutilização histórica de chaves exige revisão da fonte; origens conflitantes já resultam em não classificação.
- Vazio/NULL é ignorado na construção da referência; não recebe uma origem automática. Valores diferentes dos confirmados não são classificados. Mais de uma origem não vazia para a mesma chave também impede classificação.
- O diagnóstico recebido encontrou 796 dos 797 registros de incubação com referência única e um sem correspondência. Os totais são evidência daquele retorno, não constantes no código. O painel calcula e informa as ausências conforme os dados atuais e demais filtros.
- A seleção de origem nunca é ignorada por ausência de valores na fonte auxiliar. Registros sem referência permanecem sem filtro de origem e são excluídos com qualquer flag marcada.

O Incubatório espera as três consultas completas (eclosao, incubacao, inc) antes de apresentar resultados. Se inc falhar, não apresenta um dashboard aparentemente completo com classificação parcial.

## Nova divisão final

1. Aproveitamento de ovos por semana: barras, Semana como padrão, Dia/Semana e drill reutilizado do módulo existente; respeita Até 8 semanas/Mostrar todas. Dados e expandir mantêm a visão ativa.
2. Aproveitamento de ovos por mês: barras por ano-mês, sem misturar anos.
3. Tabela de registros: Recebimento, Semana, Origem dos ovos, Fazenda, Lote, Linhagem, Idade, Total de ovos, Ovos incubáveis e Ovos incubáveis (%). Cabeçalho fixo dentro da tabela, rolagem horizontal/vertical e temas claro/escuro.

Fórmula aprovada: média aritmética de inc.ovos_incubaveis_pct nos registros válidos do agrupamento ativo. Não recalcula pela quantidade de ovos, não pondera e não usa incubavel_pct. NULL é excluído; zero é válido. Os percentuais armazenados já estão na escala 0-100. As fórmulas podem ser abertas nos dois gráficos e na tabela; no gráfico consideram os registros dos períodos efetivamente exibidos.

Todos os filtros existentes da página afetam a nova divisão. A tabela de registros segue os filtros globais; o botão Dados de cada gráfico segue também seu drill e limite de semanas. O filtro Estágio previsto no frontend continua oculto quando não há informação, como antes. Nenhum campo de estágio foi inventado para inc.

## API e orientação para Anderson, se necessário

Não houve alteração de backend, extratores, banco, tabelas ou views. A cópia de referência do backend já expõe consulta genérica de tabelas de Matrizes.

A única fonte adicional solicitada pelo frontend é:

`GET /api/portal/matrizes/dados/inc?pagina=1&tamanho=500`

Usa a mesma autenticação Bearer no Worker e o mesmo contrato já utilizado para eclosao/incubacao: tabela, pagina, tamanho, total, total_paginas e dados. Campos usados: id, empresa_codigo, unidade_codigo, carregado_em, recebimento, origem, granja, lote, linhagem, idade, total, ovos_incubaveis e ovos_incubaveis_pct. Não é necessária uma nova rota de cálculo nem escrita no banco.

Se a versão oficial retornar 403/404 para inc, pedir ao Anderson que confira a liberação/resolução de matrizes.inc na rota genérica existente, preservando a autenticação, a paginação e os endpoints atuais. Não substituir o backend oficial pela cópia de referência. Essa eventual diferença de produção não foi verificada com credenciais reais.

## Validação local

- Testes unitários de referência, isolamento entre empresas/granjas, conflito, ausência e média simples.
- Testes de navegador com API simulada: paginação de inc, filtro em todas as divisões, cascata nos dois sentidos, registro sem referência, persistência/migração de sessão, média diária/semanal/mensal, tabela, fórmulas, drill, Dados, expansão, 8/todas semanas, falha de inc, quatro larguras (320/390/768/1440) e dois temas.
- Regressão dos gráficos semanais existentes e dos cálculos atuais.

Nenhuma consulta ou carga foi executada no banco durante a implementação. Testes locais não substituem validação final na API oficial com uma sessão do portal.
