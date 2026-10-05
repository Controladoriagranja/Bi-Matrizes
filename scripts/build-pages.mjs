import fs from 'node:fs';
import vm from 'node:vm';
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/js/matrizes-pages.js','utf8'),context);
for(const [id,page] of Object.entries(context.MatrizesPages)) {
  fs.writeFileSync(page.file,`<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="BI Matrizes — ${page.subtitle}">
  <link rel="icon" href="assets/img/favicon-granja.png">
  <title>BI Matrizes | ${page.title}</title>
  <script>
    try { const theme = localStorage.getItem('bi-zootecnico-theme'); document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light'; } catch (_) {}
  </script>
  <link rel="stylesheet" href="assets/vendor/geist/index.css">
  <link rel="stylesheet" href="assets/css/zootecnico-base.css?v=20261005-recria1a22">
  <link rel="stylesheet" href="assets/css/matrizes.css?v=20261005-recria1a22">
</head>
<body class="matrizes-page" data-page="${id}">
  <div id="matrizesApp"></div>
  <noscript>Ative o JavaScript para consultar os indicadores de Matrizes.</noscript>
  <script src="assets/vendor/echarts/echarts.min.js"></script>
  <script src="assets/js/config.js?v=20261005-recria1a22"></script>
  <script src="assets/js/api.js?v=20261005-recria1a22"></script>
  <script src="assets/js/theme.js?v=20261005-recria1a22"></script>
  <script src="assets/js/matrizes-settings.js?v=20261005-recria1a22"></script>
  <script src="assets/js/matrizes-data.js?v=20261005-recria1a22"></script>
  <script src="assets/js/matrizes-pages.js?v=20261005-recria1a22"></script>
  <script src="assets/js/matrizes-sidebar.js?v=20261005-recria1a22-sidebar"></script>
  <script src="assets/js/matrizes-app.js?v=20261005-recria1a22"></script>
</body>
</html>
`,'utf8');
}
const redirects={'producao-curvas.html':'producao.html#card-diaria','incubatorio-historico.html':'incubatorio.html#card-etaria','incubacao.html':'incubatorio.html#card-incubacao'};
for(const [file,target] of Object.entries(redirects))fs.writeFileSync(file,`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>BI Matrizes</title><meta http-equiv="refresh" content="0;url=${target}"></head><body><a href="${target}">Abrir relatório</a></body></html>\n`,'utf8');
console.log('Geradas as quatro telas de Matrizes e redirecionamentos das seções anteriores.');
