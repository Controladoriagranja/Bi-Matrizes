# Publicação do BI Matrizes

Frontend estático. Publicar a raiz deste projeto no GitHub Pages ou no ambiente atual do Portal BI; não selecionar `assets/` como raiz.

Entradas: `index.html` (Recria), `producao.html`, `incubatorio.html`, `embrio.html`. Curvas de produção, histórico de eclosão e incubação/estoque são seções dessas telas, acessíveis pelo mesmo menu lateral. Os endereços antigos dessas seções redirecionam para a tela correspondente.

O destino da API permanece o Worker configurado em `assets/js/config.js`. A CENTRAL deve disponibilizar `granjabi_auth_token` no `sessionStorage` da origem do frontend. Não incluir Basic Auth, `.env`, credenciais PostgreSQL, anexos ou capturas de teste no site publicado.

Antes da publicação, conferir as [pendências de cálculo e integração](docs/INDICADORES_MATRIZES.md). Nenhuma publicação foi executada nesta etapa.
