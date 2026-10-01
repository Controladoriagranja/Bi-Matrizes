(() => {
    const show = (id, value) => {
        document.getElementById(id).textContent =
            typeof value === "string" ? value : JSON.stringify(value, null, 2);
    };

    show("configApi", APP_CONFIG.API_URL);

    Promise.allSettled([
        apiGet(APP_CONFIG.endpoints.health),
        apiGet("/api/portal/catalogo-esperado")
    ]).then(([health, catalogo]) => {
        show("health", health.status === "fulfilled" ? health.value : health.reason?.message || String(health.reason));
        show("catalogo", catalogo.status === "fulfilled" ? catalogo.value : catalogo.reason?.message || String(catalogo.reason));
    });
})();
