# Migração da reunião semanal para o portal

Referência: `Reunião Semanal - Matrizes e Incubatório.xlsb` e os sete prints de indicadores enviados em 05/10/2026. A imagem do catálogo é a referência da origem dos dados, não uma oitava tela de indicadores.

## Seções das quatro telas principais

Os sete prints de indicadores são seções de Recria, Produção, Incubatório e Embriodiagnóstico, conforme confirmação do usuário. O menu lateral alterna entre essas quatro telas.

| Tela | Gráficos | Abas de origem verificadas no XLSB |
| --- | --- | --- |
| Recria | Viabilidade; uniformidade e CV; peso; GAD | G.Reu.Viab_R; G.Reu.CV_R; G.Reu.GAD_R; G.Reu.Peso_R |
| Produção — resumo | Produção semanal; aproveitamento na granja; ovos de cama; perdas da produção | G.Reu.Prod_P; G.Reu.Aprov_P; G.Reu.Cama_P; G.Reu.Perdas_P |
| Produção — curvas | Produção por dia; curva de produção por lote | G.Reu.Prod.Dia_P; G.Reu.CurvaProd._P |
| Incubatório — eclosão | Eclosão e descarte semanal; eclosão e descarte mensal | G.Reu.Eclo._I; G.Reu.Descarte_I; G.Reu.Eclo.Mes_I; G.Reu.Descarte.Mes_I |
| Incubatório — idade e histórico | Eclosão por faixa etária; eclosões anuais; eclosão por idade | G.Reu.Eclo.Etaria_I; G.Reu.Eclo.Ano_I; G.Reu.Eclo.Idade_I |
| Incubatório — incubação e estoque | Incubação; dias em estoque do ovo incubado | G.Reu.Incubacao_I; G.Reu.EstoqueMedio_I |
| Embriodiagnóstico | Não eclodidos; infertilidade; contaminados; trincados na incubadora e transferência; mortalidade inicial, intermediária e final | G.Reu.Não Eclodidos; G.Reu.Infertil._I; G.Reu.Cont._I; G.Reu.Emb.Trinc; G.Reu.M.Inicial; G.Reu.M.Média; G.Reu.M.Final |

Os nomes das abas de peso e GAD parecem invertidos: o gráfico de peso referencia `G.Reu.GAD_R`, e o de GAD referencia `G.Reu.Peso_R`. Preservar a associação verificada pelos gráficos ao investigar as fórmulas.

Monitoria Sanitária aparece no menu dos prints, mas não foi enviado um print específico dessa tela. O arquivo tem um gráfico chamado “Qualidade de Pintos de 1 dia”, associado a `G.Reu.Monitoria Sanitaria_I`; o escopo dessa tela ainda precisa ser definido.

## Filtros observados

- Recria: ano, mês, fazenda, sexo, lote, situação atual, linhagem e idade em semanas.
- Produção: ano, mês, semana, fazenda, lote, galpão, linhagem e idade. A curva por lote tem filtros próprios de lote, fazenda e linhagem no print.
- Eclosão: ano e mês da eclosão, semana, estágio da incubadora, origem, fazenda, lote, linhagem e data da eclosão.
- Incubação: ano e mês da incubação, semana, estágio da incubadora, origem e data da incubação.
- Embriodiagnóstico: ano, mês, semana, origem, estágio da incubadora, fazenda, lote, linhagem e data.

## Padrão visual

Herdar fonte Geist, variáveis CSS, cores, componentes e comportamento de tema do projeto irmão `bi-zootecnico`. A planilha define a organização dos indicadores e séries; o projeto irmão define a aparência do HTML.

## Integração e pendências

Atualização: as estruturas e exemplos das sete tabelas foram recebidos e utilizados na implementação das quatro telas. As regras propostas, validação local e pendências em standby estão em [INDICADORES_MATRIZES.md](INDICADORES_MATRIZES.md).

A API interna é `http://192.168.1.193:8010/`. As consultas anônimas à raiz e a `/openapi.json` retornaram HTTP 401. O usuário confirmou o fluxo: CENTRAL autentica o usuário; o frontend lê `sessionStorage.getItem("granjabi_auth_token")` e envia Bearer ao Worker `https://api-bi-granja.controladoriagb05.workers.dev`; o Worker valida a sessão e adiciona Basic internamente antes de consultar a FastAPI. Manter esse fluxo. Não usar Basic no navegador nem exigir OpenAPI público. A rota de Recria existente é `/api/portal/matrizes/dados/acerto_produtor_recria`.

O catálogo no print contém `acerto_produtor_producao`, `acerto_produtor_recria`, `eclosao`, `embrio`, `granja`, `inc` e `incubacao`. Os nomes, isoladamente, não confirmam quais colunas nem quais denominadores usar para cada indicador.

Para concluir a conferência em produção, falta:

1. Validar a integração com a sessão real da CENTRAL. O contrato das sete tabelas já foi recebido; nenhum navegador conectado com sessão da CENTRAL estava disponível nesta análise.
2. Rastrear as medidas das tabelas dinâmicas: numeradores, denominadores, ponderação, STD por idade/linhagem/sexo e metas.
3. Validar um mesmo lote e período no Excel e na API antes de considerar a integração concluída.

Os valores armazenados no cache dos gráficos são referências de conferência, não uma fonte de atualização do portal. Não substituir dados indisponíveis por zero, não calcular percentuais consolidados pela média simples sem confirmar a regra e não limitar silenciosamente a leitura às últimas páginas.
