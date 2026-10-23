# Lotes nos cards e busca compartilhada dos filtros

## Busca: causa e correção

O evento input já estava ligado. O JavaScript definia label.hidden conforme a busca, mas a regra CSS .mz-options label com display:flex prevalecia sobre o estilo padrão do atributo hidden. As opções ficavam ocultas no estado do DOM e na seleção em massa, mas continuavam desenhadas. A comparação anterior também convertia apenas maiúsculas/minúsculas, sem remover acentos. Durante reconstruções dos filtros, o texto era recuperado, mas o foco do campo de pesquisa não era restaurado.

matrizes-filter-search.js centraliza a normalização e os eventos para todos os dropdowns. A normalização remove acentos, ignora caixa e procura o termo em qualquer trecho do texto exibido. A regra CSS agora faz hidden prevalecer sobre display:flex. O campo, o botão X e Nenhum resultado usam o mesmo componente. O texto e o cursor/foco são preservados nas reconstruções por carga ou filtros.

As opções continuam sendo produzidas pelo contexto de filtros existente, antes da busca textual. Pesquisar não altera as marcações, nem amplia o conjunto disponível na cascata. Selecionar tudo já atuava somente nas opções visíveis segundo hidden; esse comportamento foi preservado, agora com ocultação visual efetiva. Seleções fora da pesquisa não são desmarcadas por essa ação. Limpar a pesquisa restaura todas as opções do contexto, não todos os dados do banco.

Cobertura do componente: Ano, Semana, Fazenda, Linhagem, Lote, Galpão, Idade, Situação atual e, quando disponíveis como dropdowns, Origem e Estágio da incubadora. Todos os dropdowns recebem busca, mesmo quando têm poucas opções. Meses, Sexo, datas e as duas flags de Origem dos ovos de Incubatório não são dropdowns e mantêm seus controles.

No telefone, o campo usa fonte de 16 px, cabeçalho de pesquisa fixo dentro da lista, opções com alvo mínimo de 44 px e rolagem até o campo ao focar. A altura das opções acompanha a área visível. Os testes simulam larguras e alturas de navegador; não substituem uma verificação com teclado físico/virtual de cada modelo de telefone.

## Cards que receberam Dia | Semana | Lote

| Tela | Card | Indicador por lote | Meta e sentido | Quantidade contextual |
|---|---|---|---|---|
| Produção | Produção semanal | production de MatrizesData.production | productionStd, ponderado por saldo_femeas; maior é melhor | Soma de ovos_produzidos |
| Produção | Aproveitamento na granja | use de MatrizesData.production | useStd, ponderado por ovos_produzidos; maior é melhor | Soma de ovos_produzidos |
| Incubatório | Eclosão semanal | hatch de MatrizesData.hatch | hatchStd, ponderado por quantid; maior é melhor | Soma de quantid |
| Incubatório | Descarte de pintos | discard de MatrizesData.hatch | Sem meta configurada por lote; menor é melhor | Soma de quantid |
| Incubatório | Aproveitamento de ovos por semana | eggUse, média simples aprovada de ovos_incubaveis_pct | Sem meta na fonte; maior é melhor | Soma de total |

O componente matrizes-lot-list.js recebe a função de cálculo do próprio card, chamada sobre os registros do lote no período. Não faz média de percentuais quando o gráfico usa razão de somas ou ponderação. Não lê um percentual aproximado de outra tabela. O Aproveitamento de ovos continua usando a média simples já aprovada. Nenhuma fórmula, meta ou regra semanal de MatrizesData foi alterada.

Os campos e a granularidade foram conferidos no código e no inventário/amostras já fornecidos do banco: granja tem lote e as colunas de referência por registro, eclosao tem lote/quantid/nascidos/eclosao_std/descarte e inc tem lote/total/ovos_incubaveis_pct. Não foi necessário SQL novo ou mudança de backend.

## Cards que ficaram de fora

- Ovos de cama: a meta usada pelo gráfico é mensal, de matrizes.metas. O usuário autorizou deixar sem Lote até definir a comparação de metas quando o período atravessa meses.
- Perdas da produção: seis indicadores de perdas; falta escolher qual indicador ou organização por grupos a lista mostrará. Não foi criada uma perda total alternativa.
- Eclosão por faixa etária: três séries de faixas; aguarda definição de uma única faixa/indicador ou organização em grupos. Não foi substituído por uma eclosão geral por presunção.
- Incubação e Dias em estoque: mostram quantidade e dias, não percentuais; o usuário pediu não mostrar Lote nesses dois cards.
- Cards mensais, anuais, diários e por idade não tinham Dia/Semana e estão fora do escopo solicitado. Recria e Embriodiagnóstico também não recebem Lote neste pedido; a busca foi corrigida nas duas telas.

