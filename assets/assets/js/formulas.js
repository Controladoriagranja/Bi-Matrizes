/**
 * MAPA DE FÓRMULAS: ./FORMULAS.md
 * Monta a página de catálogos; não calcula indicadores.
 */
FormulaUI.render(document.getElementById("formulaContainer"), BI_METRIC_ORDER.map(id => METRICAS[id]), "formula-desempenho");
FormulaUI.render(document.getElementById("formulaLotesContainer"), FORMULAS_LOTES, "formula-lotes");

FormulaUI.render(
    document.getElementById("formulaRxpContainer"),
    window.FORMULAS_RXP || [],
    "rxp"
);

FormulaUI.render(document.getElementById("formulaHistoricoContainer"), HISTORICO_CALCULOS.formulas, "formula-historico");
