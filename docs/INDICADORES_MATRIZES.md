# Indicadores de Matrizes

As quatro telas (Recria, Produção, Incubatório e Embriodiagnóstico) consultam o Worker da CENTRAL, enviando `Authorization: Bearer` com o token de `sessionStorage.granjabi_auth_token`. Os sete prints são seções dessas telas. Nenhuma credencial Basic é incluída no frontend. As rotas são `/api/portal/matrizes/dados/{tabela}`, com `pagina` e `tamanho`, conforme as respostas fornecidas.

Todas as páginas são lidas antes de apresentar indicadores. Mudanças de total durante a consulta, páginas repetidas ou uma quantidade final diferente do total geram erro e impedem cálculo com base parcial. Não há importação automática da planilha, dados de demonstração nem uso do cache dos prints em produção.

## Regras implementadas — aguardam conferência das medidas do Excel

O usuário informou em 05/10/2026 que vai conferir as regras de cálculo. A implementação abaixo é a proposta de consolidação; ainda não foi reconciliada com as medidas das tabelas dinâmicas do XLSB.

| Indicador | Fonte | Consolidação |
| --- | --- | --- |
| Viabilidade | acerto_produtor_recria | Média de `viab_fem` / `viab_mac` ponderada pelas aves alojadas `cab_femeas` / `cab_macho`; STD pelo mesmo peso |
| Peso, uniformidade, CV | acerto_produtor_recria | Média das medições ponderada pelo saldo de aves do sexo escolhido; peso em gramas, uniformidade/CV em % |
| GAD | acerto_produtor_recria | Por lote/galpão/lado, diferença entre pesagens positivas consecutivas dividida pelos dias entre as datas; depois ponderada pelo saldo de aves. A pesagem anterior é procurada no histórico completo, mesmo fora do filtro de datas |
| Produção semanal e diária | granja | `100 × soma(ovos_produzidos) / soma(saldo_femeas)`. Em registros diários, a soma dos saldos representa aves-dia. STD `prod_std_pct` ponderado pelos mesmos saldos |
| Curva por lote | acerto_produtor_producao | `producao` e `producao_std` ponderados por `saldo_femea`, agrupados por idade. O percentual do relatório já considera o intervalo do movimento. Para um mesmo lote/galpão, preferir registros diários quando presentes, evitando misturar diário e semanal |
| Aproveitamento na granja | granja | `100 × soma(incubaveis_granja) / soma(ovos_produzidos)`; perdas = 100 − aproveitamento |
| STD aproveitamento | granja | `aprov_std_pct` ponderado pelos ovos produzidos; conferir se esse STD se refere ao aproveitamento na granja ou no incubatório |
| Ovos de cama e categorias de perdas | granja | `100 × soma(quantidade da categoria) / soma(ovos_produzidos)`; categorias do print: trincado, vazado, sujo, duas_gemas, deformado, pequeno. `sujoni` não é somado automaticamente a sujo: confirmar a relação entre esses campos |
| Eclosão semanal, mensal, anual e por idade | eclosao | `100 × soma(nascidos) / soma(quantid)`; `eclosao_std` ponderado por `quantid` |
| Descarte de pintos | eclosao | `100 × soma(descarte) / soma(nascidos)`, consistente com `coluna_4` no exemplo recebido |
| Faixas etárias | eclosao | Até 35 semanas; 36–50; a partir de 51. Cada faixa usa suas próprias quantidades |
| Incubação | incubacao | Soma de `quantidade` por semana de `data_incubacao`; `perdidos` não é descontado sem confirmação da regra |
| Estoque mínimo / máximo | incubacao | Extremos dos dias explícitos em `dias_estoque`, incluindo listas como `04-03-02-` |
| Estoque médio | incubacao | Ponderado por `quantidade` apenas se cada linha do grupo trouxer um único dia de estoque. Indisponível quando há múltiplos dias ou dias ausentes, pois não existe a quantidade por dia |
| Não eclodidos / eclosão | embrio | Quantidades `nao_eclodidos` / `nascidos`, divididas por `incubados` |
| Infertilidade | embrio | `100 × soma(qtde) / soma(total_analisado)`; STD `std` ponderado pela amostra |
| Mortalidade inicial / intermediária / final | embrio | `qtde_2` / `qtde_3` / `qtde_4` divididas por `total_analisado`; STD `std_2` / `std_3` / `std_4` ponderados pela mesma amostra |
| Trincados incubadora / transferência | embrio | `qtde_7` / `qtde_8` divididas por `total_analisado` |
| Contaminados | embrio | `(qtde_9 + qtde_10) / total_analisado × 100`, bacterianos + fúngicos; STD `std_9 + std_10`, ponderado pela amostra |

