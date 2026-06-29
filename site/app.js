const PRESETS = {
  household_subscription_audit: {
    label: "Household subscription audit",
    description: "Low-social-friction household value: subscriptions, bills, renegotiation, tariff switching, and obvious value receipts.",
    initial_active_agents: 100,
    weeks: 16,
    referrals_per_active_per_week: 0.12,
    invite_conversion: 0.24,
    trust_score: 0.82,
    change_authority: 1.00,
    base_churn: 0.040,
    min_churn: 0.016,
    base_weekly_value_per_agent: 8.0,
    network_bonus_per_100_agents: 0.25,
    network_bonus_cap: 5.0,
    value_threshold_for_retention: 10.0
  },
  neighbor_bulk_buy_unlock: {
    label: "Neighbor bulk-buy unlock",
    description: "Local cooperation with high visible savings and high resistance: agent-brokered terms, peer density, guarantees, and awkward-detail handling.",
    initial_active_agents: 100,
    weeks: 16,
    referrals_per_active_per_week: 0.22,
    invite_conversion: 0.30,
    trust_score: 0.80,
    change_authority: 1.00,
    base_churn: 0.032,
    min_churn: 0.012,
    base_weekly_value_per_agent: 9.0,
    network_bonus_per_100_agents: 1.40,
    network_bonus_cap: 18.0,
    value_threshold_for_retention: 10.0
  },
  personal_to_work_agent_bridge: {
    label: "Personal → work agent bridge",
    description: "The home agent proves value, then suggests a work-safe companion for the same principal while respecting clearance boundaries.",
    initial_active_agents: 100,
    weeks: 16,
    referrals_per_active_per_week: 0.16,
    invite_conversion: 0.23,
    trust_score: 0.74,
    change_authority: 0.72,
    base_churn: 0.038,
    min_churn: 0.015,
    base_weekly_value_per_agent: 10.0,
    network_bonus_per_100_agents: 0.70,
    network_bonus_cap: 10.0,
    value_threshold_for_retention: 12.0
  },
  top_down_corporate_rollout: {
    label: "Top-down corporate rollout",
    description: "More seats, but lower change authority: staff may use the agent on the immediate problem while upstream process remains fixed.",
    initial_active_agents: 100,
    weeks: 16,
    referrals_per_active_per_week: 0.08,
    invite_conversion: 0.18,
    trust_score: 0.68,
    change_authority: 0.38,
    base_churn: 0.060,
    min_churn: 0.026,
    base_weekly_value_per_agent: 6.0,
    network_bonus_per_100_agents: 0.15,
    network_bonus_cap: 3.0,
    value_threshold_for_retention: 14.0
  }
};

const CONTROL_GROUPS = [
  {
    title: "Adoption",
    controls: [
      ["initial_active_agents", "Initial active agents", 1, 1000, 1, "Starting active agents."],
      ["weeks", "Projection weeks", 4, 104, 1, "How many weekly steps to simulate."],
      ["referrals_per_active_per_week", "Referrals per active / week", 0, 0.6, 0.005, "Invitation pressure from each active agent."],
      ["invite_conversion", "Invite conversion", 0, 1, 0.005, "Share of invites becoming active agents."],
      ["trust_score", "Trust score", 0, 1, 0.005, "Legal, social, privacy, and credibility resistance."],
      ["change_authority", "Change authority", 0, 1, 0.005, "How much the principal can alter the environment."],
    ]
  },
  {
    title: "Retention and value",
    controls: [
      ["base_churn", "Base weekly churn", 0, 0.20, 0.001, "Churn before value receipts reduce it."],
      ["min_churn", "Minimum weekly churn", 0, 0.12, 0.001, "Retention floor: churn never falls below this."],
      ["base_weekly_value_per_agent", "Base weekly value / agent", 0, 80, 0.25, "Value saved or created before network effects."],
      ["network_bonus_per_100_agents", "Network bonus / 100 agents", 0, 20, 0.05, "Extra weekly value created by peer density."],
      ["network_bonus_cap", "Network bonus cap", 0, 100, 0.5, "Maximum weekly network bonus per agent."],
      ["value_threshold_for_retention", "Value threshold for retention", 1, 80, 0.25, "How much weekly value is needed before churn relief is strong."],
    ]
  }
];

const state = {
  scenarioKey: "household_subscription_audit",
  values: structuredClone(PRESETS.household_subscription_audit),
  series: "active"
};

const $ = (id) => document.getElementById(id);

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

