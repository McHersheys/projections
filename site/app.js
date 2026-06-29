const { PRESETS, CONTROL_GROUPS, projectScenario } = window.AdoptionModel;

const state = {
  scenarioKey: "household_subscription_audit",
  values: clonePreset("household_subscription_audit"),
  series: "active"
};

let projectionChart = null;

const $ = (id) => document.getElementById(id);

function clonePreset(key) {
  return JSON.parse(JSON.stringify(PRESETS[key]));
}

function fmtNumber(value, digits = 1) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function fmtCompact(value, prefix = "") {
  return prefix + Number(value).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 });
}

function fmtMoney(value) {
  return Number(value).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function signedPct(value) {
  const sign = Number(value) > 0 ? "+" : "";
  return `${sign}${pct(value)}`;
}

function fmtAxis(value, series = state.series) {
  if (series.includes("Value")) return fmtCompact(value, "$");
  return fmtCompact(value);
}

function fmtWeekTick(value) {
  const week = Number(value);
  const total = Math.max(1, Math.round(Number(state.values.weeks) || week));
  const interval = Math.max(5, Math.round(total / 5));
  if (week === 1 || week === total) return `W${week}`;
  if (Number.isInteger(week) && week % interval === 0 && week < total - 1) return `W${week}`;
  return "";
}

function setupScenarioSelect() {
  const select = $("scenarioSelect");
  Object.entries(PRESETS).forEach(([key, preset]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = preset.label;
    select.append(option);
  });
  select.value = state.scenarioKey;
  select.addEventListener("change", () => {
    state.scenarioKey = select.value;
    state.values = clonePreset(state.scenarioKey);
    renderControls();
    updateProjection();
  });
  $("resetButton").addEventListener("click", () => {
    state.values = clonePreset(state.scenarioKey);
    renderControls();
    updateProjection();
  });
}

function controlValueLabel(key, value) {
  if (["invite_conversion", "trust_score", "change_authority", "base_churn", "min_churn", "organic_discovery_rate"].includes(key)) {
    return pct(value);
  }
  if (key === "referrals_per_active_per_week") return Number(value).toFixed(3);
  if (key === "network_amplification") return `${Number(value).toFixed(2)}×`;
  if (["base_weekly_value_per_agent", "network_bonus_per_100_agents", "network_bonus_cap", "value_threshold_for_retention"].includes(key)) {
    return fmtMoney(value);
  }
  return fmtNumber(value, Number.isInteger(Number(value)) ? 0 : 1);
}

function renderControls() {
  const form = $("controlForm");
  form.innerHTML = "";
  CONTROL_GROUPS.forEach((group) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "control-group";
    const legend = document.createElement("legend");
    legend.className = "eyebrow";
    legend.textContent = group.title;
    fieldset.append(legend);

    group.controls.forEach(([key, label, min, max, step, help]) => {
      const wrap = document.createElement("div");
      wrap.className = "control";
      const row = document.createElement("div");
      row.className = "control-label-row";
      const labelEl = document.createElement("label");
      const inputId = `control-${key}`;
      labelEl.htmlFor = inputId;
      labelEl.textContent = label;
      const value = document.createElement("span");
      value.className = "control-value";
      value.id = `${inputId}-value`;
      value.textContent = controlValueLabel(key, state.values[key]);
      row.append(labelEl, value);

      const input = document.createElement("input");
      input.type = "range";
      input.id = inputId;
      input.name = key;
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(state.values[key]);
      input.addEventListener("input", () => {
        state.values[key] = Number(input.value);
        value.textContent = controlValueLabel(key, state.values[key]);
        if (key === "min_churn" && state.values.min_churn > state.values.base_churn) {
          state.values.base_churn = state.values.min_churn;
          renderControls();
        } else if (key === "initial_active_agents" && state.values.initial_active_agents >= state.values.addressable_market) {
          state.values.addressable_market = state.values.initial_active_agents + 1;
          renderControls();
        } else {
          updateProjection();
        }
      });

      const helpText = document.createElement("p");
      helpText.className = "control-help";
      helpText.textContent = help;
      wrap.append(row, input, helpText);
      fieldset.append(wrap);
    });
    form.append(fieldset);
  });
}

function verdictClass(verdict) {
  if (verdict === "growth loop") return "";
  if (verdict === "needs support/value proof") return "warn";
  return "bad";
}

function renderMetrics(result) {
  const preset = PRESETS[state.scenarioKey];
  $("projectionTitle").textContent = preset.label;
  $("projectionDescription").textContent = preset.description;
  $("verdictPill").textContent = `${result.verdict} · ${result.curveFamily}`;
  $("verdictPill").className = `verdict-pill ${verdictClass(result.verdict)}`.trim();

  $("metricActive").textContent = fmtNumber(result.last.active, 1);
  $("metricValue").textContent = fmtMoney(result.last.cumulativeValue);
  $("metricWeekValue").textContent = fmtMoney(result.last.weeklyValue);
  $("metricChurn").textContent = signedPct(result.finalNetGrowthRate);

  $("heroVerdict").textContent = result.curveFamily;
  $("heroScenario").textContent = `${preset.label} · ${result.verdict}`;
  $("heroActive").textContent = fmtCompact(result.last.active);
  $("heroValue").textContent = fmtCompact(result.last.cumulativeValue, "$");
  $("heroK").textContent = signedPct(result.finalNetGrowthRate);
}