Diferenças de produção, viabilidade e eclosão são apresentadas em pontos percentuais. Diferença de peso é percentual relativo ao STD. Denominadores zero/ausentes geram ausência de medição, não zero. Em pesagem, uniformidade e CV, o zero dos exemplos é tratado como ausência de medição. Os zeros das contagens são mantidos como quantidades válidas.

Datas brasileiras com dois ou quatro dígitos de ano e datas ISO são aceitas. Semanas usam calendário ISO e incluem o ano no agrupamento. Confirmar se a reunião semanal utiliza outro calendário. Datas da incubação e da eclosão são filtradas pela etapa de cada tela, não pelas datas de extração da carga.

## Identidade e cargas

Acerto: última carga para a mesma empresa/unidade/fazenda/lote/galpão/lado/data/sexo/granularidade. Demais fontes: eliminar apenas fatos exatamente iguais desconsiderando metadados de carga. Sem identificador de remessa/batelada, não é seguro tratar fatos com quantidades diferentes como atualização da mesma linha. Confirmar como a API substitui cargas que se sobrepõem.

Para compartilhar os filtros de Produção, o lote do Acerto no formato numérico `399.08P` é exibido como lote `399`, mantendo o galpão em campo próprio. Galpões numéricos `08` e `8` usam a mesma chave. A identidade original do relatório é preservada no registro bruto e no controle de cargas. Lotes alfanuméricos como `PL3306-26` não são alterados.

Linhas sem data real, sem lote ou com lote Total/Subtotal não entram nos indicadores. Os totais de registros exibidos são os detalhes válidos após esse tratamento; o carregamento completo é verificado antes de excluir linhas.

## Pendências em standby

- Conferência das medidas com o Excel, incluindo ponderação de Recria, limites das faixas etárias e calendário de semanas.
- Meta de descarte e meta de incubação: não existem nas respostas fornecidas. Permanecem sem linha de meta até configurar valores confirmados em `assets/js/matrizes-settings.js`.
- Estágio da incubadora e origem nas fontes sem esses campos: são filtros opcionais. As telas mostram somente os filtros com dados disponíveis. Não inferir a origem pelo prefixo do lote nem o estágio pelo número da máquina. Há pontos de extensão para cadastros explícitos nas configurações.
- Distribuição de ovos por dia de estoque para calcular a média onde `dias_estoque` contém listas.
- Relatório de Monitoria Sanitária: aparece no menu da planilha, mas não há print próprio nem tabela correspondente nas sete respostas. Não foi criado um relatório com dados presumidos.
- Acesso autenticado real ao Worker para validar resposta completa, permissões e comportamento em produção. A sessão da CENTRAL não estava disponível aos testes; testes de integração usam respostas simuladas com o mesmo contrato e os exemplos fornecidos.
- O botão de enviados/recebidos usa `granja.incubaveis_granja` pela data de produção e `inc.total` pela data de recebimento. Isso compara etapas distintas e não calcula divergência de remessas. Exige chave de envio/recebimento e cadastro comum de lotes/fazendas para conciliação exata.

## Aparência e publicação

`assets/css/zootecnico-base.css` é uma cópia integral da folha de estilos do projeto irmão `bi-zootecnico` em 05/10/2026. `assets/css/matrizes.css` define os componentes específicos sobre as mesmas variáveis. A fonte local é Geist Variable; chave de tema: `bi-zootecnico-theme`.

Entradas ativas: `index.html`, `producao.html`, `incubatorio.html`, `embrio.html`. As seções de curvas, idade/histórico e incubação/estoque estão reunidas nas telas principais. Os três endereços antigos redirecionam para essas seções. Os arquivos antigos de diagnóstico/detalhes/fórmulas e as cópias antigas dentro de `assets/` não fazem parte da navegação nova. Publicar a raiz do projeto; não publicar `assets/` como raiz.

O gráfico anual consulta todos os períodos mantendo as dimensões selecionadas; os demais gráficos usam o período dos filtros. Em incubação/estoque, dimensões ausentes na tabela `incubacao` (como origem ou linhagem sem cadastro) não são aplicadas e essa limitação é informada no cabeçalho do gráfico quando o filtro é selecionado.

Validação local: `node --test tests/matrizes-data.test.cjs`; verificação de integração/layout: `node tests/matrizes-browser.mjs` com Playwright instalado. Os exemplos reais são lidos dos anexos locais somente para testes e não são incluídos no site.