function projectScenario(input) {
  const s = { ...input };
  let active = Number(s.initial_active_agents);
  let cumulativeValue = 0;
  const effectiveK = Number(s.referrals_per_active_per_week) * Number(s.invite_conversion) * Number(s.trust_score) * Number(s.change_authority);
  const points = [];

  for (let week = 1; week <= Number(s.weeks); week += 1) {
    const networkBonus = Math.min(Number(s.network_bonus_cap), Number(s.network_bonus_per_100_agents) * (active / 100));
    const weeklyValuePerAgent = Number(s.base_weekly_value_per_agent) + networkBonus;
    const valueChurnRelief = Math.min(0.08, 0.02 * (weeklyValuePerAgent / Math.max(1, Number(s.value_threshold_for_retention))));
    const churn = Math.max(Number(s.min_churn), Number(s.base_churn) - valueChurnRelief);
    const newAgents = active * effectiveK;
    const churnedAgents = active * churn;
    active = active - churnedAgents + newAgents;
    const weeklyValue = active * weeklyValuePerAgent;
    cumulativeValue += weeklyValue;

    points.push({
      week,
      active,
      effectiveK,
      churn,
      newAgents,
      churnedAgents,
      networkBonus,
      weeklyValuePerAgent,
      weeklyValue,
      cumulativeValue
    });
  }

  const last = points[points.length - 1] ?? {
    week: 0,
    active,
    effectiveK,
    churn: Number(s.base_churn),
    weeklyValue: 0,
    cumulativeValue: 0,
    networkBonus: 0,
    weeklyValuePerAgent: 0
  };

  let verdict = "growth loop";
  if (effectiveK <= last.churn) verdict = "needs support/value proof";
  if (effectiveK < last.churn * 0.5) verdict = "high-resistance channel";

  return { points, last, effectiveK, verdict };
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
    state.values = structuredClone(PRESETS[state.scenarioKey]);
    renderControls();
    updateProjection();
  });
  $("resetButton").addEventListener("click", () => {
    state.values = structuredClone(PRESETS[state.scenarioKey]);
    renderControls();
    updateProjection();
  });
}

function controlValueLabel(key, value) {
  if (["invite_conversion", "trust_score", "change_authority", "base_churn", "min_churn", "referrals_per_active_per_week"].includes(key)) {
    return key === "referrals_per_active_per_week" ? Number(value).toFixed(3) : pct(value);
  }
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
  $("verdictPill").textContent = result.verdict;
  $("verdictPill").className = `verdict-pill ${verdictClass(result.verdict)}`.trim();

  $("metricActive").textContent = fmtNumber(result.last.active, 1);
  $("metricValue").textContent = fmtMoney(result.last.cumulativeValue);
  $("metricWeekValue").textContent = fmtMoney(result.last.weeklyValue);
  $("metricChurn").textContent = pct(result.last.churn);

  $("heroVerdict").textContent = result.verdict;
  $("heroScenario").textContent = preset.label;
  $("heroActive").textContent = fmtCompact(result.last.active);
  $("heroValue").textContent = fmtCompact(result.last.cumulativeValue, "$");
  $("heroK").textContent = result.effectiveK.toFixed(3);
}

function drawLineChart(canvas, points, series) {
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 980;
  const cssHeight = Math.max(300, cssWidth * 0.43);
  canvas.width = Math.floor(cssWidth * ratio);
  canvas.height = Math.floor(cssHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const values = points.map((p) => p[series]);
  const rawMax = Math.max(...values, 1);
  const max = rawMax * 1.08;
  const min = Math.min(0, ...values);
  const pad = { top: 24, right: 22, bottom: 44, left: 62 };
  const width = cssWidth - pad.left - pad.right;
  const height = cssHeight - pad.top - pad.bottom;

  ctx.strokeStyle = "rgba(159, 189, 255, 0.18)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(170, 184, 207, 0.86)";
  ctx.font = "12px ui-sans-serif, system-ui";

  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (height * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + width, y);
    ctx.stroke();
    const label = min + ((max - min) * (4 - i)) / 4;
    const text = series.includes("Value") ? fmtCompact(label, "$") : fmtCompact(label);
    ctx.fillText(text, 10, y + 4);
  }

  ctx.strokeStyle = "rgba(101, 240, 212, 0.92)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = pad.left + (width * index) / Math.max(1, points.length - 1);
    const y = pad.top + height - ((point[series] - min) / Math.max(1e-9, max - min)) * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + height);
  gradient.addColorStop(0, "rgba(101, 240, 212, 0.22)");
  gradient.addColorStop(1, "rgba(101, 240, 212, 0)");
  ctx.lineTo(pad.left + width, pad.top + height);
  ctx.lineTo(pad.left, pad.top + height);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.fillStyle = "rgba(170, 184, 207, 0.9)";
  ctx.fillText("week 1", pad.left, cssHeight - 16);
  ctx.textAlign = "right";
  ctx.fillText(`week ${points.length}`, pad.left + width, cssHeight - 16);
  ctx.textAlign = "left";
}

function updateChartCaption(result) {
  const seriesNames = {
    active: "Active agents",
    cumulativeValue: "Cumulative value",
    weeklyValue: "Weekly value"
  };
  $("chartCaption").textContent = `${seriesNames[state.series]} over ${state.values.weeks} weeks. Effective weekly K is ${result.effectiveK.toFixed(3)}; final weekly churn is ${pct(result.last.churn)}.`;
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
      <td data-label="Agents">${fmtNumber(result.last.active, 1)}</td>
      <td data-label="K/week">${result.effectiveK.toFixed(3)}</td>
      <td data-label="Churn">${pct(result.last.churn)}</td>
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

window.addEventListener("resize", () => updateProjection());

setupScenarioSelect();
renderControls();
setupTabs();
updateProjection();
