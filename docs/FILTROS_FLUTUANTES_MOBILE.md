# Filtros flutuantes — celulares e tablets

Implementação nas quatro telas ativas: Recria (`index.html`), Produção de Ovos,
Incubatório e Embriodiagnóstico. Os endereços antigos das seções continuam
redirecionando para essas telas. Os arquivos antigos preservados como referência
não integram a navegação atual e não foram modificados.

## Referência e escopo

Foram lidos `assets/js/mobile-filters.js`, `assets/css/mobile-filters.css` e a
integração de `assets/js/filters.js` do repositório irmão `bi-zootecnico`, somente
como referência. A cápsula de 152 × 56 px, margem inferior de 16 px mais área
segura, painel com margem lateral de 12 px, cabeçalho de 56 px, altura
intermediária de 64%, três posições, arraste e transição de 260 ms com
`cubic-bezier(.22,.7,.25,1)` foram portados. Não há limite fixo de 760 px.

A pedido do usuário, tablets também recebem o painel: largura até 1024 px e,
em dispositivos com ponteiro de toque (`pointer: coarse`), até 1366 px, incluindo
orientação horizontal. Acima dessa faixa, os controles voltam ao layout atual.
Navegador e PWA usam a mesma regra; não depende de `display-mode` nem altera
manifesto, service worker ou publicação do portal.

Só a integração foi adaptada ao controlador de Matrizes. Os controles existentes
`#filterFields` e `#clearFilters` são movidos e retornam aos locais de origem,
sem duplicação de IDs, filtros ou estado aplicado. A ordem, pesquisa, marcações,
origem dos ovos, sexo, meses, datas e dependências existentes são preservados.

## Estado e aplicação

- No modo móvel, mudanças atualizam um rascunho e apenas os controles/cascata.
  Gráficos, tabelas e sessionStorage continuam refletindo o contexto aplicado.
- A cascata reutiliza `matches`, `reconcileFilters` e `renderFilters` existentes.
  Como os dados já são carregados integralmente, não há nova consulta ao mudar
  nem ao aplicar filtros.
- Aplicar confirma o contexto, chama a renderização existente uma vez, salva pela
  rotina atual e recolhe o painel. Aplicações simultâneas ficam bloqueadas; erros
  mantêm o painel aberto e permitem tentar novamente.
- Limpar altera só o rascunho e reativa o período automático, seguindo a rotina
  existente. Aplicar confirma a limpeza. A regra atual de sexo não foi alterada.
- Recolher/reabrir preserva o rascunho e os textos de busca. O rascunho é local à
  tela aberta; somente o contexto aplicado é persistido, como antes.
- Ao voltar ao desktop, um rascunho pendente é aplicado uma única vez. No desktop,
  as seleções continuam atualizando o relatório imediatamente.
- O contador conta critérios, não a quantidade de itens selecionados: conjuntos
  não vazios, sexo diferente do padrão e datas diferentes do período padrão.
- A regra de remoção de dimensões indisponíveis após concluir a carga é a mesma
  para o contexto aplicado e o rascunho.

## Gestos, acessibilidade e altura útil

O arraste só pode começar no cabeçalho e acompanha o ponteiro via
requestAnimationFrame, no máximo uma atualização por quadro. O acompanhamento
continua se um movimento rápido sair do cabeçalho antes da captura. A rolagem
normal dos filtros fica separada do gesto. Não se bloqueia a rolagem do relatório.

Setas para cima/baixo e Home/End alternam as alturas. Escape fecha primeiro uma
lista aberta e depois o painel. Conteúdo recolhido usa `inert`; menu, fórmulas,
diálogos e gráficos ampliados ocultam e desativam o painel. `aria-expanded` e
`aria-controls` acompanham o estado. `prefers-reduced-motion` desativa transições.

VisualViewport reajusta altura e posição ao teclado virtual, e a área segura
inferior também é descontada da altura máxima para manter o painel na tela.
Cabeçalho e rodapé ficam acessíveis com rolagem interna. Listas abrem dentro do
painel; pesquisa e controles têm áreas adequadas para toque.

## Arquivos

- `assets/js/mobile-filters.js` — componente compartilhado adaptado da referência.
- `assets/css/mobile-filters.css` — aparência da referência e integração Matrizes.
- `assets/js/matrizes-app.js` — rascunho, aplicar, limpar e adaptação do Escape.
- `scripts/build-pages.mjs` — recursos compartilhados e viewport-fit nas telas.
- `index.html`, `producao.html`, `incubatorio.html`, `embrio.html` — recursos novos.
- `tests/matrizes-mobile-filters.browser.cjs` — testes do painel e integração.
- `tests/matrizes-browser.mjs`, `tests/matrizes-period-drill.browser.cjs`,
  `tests/matrizes-lotes-busca.browser.cjs` — regressões adaptadas à nova navegação
  dos filtros, preservando as verificações existentes dos gráficos.
- `docs/FILTROS_FLUTUANTES_MOBILE.md` — este documento.

Nenhum cálculo, fórmula, meta, dado, regra de semana, consulta, endpoint ou
backend foi alterado. Nenhum SQL é necessário. Sem pastas de backup e sem deploy.

## Validação

Testes automatizados de navegador usam Chrome headless com dados/API simulados,
sem credenciais nem chamadas à API real:

```text
node --test tests/*.test.cjs
node tests/matrizes-mobile-filters.browser.cjs
node tests/matrizes-default-period.browser.cjs
node tests/matrizes-period-drill.browser.cjs
node tests/matrizes-lotes-busca.browser.cjs
node tests/matrizes-browser.mjs
node tests/matrizes-browser.mjs --filters-only
```

O teste novo verifica as quatro telas: rascunho sem mudar gráfico/KPIs/sessão,
busca sem acento, selecionar tudo visível, cascata, meses, origem, aplicar/limpar,
preservação ao recolher, mesmas posições dos controles ao voltar ao PC, aplicação
única e ausência de novas requisições. Verifica também arraste com mouse e
eventos de toque no Chrome, teclado, rolagem, menu/fórmulas/ampliação, falha com
nova tentativa, bloqueio de clique repetido, 320/390/768/1024 px, tablet de toque
1366 px, temas, movimento reduzido e simulações de área segura/teclado/PWA.

Capturas ficam em `artifacts/mobile-filters/`, somente na cópia de trabalho.
Não houve teste em telefone ou tablet físico, nem em PWA realmente instalado.
O comportamento do teclado nativo, da barra do navegador e da instalação do PWA
deve ser conferido em aparelho real. Não há afirmação de FPS em dispositivo.

Para conferir após publicar: abrir cada tela no telefone e tablet, tocar Filtros,
marcar um lote e observar que o relatório só muda ao Aplicar; limpar e aplicar;
buscar parte de um nome; arrastar para cima/baixo; abrir menu/fórmula; girar o
aparelho; conferir o mesmo fluxo no PWA. No PC, confirmar a barra lateral e a
atualização imediata anteriores.
