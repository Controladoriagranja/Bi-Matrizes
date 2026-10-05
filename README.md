# BI Matrizes e Incubatório

Portal HTML/CSS/JavaScript com quatro telas baseadas na reunião semanal de Matrizes e Incubatório. Os sete prints de gráficos são organizados em seções dessas telas. Fonte, variáveis de cores, tema e menu lateral herdados do projeto irmão `bi-zootecnico`.

| Tela | Arquivo | Fonte principal |
| --- | --- | --- |
| Recria | index.html | acerto_produtor_recria |
| Produção: resumo e curvas | producao.html | granja + acerto_produtor_producao |
| Incubatório: eclosão, idade, histórico, incubação e estoque | incubatorio.html | eclosao + incubacao; comparação complementar com granja + inc |
| Embriodiagnóstico | embrio.html | embrio |

## Dados e autenticação

CENTRAL → login → token Bearer da sessão → Cloudflare Worker → validação da sessão → Basic interno → FastAPI → PostgreSQL.

O frontend usa `https://api-bi-granja.controladoriagb05.workers.dev` e lê o token em `sessionStorage.getItem("granjabi_auth_token")`. A URL da FastAPI interna não é chamada pelo navegador. Não colocar usuário, senha ou token fixo no código.

As rotas `/api/portal/matrizes/dados/{tabela}` seguem o contrato dos exemplos fornecidos: `dados`, `tabela`, `total`, `pagina`, `tamanho` e `total_paginas`. O cliente percorre todas as páginas e recusa uma consulta incompleta. Uma sessão válida da CENTRAL deve estar disponível na origem do frontend, conforme o fluxo atual do Portal.

## Interface e cálculos

- Menu lateral com o mesmo componente do bi-zootecnico, alternando entre Recria, Produção de ovos, Incubatório e Embriodiagnóstico.
- Filtros de ano, mês, semana, período e dimensões disponíveis em cada fonte; contexto compartilhado dentro do módulo.
- Tema claro/escuro com a mesma chave `bi-zootecnico-theme`.
- Gráficos ECharts locais, ampliação e tabelas dos valores agregados.
- Layout para desktop e celular; indicadores indisponíveis aparecem como `—`.

Consulte [as regras e pendências dos indicadores](docs/INDICADORES_MATRIZES.md) e [o mapeamento dos prints para o Excel](docs/MAPEAMENTO_MATRIZES.md). A ponderação proposta ainda aguarda a conferência do usuário com as medidas do Excel. Metas sem fonte e média de estoque sem distribuição de ovos permanecem indisponíveis.

## Desenvolvimento e verificação

O projeto é estático; não há etapa de instalação para executar o frontend. Para servir a raiz localmente, por exemplo:

```text
python -m http.server 8080 --bind 127.0.0.1
```

Sem uma sessão da CENTRAL nessa origem, a tela informa que o login é necessário. Nenhum dado de teste é carregado pelo site.

```text
node --test tests/matrizes-data.test.cjs
node tests/matrizes-browser.mjs
```

O teste de navegador requer Playwright e Chromium/Chrome. Opcionalmente, `PLAYWRIGHT_MODULE` aponta para a instalação do Playwright e `CHROME_EXECUTABLE` para o navegador. O teste usa uma sessão e API simuladas exclusivamente em um navegador isolado. Para verificar os sete exemplos fornecidos, passar os sete caminhos de JSON ao teste, na ordem: produção, recria, eclosao, embrio, granja, inc, incubacao. Os dados dos anexos não são copiados para o frontend.

Capturas de QA ficam em `artifacts/qa/`, ignoradas pelo Git porque podem conter dados dos exemplos. `scripts/build-pages.mjs` regenera os quatro HTMLs e redireciona os antigos endereços das seções para as telas correspondentes.

## Publicação

Publicar a raiz do repositório, com `assets/` como pasta de recursos, conforme [README_DEPLOY.md](README_DEPLOY.md). A implementação desta etapa não foi publicada. Validar a sessão e as consultas completas no Worker real antes de considerar os números reconciliados em produção.

Os arquivos antigos de detalhes, diagnóstico e fórmulas, `referencia-frontend-local/` e cópias antigas em `assets/` foram preservados como referência e não integram a navegação atual.