function seriesConfig(series) {
  const configs = {
    active: {
      label: "Active agents",
      key: "active",
      color: "#65f0d4",
      fill: "rgba(101, 240, 212, 0.18)",
      yTitle: "agents"
    },
    cumulativeValue: {
      label: "Cumulative value",
      key: "cumulativeValue",
      color: "#8ea7ff",
      fill: "rgba(142, 167, 255, 0.18)",
      yTitle: "USD"
    },
    weeklyValue: {
      label: "Weekly value",
      key: "weeklyValue",
      color: "#ffd166",
      fill: "rgba(255, 209, 102, 0.16)",
      yTitle: "USD"
    }
  };
  return configs[series] ?? configs.active;
}

function chartData(points, series) {
  const config = seriesConfig(series);
  return points.map((point) => ({ x: point.week, y: point[config.key] }));
}

function yBounds(points, series) {
  const config = seriesConfig(series);
  const values = points.map((point) => point[config.key]).filter(Number.isFinite);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);

  if (series === "active") {
    const positiveMin = Math.min(...values);
    const spread = Math.max(1, max - positiveMin);
    return {
      min: Math.max(0, positiveMin - spread * 0.10),
      max: max + spread * 0.12
    };
  }

  return {
    min,
    max: max * 1.08
  };
}

function drawLineChart(canvas, points, series) {
  const config = seriesConfig(series);
  const data = chartData(points, series);
  const bounds = yBounds(points, series);

  if (projectionChart) {
    projectionChart.data.datasets[0].label = config.label;
    projectionChart.data.datasets[0].data = data;
    projectionChart.data.datasets[0].borderColor = config.color;
    projectionChart.data.datasets[0].backgroundColor = config.fill;
    projectionChart.options.scales.y.min = bounds.min;
    projectionChart.options.scales.y.max = bounds.max;
    projectionChart.options.scales.x.max = points.length;
    projectionChart.options.scales.y.ticks.callback = (value) => fmtAxis(value, series);
    projectionChart.options.scales.y.title.text = config.yTitle;
    projectionChart.update();
    return;
  }

  const ctx = canvas.getContext("2d");
  projectionChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: config.label,
        data,
        parsing: false,
        borderColor: config.color,
        backgroundColor: config.fill,
        borderWidth: 4,
        tension: 0.38,
        cubicInterpolationMode: "monotone",
        fill: true,
        pointRadius: (context) => {
          const lastIndex = context.chart.data.datasets[0].data.length - 1;
          return context.dataIndex === 0 || context.dataIndex === lastIndex ? 4 : 0;
        },
        pointHoverRadius: 6,
        pointBackgroundColor: "#ecf4ff",
        pointBorderColor: config.color,
        pointBorderWidth: 3,
        pointHitRadius: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 450, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: "rgba(7, 16, 30, 0.96)",
          borderColor: "rgba(159, 189, 255, 0.28)",
          borderWidth: 1,
          titleColor: "#ecf4ff",
          bodyColor: "#ecf4ff",
          padding: 12,
          callbacks: {
            label: (context) => `${config.label}: ${series.includes("Value") ? fmtMoney(context.parsed.y) : fmtNumber(context.parsed.y, 1)}`
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          min: 1,
          max: points.length,
          grid: { color: "rgba(159, 189, 255, 0.08)", drawBorder: false },
          ticks: {
            color: "rgba(170, 184, 207, 0.92)",
            maxTicksLimit: 7,
            precision: 0,
            callback: (value) => fmtWeekTick(value)
          }
        },
        y: {
          beginAtZero: false,
          min: bounds.min,
          max: bounds.max,
          grace: "14%",
          grid: { color: "rgba(159, 189, 255, 0.16)", drawBorder: false },
          title: { display: true, text: config.yTitle, color: "rgba(170, 184, 207, 0.78)" },
          ticks: {
            color: "rgba(170, 184, 207, 0.92)",
            maxTicksLimit: 6,
            callback: (value) => fmtAxis(value, series)
          }
        }
      }
    }
  });
}

function updateChartCaption(result) {
  const seriesNames = {
    active: "Active agents",
    cumulativeValue: "Cumulative value",
    weeklyValue: "Weekly value"
  };
  $("chartCaption").textContent = `${seriesNames[state.series]} over ${state.values.weeks} weeks · ${result.curveFamily}. First net week: ${signedPct(result.firstNetGrowthRate)}; final net week: ${signedPct(result.finalNetGrowthRate)}; final churn: ${pct(result.last.churn)}.`;
}

function updateProjection() {
  const result = projectScenario(state.values);
  renderMetrics(result);
  drawLineChart($("projectionChart"), result.points, state.series);
  updateChartCaption(result);
  renderComparison();
}

function renderComparison() {
  const body = $("comparisonBody");
  body.innerHTML = "";
  Object.entries(PRESETS).forEach(([key, preset]) => {
    const result = projectScenario(preset);
    const row = document.createElement("tr");
    const readClass = result.verdict === "growth loop" ? "read-good" : result.verdict === "needs support/value proof" ? "read-warn" : "read-bad";
    row.innerHTML = `
      <td data-label="Scenario">${preset.label}</td>
      <td data-label="Curve">${result.curveFamily}</td>
      <td data-label="Agents">${fmtNumber(result.last.active, 1)}</td>
      <td data-label="First net/wk">${signedPct(result.firstNetGrowthRate)}</td>
      <td data-label="Final net/wk">${signedPct(result.finalNetGrowthRate)}</td>
      <td data-label="Value">${fmtMoney(result.last.cumulativeValue)}</td>
      <td data-label="Read" class="${readClass}">${result.verdict}</td>
    `;
    if (key === state.scenarioKey) row.setAttribute("aria-current", "true");
    body.append(row);
  });
}

function setupTabs() {
  document.querySelectorAll(".chart-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".chart-tab").forEach((b) => b.classList.remove("is-active"));
      button.classList.add("is-active");
      state.series = button.dataset.series;
      updateProjection();
    });
  });
}

setupScenarioSelect();
renderControls();
setupTabs();
updateProjection();
