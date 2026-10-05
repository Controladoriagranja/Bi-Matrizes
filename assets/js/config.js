/**
 * Configuração pública do frontend.
 *
 * IMPORTANTE:
 * - Não coloque senha, token fixo ou credencial do PostgreSQL neste arquivo.
 * - O GitHub Pages conversa somente com o Worker da Cloudflare.
 * - O token do Portal BI, quando usado, vem do sessionStorage do navegador.
 */
const APP_CONFIG = {
    mode: "api-cloudflare",

    API_URL: "https://api-bi-granja.controladoriagb05.workers.dev",

    auth: {
        mode: "portal-token", // "portal-token" ou "none"
        storageKey: "granjabi_auth_token",
        required: true
    },

    endpoints: {
        health: "/api/zootecnico/health",
        portalModulos: "/api/portal/modulos",
        recriaDados: "/api/portal/matrizes/dados/acerto_produtor_recria",
        matrizesDados: "/api/portal/matrizes/dados/",

        // Dashboard principal
        filtros: "/api/bi/zootecnico/filtros",
        desempenho: "/api/bi/zootecnico/resumo",
        detalhes: "/api/bi/zootecnico/detalhes",

        // Rotas já previstas na API para as próximas telas.
        lotesFiltros: "/api/bi/lotes-abertos/filtros",
        lotesResumo: "/api/bi/lotes-abertos/resumo",
        lotesDetalhes: "/api/bi/lotes-abertos/detalhes",

        historicoFiltros: "/api/bi/historico-fechados/filtros",
        historicoResumo: "/api/bi/historico-fechados/resumo",
        historicoDetalhes: "/api/bi/historico-fechados/detalhes",

        rxpFiltros: "/api/bi/rxp/filtros",
        rxpResumo: "/api/bi/rxp/resumo",
        rxpDetalhes: "/api/bi/rxp/detalhes"
    }
};
