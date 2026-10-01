(() => {
    "use strict";

    const RECRIA_ENDPOINT = APP_CONFIG.endpoints.recriaDados || "/api/portal/matrizes/dados/acerto_produtor_recria";
    const PAGE_SIZE = 500;
    const MAX_PAGES = 12; // camada temporária de leitura; agregações finais serão movidas para a API conforme a regra do Excel.

    const MONTHS = [
        [1, "Jan"], [2, "Fev"], [3, "Mar"], [4, "Abr"], [5, "Mai"], [6, "Jun"],
        [7, "Jul"], [8, "Ago"], [9, "Set"], [10, "Out"], [11, "Nov"], [12, "Dez"]
    ];

    const state = {
        rows: [],
        sexo: "femeas",
        ano: "",
        meses: new Set(),
        fazenda: "",
        lotes: new Set(),
        status: new Set(),
        linhagem: new Set(),
        idades: new Set(),
        inicio: "",
        fim: "",
        period: "year",
        charts: {},
    };

    const $ = id => document.getElementById(id);

    function text(value) {
        return value === null || value === undefined ? "" : String(value).trim();
    }

    function num(value) {
        if (value === null || value === undefined || value === "") return null;
        if (typeof value === "number") return Number.isFinite(value) ? value : null;
        const normalized = String(value).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function dateValue(row) {
        return row.ini_semana || row.cab_data_alojamento || null;
    }

    function parseDate(value) {
        if (!value) return null;
        const d = new Date(`${String(value).slice(0,10)}T12:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function weekAge(row) {
        return num(row.ida_sem ?? row.cab_idade);
    }

    function unique(rows, getter, numeric = false) {
        const values = [...new Set(rows.map(getter).filter(v => v !== null && v !== undefined && text(v) !== "").map(v => numeric ? Number(v) : text(v)))];
        return values.sort(numeric ? ((a,b) => a-b) : ((a,b) => String(a).localeCompare(String(b), "pt-BR", {numeric:true})));
    }

    function avg(values) {
        const valid = values.map(num).filter(v => v !== null);
        return valid.length ? valid.reduce((a,b) => a+b, 0) / valid.length : null;
    }

    function formatPct(value, digits = 2) {
        return value === null ? "—" : `${value.toLocaleString("pt-BR", {minimumFractionDigits: digits, maximumFractionDigits: digits})}%`;
    }

    function normalizeWeightKg(value) {
        if (value === null) return null;
        return Math.abs(value) > 50 ? value / 1000 : value;
    }

    function formatWeight(value) {
        if (value === null) return "—";
        const kg = normalizeWeightKg(value);
        return `${kg.toLocaleString("pt-BR", {minimumFractionDigits: 3, maximumFractionDigits: 3})} kg`;
    }

    function weightToGrams(value) {
        if (value === null) return null;
        return Math.abs(value) > 50 ? value : value * 1000;
    }

    function formatGad(value) {
        return value === null ? "—" : `${value.toLocaleString("pt-BR", {minimumFractionDigits: 1, maximumFractionDigits: 1})} g`;
    }

    function setApiState(kind, label) {
        const el = $("apiState");
        el.classList.remove("ok", "error");
        if (kind) el.classList.add(kind);
        $("apiStateText").textContent = label;
    }

    function showError(message) {
        const el = $("mensagemErro");
        el.textContent = message;
        el.classList.remove("hidden");
    }

    function clearError() { $("mensagemErro").classList.add("hidden"); }

    function showInfo(message) {
        const el = $("mensagemInfo");
        el.textContent = message;
        el.classList.remove("hidden");
    }

    function toast(message) {
        const el = document.createElement("div");
        el.className = "mz-toast";
        el.textContent = message;
        $("toastStack").appendChild(el);
        setTimeout(() => el.remove(), 2800);
    }

    function createButton(value, label, active = false) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.value = String(value);
        button.textContent = label;
        button.classList.toggle("active", active);
        return button;
    }

    function renderMonths() {
        const host = $("filtroMeses");
        host.innerHTML = "";
        MONTHS.forEach(([value,label]) => {
            const btn = createButton(value, label, state.meses.has(value));
            btn.addEventListener("click", () => {
                state.meses.has(value) ? state.meses.delete(value) : state.meses.add(value);
                state.period = "custom-filter";
                syncPeriodButtons();
                renderAll();
            });
            host.appendChild(btn);
        });
        $("mesResumo").textContent = state.meses.size ? `${state.meses.size} sel.` : "Todos";
    }

    function populateSelect(id, values, selected, allLabel) {
        const select = $(id);
        select.innerHTML = `<option value="">${allLabel}</option>` + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
        select.value = values.includes(selected) ? selected : "";
    }

    function escapeHtml(value) {
        return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
    }

    function renderChoiceGrid(id, values, selectedSet, options = {}) {
        const host = $(id);
        const query = options.query ? options.query.toLocaleLowerCase("pt-BR") : "";
        host.innerHTML = "";
        values.filter(v => !query || String(v).toLocaleLowerCase("pt-BR").includes(query)).forEach(v => {
            const btn = createButton(v, options.label ? options.label(v) : String(v), selectedSet.has(String(v)));
            btn.addEventListener("click", () => {
                const key = String(v);
                selectedSet.has(key) ? selectedSet.delete(key) : selectedSet.add(key);
                renderAll();
            });
            host.appendChild(btn);
        });
        if (!host.children.length) {
            const empty = document.createElement("span");
            empty.style.cssText = "grid-column:1/-1;color:var(--mz-muted);font-size:9px;padding:4px";
            empty.textContent = "Sem opções";
            host.appendChild(empty);
        }
    }

    function baseRowsForOptions() {
        return state.rows;
    }

    function renderFilterOptions() {
        const rows = baseRowsForOptions();
        const years = unique(rows, r => parseDate(dateValue(r))?.getFullYear(), true).filter(Boolean).map(String);
        const farms = unique(rows, r => r.cab_granja || r.cab_empresa_descricao || r.cab_unidade_descricao);
        const lots = unique(rows, r => r.cab_lote);
        const statuses = unique(rows, r => r.status || r.situacao);
        const lineages = unique(rows, r => r.cab_linhagem);
        const ages = unique(rows, weekAge, true).filter(v => v !== null).map(String);

        populateSelect("filtroAno", years, state.ano, "Todos");
        populateSelect("filtroFazenda", farms, state.fazenda, "Todas");
        renderMonths();
        renderChoiceGrid("filtroLotes", lots, state.lotes, {query: $("buscaLote").value});
        renderChoiceGrid("filtroStatus", statuses, state.status);
        renderChoiceGrid("filtroLinhagem", lineages, state.linhagem);
        renderChoiceGrid("filtroIdade", ages, state.idades);
        $("loteResumo").textContent = state.lotes.size ? `${state.lotes.size} sel.` : "Todos";
    }

    function rowMatches(row) {
        const d = parseDate(dateValue(row));
        const y = d?.getFullYear();
        const m = d ? d.getMonth() + 1 : null;
        const farm = text(row.cab_granja || row.cab_empresa_descricao || row.cab_unidade_descricao);
        const lot = text(row.cab_lote);
        const status = text(row.status || row.situacao);
        const lineage = text(row.cab_linhagem);
        const age = weekAge(row);

        if (state.ano && String(y) !== state.ano) return false;
        if (state.meses.size && !state.meses.has(m)) return false;
        if (state.fazenda && farm !== state.fazenda) return false;
        if (state.lotes.size && !state.lotes.has(lot)) return false;
        if (state.status.size && !state.status.has(status)) return false;
        if (state.linhagem.size && !state.linhagem.has(lineage)) return false;
        if (state.idades.size && !state.idades.has(String(age))) return false;
        if (state.inicio && (!d || d < parseDate(state.inicio))) return false;
        if (state.fim && (!d || d > parseDate(state.fim))) return false;
        return true;
    }

    function filteredRows() { return state.rows.filter(rowMatches); }

    function sexFields() {
        return state.sexo === "machos" ? {
            viability: "viab_mac", viabilityStd: "std_viab_mac",
            weight: "ps_medio_machos", weightStd: "ps_medio_std_machos",
            uniformity: "unif_machos", uniformityStd: "unif_std_machos", cv: "cv_machos"
        } : {
            viability: "viab_fem", viabilityStd: "std_viab_fem",
            weight: "ps_medio_femeas", weightStd: "ps_medio_std_femeas",
            uniformity: "unif_femeas", uniformityStd: "unif_std_femeas", cv: "cv_femeas"
        };
    }

    function aggregateByAge(rows) {
        const f = sexFields();
        const groups = new Map();
        rows.forEach(row => {
            const age = weekAge(row);
            if (age === null) return;
            if (!groups.has(age)) groups.set(age, []);
            groups.get(age).push(row);
        });

        const points = [...groups.entries()].sort((a,b) => a[0]-b[0]).map(([age, items]) => ({
            age,
            viability: avg(items.map(r => r[f.viability])),
            viabilityStd: avg(items.map(r => r[f.viabilityStd])),
            weight: avg(items.map(r => r[f.weight])),
            weightStd: avg(items.map(r => r[f.weightStd])),
            uniformity: avg(items.map(r => r[f.uniformity])),
            uniformityStd: avg(items.map(r => r[f.uniformityStd])),
            cv: avg(items.map(r => r[f.cv]))
        }));

        points.forEach((p, i) => {
            p.viabilityDiff = p.viability !== null && p.viabilityStd !== null ? p.viability - p.viabilityStd : null;
            p.weightDiffPct = p.weight !== null && p.weightStd ? ((p.weight / p.weightStd) - 1) * 100 : null;
            if (i === 0) { p.gad = null; p.gadStd = null; }
            else {
                const previous = points[i-1];
                const deltaWeeks = Math.max(1, p.age - previous.age);
                const currentG = weightToGrams(p.weight), prevG = weightToGrams(previous.weight);
                const currentStdG = weightToGrams(p.weightStd), prevStdG = weightToGrams(previous.weightStd);
                p.gad = currentG !== null && prevG !== null ? (currentG - prevG) / (7 * deltaWeeks) : null;
                p.gadStd = currentStdG !== null && prevStdG !== null ? (currentStdG - prevStdG) / (7 * deltaWeeks) : null;
            }
        });
        return points;
    }

    function chartColors() {
        const dark = document.documentElement.dataset.theme !== "light";
        return {
            text: dark ? "#c0b5b2" : "#6f6366",
            grid: dark ? "rgba(229,216,206,.10)" : "rgba(116,93,86,.12)",
            primary: dark ? "#d72d4c" : "#8b1128",
            primary2: dark ? "#ea4865" : "#a31a33",
            orange: "#ff8a2a",
            blue: "#2f80ed",
            gray: dark ? "#b7adb0" : "#4d5059",
            green: "#21b86a",
            red: "#e0334e",
            tooltipBg: dark ? "rgba(28,26,29,.97)" : "rgba(255,255,255,.98)",
            tooltipText: dark ? "#f6f2ee" : "#231d22",
            tooltipBorder: dark ? "#4a434a" : "#e6ddd3"
        };
    }

    function baseOption() {
        const c = chartColors();
        return {
            animationDuration: 450,
            textStyle: {fontFamily: "Geist, Inter, sans-serif", color: c.text, fontSize: 9},
            tooltip: {trigger: "axis", backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, textStyle: {color: c.tooltipText, fontSize: 10}, extraCssText: "box-shadow:0 12px 32px rgba(39,31,28,.14);border-radius:10px"},
            legend: {top: 3, right: 8, textStyle: {color: c.text, fontSize: 9}, itemWidth: 12, itemHeight: 7},
            grid: {left: 48, right: 44, top: 46, bottom: 38},
            xAxis: {type: "category", axisLine: {lineStyle: {color: c.grid}}, axisTick: {show:false}, axisLabel: {color:c.text,fontSize:9}, splitLine:{show:false}, name:"Semana de vida", nameLocation:"middle", nameGap:25, nameTextStyle:{color:c.text,fontSize:9}},
            yAxis: {type:"value", axisLine:{show:false}, axisTick:{show:false}, axisLabel:{color:c.text,fontSize:9}, splitLine:{lineStyle:{color:c.grid}}}
        };
    }

    function chart(id) {
        if (!state.charts[id]) state.charts[id] = echarts.init($(id));
        return state.charts[id];
    }

    function renderCharts(points) {
        const ages = points.map(p => p.age);
        const c = chartColors();

        chart("chartViabilidade").setOption({
            ...baseOption(),
            xAxis: {...baseOption().xAxis, data: ages},
            yAxis: [
                {...baseOption().yAxis, min: value => Math.max(0, Math.floor((value.min - .5) * 10) / 10), max: value => Math.ceil((value.max + .5) * 10) / 10, axisLabel:{color:c.text,fontSize:9,formatter:"{value}%"}},
                {...baseOption().yAxis, splitLine:{show:false}, position:"right", axisLabel:{color:c.text,fontSize:9,formatter:"{value} pp"}}
            ],
            series: [
                {name:"% Viabilidade", type:"bar", barMaxWidth:16, itemStyle:{color:c.primary,borderRadius:[3,3,0,0]}, data:points.map(p=>p.viability)},
                {name:"% STD", type:"bar", barMaxWidth:16, itemStyle:{color:c.orange,borderRadius:[3,3,0,0]}, data:points.map(p=>p.viabilityStd)},
                {name:"% Dif.", type:"line", yAxisIndex:1, symbolSize:5, lineStyle:{width:2,color:c.gray}, itemStyle:{color:c.gray}, data:points.map(p=>p.viabilityDiff)}
            ]
        }, true);

        chart("chartUniformidade").setOption({
            ...baseOption(),
            xAxis: {...baseOption().xAxis, data: ages},
            yAxis: [
                {...baseOption().yAxis, min:0, max:100, axisLabel:{color:c.text,fontSize:9,formatter:"{value}%"}},
                {...baseOption().yAxis, position:"right", splitLine:{show:false}, axisLabel:{color:c.text,fontSize:9,formatter:"{value}%"}}
            ],
            series: [
                {name:"% Uniformidade", type:"line", symbolSize:6, smooth:.15, lineStyle:{width:2,color:c.blue}, itemStyle:{color:c.blue}, data:points.map(p=>p.uniformity)},
                {name:"% STD Unif.", type:"line", symbol:"none", lineStyle:{width:1.5,type:"dashed",color:c.orange}, data:points.map(p=>p.uniformityStd)},
                {name:"CV", type:"line", yAxisIndex:1, symbolSize:5, lineStyle:{width:2,color:c.gray}, itemStyle:{color:c.gray}, data:points.map(p=>p.cv)}
            ]
        }, true);

        const weightsKg = points.map(p=>normalizeWeightKg(p.weight));
        const weightsStdKg = points.map(p=>normalizeWeightKg(p.weightStd));
        chart("chartPeso").setOption({
            ...baseOption(),
            xAxis: {...baseOption().xAxis, data: ages},
            yAxis: [
                {...baseOption().yAxis, min:0, axisLabel:{color:c.text,fontSize:9,formatter:v=>v.toLocaleString("pt-BR",{maximumFractionDigits:1})}},
                {...baseOption().yAxis, position:"right", splitLine:{show:false}, axisLabel:{color:c.text,fontSize:9,formatter:"{value}%"}}
            ],
            series: [
                {name:"Peso médio", type:"bar", barMaxWidth:17, itemStyle:{color:c.primary,borderRadius:[3,3,0,0]}, data:weightsKg},
                {name:"STD", type:"bar", barMaxWidth:17, itemStyle:{color:c.orange,borderRadius:[3,3,0,0]}, data:weightsStdKg},
                {name:"% Dif.", type:"line", yAxisIndex:1, symbolSize:5, lineStyle:{width:2,color:c.gray}, itemStyle:{color:c.gray}, data:points.map(p=>p.weightDiffPct)}
            ]
        }, true);

        chart("chartGad").setOption({
            ...baseOption(),
            xAxis: {...baseOption().xAxis, data: ages},
            yAxis: {...baseOption().yAxis, min:0, axisLabel:{color:c.text,fontSize:9,formatter:"{value}g"}},
            series: [
                {name:"GAD", type:"bar", barMaxWidth:18, itemStyle:{color:c.primary,borderRadius:[3,3,0,0]}, label:{show:true,position:"top",color:c.text,fontSize:8,formatter:p=>p.value==null?"":Number(p.value).toFixed(0)}, data:points.map(p=>p.gad)},
                {name:"STD", type:"bar", barMaxWidth:18, itemStyle:{color:c.orange,borderRadius:[3,3,0,0]}, data:points.map(p=>p.gadStd)}
            ]
        }, true);
    }

    function setDiff(id, actual, std, suffix = "pp", invert = false) {
        const el = $(id);
        el.classList.remove("good", "bad");
        if (actual === null || std === null) { el.textContent = "Sem comparação"; return; }
        const diff = actual - std;
        const good = invert ? diff <= 0 : diff >= 0;
        el.classList.add(good ? "good" : "bad");
        const sign = diff >= 0 ? "+" : "";
        el.textContent = `${diff >= 0 ? "↑" : "↓"} ${sign}${diff.toLocaleString("pt-BR", {minimumFractionDigits:2,maximumFractionDigits:2})} ${suffix}`;
    }

    function renderKpis(points) {
        const last = [...points].reverse().find(p => [p.viability,p.weight,p.uniformity,p.gad].some(v => v !== null));
        if (!last) {
            ["kpiViabilidade","kpiPeso","kpiUniformidade","kpiGad"].forEach(id => $(id).textContent = "—");
            return;
        }
        $("kpiViabilidade").textContent = formatPct(last.viability);
        $("kpiViabilidadeStd").textContent = `STD ${formatPct(last.viabilityStd)}`;
        setDiff("kpiViabilidadeDiff", last.viability, last.viabilityStd);

        $("kpiPeso").textContent = formatWeight(last.weight);
        $("kpiPesoStd").textContent = `STD ${formatWeight(last.weightStd)}`;
        const w = normalizeWeightKg(last.weight), ws = normalizeWeightKg(last.weightStd);
        setDiff("kpiPesoDiff", w, ws, "kg");

        $("kpiUniformidade").textContent = formatPct(last.uniformity);
        $("kpiUniformidadeStd").textContent = `STD ${formatPct(last.uniformityStd)}`;
        setDiff("kpiUniformidadeDiff", last.uniformity, last.uniformityStd);

        $("kpiGad").textContent = formatGad(last.gad);
        $("kpiGadStd").textContent = `STD ${formatGad(last.gadStd)}`;
        setDiff("kpiGadDiff", last.gad, last.gadStd, "g");

        $("contextViabilidade").textContent = `Semana ${last.age}`;
        $("contextPeso").textContent = `Semana ${last.age}`;
    }

    function renderAll() {
        renderFilterOptions();
        const rows = filteredRows();
        const points = aggregateByAge(rows);
        renderKpis(points);
        renderCharts(points);
        $("registrosCarregados").textContent = `${rows.length.toLocaleString("pt-BR")} registros no filtro`;
        syncSexButtons();
        renderMonths();
    }

    function syncSexButtons() {
        $("filtroSexo").querySelectorAll("button").forEach(btn => btn.classList.toggle("active", btn.dataset.value === state.sexo));
    }

    function syncPeriodButtons() {
        $("periodoRapido").querySelectorAll("button").forEach(btn => btn.classList.toggle("active", btn.dataset.period === state.period));
    }

    function isoDate(d) {
        const pad = v => String(v).padStart(2,"0");
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    }

    function setQuickPeriod(period) {
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let start = null;
        state.period = period;
        state.ano = "";
        state.meses.clear();

        if (period === "today") start = new Date(end);
        else if (["7","15","30","90"].includes(period)) { start = new Date(end); start.setDate(start.getDate() - Number(period) + 1); }
        else if (period === "year") start = new Date(end.getFullYear(), 0, 1);
        else if (period === "12m") { start = new Date(end); start.setFullYear(start.getFullYear() - 1); start.setDate(start.getDate() + 1); }
        else if (period === "all") { start = null; }

        state.inicio = start ? isoDate(start) : "";
        state.fim = period === "all" ? "" : isoDate(end);
        $("dataInicio").value = state.inicio;
        $("dataFim").value = state.fim;
        syncPeriodButtons();
        renderAll();
    }

    function resetFilters() {
        state.ano = ""; state.meses.clear(); state.fazenda = ""; state.lotes.clear(); state.status.clear(); state.linhagem.clear(); state.idades.clear(); state.sexo = "femeas";
        $("buscaLote").value = "";
        setQuickPeriod("year");
    }

    async function loadRows() {
        clearError();
        setApiState("", "Conectando");
        try {
            const first = await apiGet(RECRIA_ENDPOINT, {pagina: 1, tamanho: PAGE_SIZE});
            let rows = Array.isArray(first.dados) ? first.dados : [];
            const totalPages = Number(first.total_paginas || 1);

            if (totalPages > 1) {
                const startPage = Math.max(2, totalPages - MAX_PAGES + 1);
                const pages = [];
                for (let page = startPage; page <= totalPages; page++) pages.push(page);
                const batches = await Promise.all(pages.map(page => apiGet(RECRIA_ENDPOINT, {pagina: page, tamanho: PAGE_SIZE})));
                rows = (startPage === 2 ? rows : []).concat(...batches.map(r => r.dados || []));
                if (totalPages > MAX_PAGES) showInfo(`Prévia carregada com os registros mais recentes. A versão final receberá agregações próprias da API para consultar todo o histórico sem sobrecarregar o navegador.`);
            }

            state.rows = rows;
            const latest = rows.map(r => parseDate(r.carregado_em || dateValue(r))).filter(Boolean).sort((a,b)=>b-a)[0];
            $("ultimaAtualizacao").textContent = latest ? latest.toLocaleString("pt-BR", {dateStyle:"short",timeStyle:"short"}) : "API conectada";
            setApiState("ok", "API online");
            setQuickPeriod("year");
        } catch (error) {
            console.error(error);
            setApiState("error", "Sem dados");
            showError(error.message || "Não foi possível carregar a base de Recria.");
            state.rows = [];
            renderFilterOptions();
            renderCharts([]);
        }
    }

    function bindEvents() {
        $("filtroAno").addEventListener("change", e => { state.ano = e.target.value; state.period = "custom-filter"; syncPeriodButtons(); renderAll(); });
        $("filtroFazenda").addEventListener("change", e => { state.fazenda = e.target.value; renderAll(); });
        $("filtroSexo").addEventListener("click", e => { const btn = e.target.closest("button[data-value]"); if (!btn) return; state.sexo = btn.dataset.value; renderAll(); });
        $("buscaLote").addEventListener("input", renderFilterOptions);
        $("limparFiltros").addEventListener("click", resetFilters);
        $("limparFiltrosBottom").addEventListener("click", resetFilters);
        $("periodoRapido").addEventListener("click", e => { const btn = e.target.closest("button[data-period]"); if (btn) setQuickPeriod(btn.dataset.period); });
        $("dataInicio").addEventListener("change", e => { state.inicio = e.target.value; state.period = "custom-filter"; syncPeriodButtons(); renderAll(); });
        $("dataFim").addEventListener("change", e => { state.fim = e.target.value; state.period = "custom-filter"; syncPeriodButtons(); renderAll(); });
        document.querySelectorAll("[data-soon]").forEach(btn => btn.addEventListener("click", () => toast(`${btn.dataset.soon}: vamos construir esta tela na próxima etapa.`)));
        document.addEventListener("dashboard:theme-changed", () => {
            Object.values(state.charts).forEach(c => c.dispose());
            state.charts = {};
            renderCharts(aggregateByAge(filteredRows()));
        });
        window.addEventListener("resize", () => Object.values(state.charts).forEach(c => c.resize()));
    }

    bindEvents();
    renderMonths();
    loadRows();
})();
