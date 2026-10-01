# BI Zootécnico — GitHub + Cloudflare + PostgreSQL

Base preparada em 01/10/2026 para evoluir o BI Zootécnico mantendo o frontend estático no GitHub Pages e os dados fora do GitHub.

## Arquitetura

```text
GitHub Pages (HTML/CSS/JS público)
        |
        v
Cloudflare Worker
https://api-bi-granja.controladoriagb05.workers.dev
        |
        v
API Zootécnico interna (FastAPI, somente leitura)
        |
        v
PostgreSQL
```

O navegador **não lê Parquet**, não recebe senha do PostgreSQL e não possui caminho de rede da empresa.

## O que já está preparado

- `index.html`: frontend do projeto **desenvolvimento local**, agora apontando para a API da Cloudflare.
- `detalhes.html`: usa `/api/bi/zootecnico/detalhes`.
- `formulas.html`: catálogo de fórmulas fica estático no frontend e não exige endpoint extra.
- `assets/js/config.js`: URL do Worker e mapa central de endpoints.
- `assets/js/api.js`: cliente HTTP com suporte ao token do Portal BI em `sessionStorage`.
- `api/`: cópia pública e sem credenciais do backend necessário para a integração.
- `docs/TABELAS_POSTGRESQL.md`: estrutura de tabelas fornecida para esta etapa.
- `docs/tabelas-postgresql.json`: a mesma estrutura em JSON para facilitar automações futuras.
- `referencia-frontend-local/`: telas de Lotes, Histórico e Diferença de Aves preservadas como referência para a próxima etapa.

## Endpoints já previstos no frontend

### Desempenho

- `/api/bi/zootecnico/filtros`
- `/api/bi/zootecnico/resumo`
- `/api/bi/zootecnico/detalhes`

### Próximas telas

- `/api/bi/lotes-abertos/filtros`
- `/api/bi/lotes-abertos/resumo`
- `/api/bi/lotes-abertos/detalhes`
- `/api/bi/historico-fechados/filtros`
- `/api/bi/historico-fechados/resumo`
- `/api/bi/historico-fechados/detalhes`
- `/api/bi/rxp/filtros`
- `/api/bi/rxp/resumo`
- `/api/bi/rxp/detalhes`

Essas rotas já estão declaradas em `api/bi_generic/registry.py`. As telas correspondentes ainda não foram ativadas no menu porque os indicadores e o layout final serão definidos na próxima etapa.

## Publicar o frontend no GitHub Pages

1. Crie um repositório público no GitHub.
2. Envie o conteúdo desta pasta para a branch `main`.
3. No GitHub, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione `main` e `/ (root)`.
6. Salve.

Não envie `.env`, senhas, dumps, Parquets ou arquivos com dados da empresa.

## Configuração do Worker

A URL usada pela cópia `api db` fornecida é:

```text
https://api-bi-granja.controladoriagb05.workers.dev
```

Ela está em `assets/js/config.js`. Se mudar no futuro, altere somente esse arquivo.

O frontend usa por padrão o token de sessão do Portal BI salvo como `granjabi_auth_token`. Nenhum token é salvo no repositório.

O código-fonte do Worker não estava nos arquivos recebidos nesta etapa; este projeto mantém o contrato do Worker já usado pelo pacote **api db**.

## API interna

A pasta `api/` é a cópia que deve ser comparada com o serviço real antes do deploy.

Variáveis necessárias no servidor:

```text
PGHOST
PGDATABASE
PGUSER
PGPASSWORD
API_BASIC_USERS
CORS_ORIGINS
```

Use `api/.env.example` apenas como modelo. O `.env` real deve permanecer fora do Git.

### Ajuste feito no catálogo de Matrizes

O módulo Matrizes pode usar estes esquemas:

- `matrizes`
- `bd_classif`
- `bd_aproveit`
- `bd_incubacao`
- `bd_eclosao`
- `bd_embrio`

A rota `/api/portal/matrizes/dados/{tabela}` agora procura a tabela no esquema correto. Isso evita o problema da versão anterior, que listava tabelas auxiliares mas tentava consultá-las como se todas fossem `matrizes.<tabela>`.

Também foi adicionado:

```text
GET /api/portal/catalogo-esperado
```

Essa rota somente verifica se as tabelas previstas estão presentes; não cria e não altera estrutura.

## Próxima etapa

Quando forem definidos os dados e o visual de cada tela, a evolução recomendada é:

1. escolher as tabelas/colunas que entram em cada indicador;
2. definir regras de negócio e fórmulas;
3. acrescentar ou ajustar a configuração no `api/bi_generic/registry.py`;
4. fazer a API devolver somente o agregado necessário;
5. ligar o resultado ao frontend;
6. validar os números contra PostgreSQL/Excel/Power BI antes de publicar.