## Escopo, ordenação e estados

A lista usa somente os registros permitidos pelos filtros globais e pelas mesmas semanas visíveis do card: até oito ou todas. Se houver drill de uma semana, usa somente seus dias. O topo informa a semana/ano quando única; nos demais casos, informa o período selecionado e o número de semanas disponíveis. Nenhuma data é retirada do rótulo da semana para reconstruir eventos.

O agrupamento inclui empresa, unidade, fazenda e lote. Números de lote iguais em fazendas/empresas diferentes não são misturados. A apresentação mostra uma linha por grupo, com lote, fazenda, quantidade de ovos, percentual, diferença em pontos percentuais e apoio visual fino. No telefone, cada linha mostra somente lote, percentual e bolinha quando houver meta. A fazenda continua disponível ao usar os filtros e é preservada no agrupamento, mesmo estando visualmente oculta nessa linha compacta.

Com meta, os piores desvios aparecem primeiro: maior é melhor para produção/aproveitamento/eclosão, menor é melhor para descarte. Igualdade é verde. Diferença é valor menos meta, explicitada por texto no desktop. Sem meta, não existe bolinha/diferença inventada e o pior valor orienta a ordem. Se só parte dos lotes tiver meta, os comparáveis por meta aparecem primeiro; os demais seguem pelo pior valor. Ausência de medição fica ao fim. A barra de apoio é limitada visualmente a 0–100, sem alterar o percentual exibido.

São apresentados dez lotes por vez; Mostrar mais acrescenta dez, sem nova consulta. Mudar o conjunto/período reinicia a lista pelos piores. Tema ou ampliação não mudam os valores. Enquanto carrega a fonte, a lista informa Carregando lotes; há estados de vazio e de falha. A lista é rolável verticalmente no card e não cria rolagem lateral no telefone.

## Preservação do gráfico

Lote é um estado de apresentação separado de mode/drilledWeek. Dia e Semana conservam a navegação. Clicar a barra continua abrindo seus dias. Ao sair da lista, o gráfico é redesenhado com as mesmas séries/eixos/cores e restaura o drill e o zoom quando o conjunto de pontos é o mesmo. Se um filtro remover a semana em drill, aplica-se a invalidação já existente. O botão Dados fica oculto enquanto a lista está ativa e retorna com seu estado anterior no gráfico; expandir funciona também para a lista.

## Arquivos envolvidos

- assets/js/matrizes-app.js: integração dos componentes, filtros e escopo do card.
- assets/js/matrizes-pages.js: cinco cards habilitados explicitamente.
- assets/js/matrizes-period-drill.js: terceira opção com preservação do estado gráfico.
- assets/js/matrizes-lot-list.js: componente compartilhado novo.
- assets/js/matrizes-filter-search.js: componente compartilhado novo.
- assets/css/matrizes.css: ocultação correta, pesquisa e lista responsiva.
- scripts/build-pages.mjs e index.html, producao.html, incubatorio.html, embrio.html: scripts e versões dos assets.
- tests/matrizes-lot-list.test.cjs, tests/matrizes-lotes-busca.browser.cjs e tests/matrizes-browser.mjs.
- Esta documentação e INDICADORES_MATRIZES.md.

## Como validar

1. Abrir as quatro telas e pesquisar sao jose numa opção São José, variando caixa e usando partes do nome. As opções não correspondentes devem desaparecer.
2. Marcar um item, pesquisar outro texto, selecionar/desmarcar tudo e limpar com X. A marcação fora da busca deve permanecer. Verificar Nenhum resultado e cascata com Fazenda/Linhagem/Lote.
3. Nos cinco cards, escolher Lote: verificar ordem, cores quando houver meta e Mostrar mais. Escolher uma semana e repetir; comparar até oito e todas as semanas.
4. Abrir dias por clique na semana, escolher Lote e retornar a Dia. Conferir os mesmos dias, valores e estado anterior. Repetir com zoom e expansão.
5. Testar telefone/tablet/PC e os dois temas. No telefone, a linha da lista deve manter lote/percentual/bolinha, sem tabela larga ou rolagem lateral.

Os testes usam API simulada e dados sintéticos, incluindo pesos desiguais, lotes iguais em duas fazendas, registros fora das oito semanas e casos sem meta. A API/banco não receberam escritas.
