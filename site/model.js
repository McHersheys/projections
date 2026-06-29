(function exposeModel(root) {
  const PRESETS = {
    household_subscription_audit: {
      label: "Household subscription audit",
      description: "Low-social-friction household value: subscriptions, bills, renegotiation, tariff switching, and obvious value receipts.",
      initial_active_agents: 100,
      addressable_market: 2400,
      weeks: 26,
      organic_discovery_rate: 0.010,
      referrals_per_active_per_week: 0.34,
      invite_conversion: 0.38,
      trust_score: 0.86,
      change_authority: 1.00,
      network_amplification: 2.00,
      base_churn: 0.038,
      min_churn: 0.012,
      easy_savings_stock_per_agent: 220,
      easy_savings_capture_rate: 0.45,
      admin_burden_value_per_agent: 5.0,
      hard_work_value_per_agent: 2.5,
      market_work_value_per_agent: 1.5,
      human_availability: 0.38,
      life_project_stock_per_agent: 180,
      project_realization_rate: 0.025,
      shadow_value_confidence: 0.45,
      value_threshold_for_retention: 18.0
    },
    neighbor_bulk_buy_unlock: {
      label: "Neighbor bulk-buy unlock",
      description: "Local cooperation with high visible savings and high resistance: agent-brokered terms, peer density, guarantees, and awkward-detail handling.",
      initial_active_agents: 100,
      addressable_market: 1800,
      weeks: 26,
      organic_discovery_rate: 0.012,
      referrals_per_active_per_week: 0.58,
      invite_conversion: 0.42,
      trust_score: 0.78,
      change_authority: 1.00,
      network_amplification: 3.00,
      base_churn: 0.034,
      min_churn: 0.010,
      easy_savings_stock_per_agent: 260,
      easy_savings_capture_rate: 0.40,
      admin_burden_value_per_agent: 6.0,
      hard_work_value_per_agent: 9.0,
      market_work_value_per_agent: 3.0,
      human_availability: 0.55,
      life_project_stock_per_agent: 130,
      project_realization_rate: 0.020,
      shadow_value_confidence: 0.40,
      value_threshold_for_retention: 20.0
    },
    personal_to_work_agent_bridge: {
      label: "Personal → work agent bridge",
      description: "The home agent proves value, then suggests a work-safe companion for the same principal while respecting clearance boundaries.",
      initial_active_agents: 100,
      addressable_market: 1400,
      weeks: 26,
      organic_discovery_rate: 0.006,
      referrals_per_active_per_week: 0.28,
      invite_conversion: 0.27,
      trust_score: 0.72,
      change_authority: 0.68,
      network_amplification: 1.50,
      base_churn: 0.040,
      min_churn: 0.015,
      easy_savings_stock_per_agent: 120,
      easy_savings_capture_rate: 0.22,
      admin_burden_value_per_agent: 6.0,
      hard_work_value_per_agent: 3.0,
      market_work_value_per_agent: 12.0,
      human_availability: 0.42,
      life_project_stock_per_agent: 260,
      project_realization_rate: 0.018,
      shadow_value_confidence: 0.55,
      value_threshold_for_retention: 22.0
    },
    top_down_corporate_rollout: {
      label: "Top-down corporate rollout",
      description: "More seats, but lower change authority: staff may use the agent on the immediate problem while upstream process remains fixed.",
      initial_active_agents: 100,
      addressable_market: 1000,
      weeks: 26,
      organic_discovery_rate: 0.003,
      referrals_per_active_per_week: 0.12,
      invite_conversion: 0.16,
      trust_score: 0.64,
      change_authority: 0.34,
      network_amplification: 0.60,
      base_churn: 0.064,
      min_churn: 0.028,
      easy_savings_stock_per_agent: 40,
      easy_savings_capture_rate: 0.20,
      admin_burden_value_per_agent: 4.0,
      hard_work_value_per_agent: 1.0,
      market_work_value_per_agent: 2.0,
      human_availability: 0.20,
      life_project_stock_per_agent: 60,
      project_realization_rate: 0.008,
      shadow_value_confidence: 0.25,
      value_threshold_for_retention: 26.0
    }
  };

  const CONTROL_GROUPS = [
    {
      title: "Adoption diffusion",
      controls: [
        ["initial_active_agents", "Initial active agents", 1, 1000, 1, "Starting active agents."],
        ["addressable_market", "Addressable market", 100, 10000, 50, "The practical ceiling for this channel or local cohort."],
        ["weeks", "Projection weeks", 4, 104, 1, "How many weekly steps to simulate."],
        ["organic_discovery_rate", "Organic discovery / week", 0, 0.08, 0.001, "Baseline activation pressure before referrals kick in."],
        ["referrals_per_active_per_week", "Referrals per active / week", 0, 1.2, 0.005, "Invitation pressure contributed by active agents."],
        ["invite_conversion", "Invite conversion", 0, 1, 0.005, "Share of invites or visible stories becoming active agents."],
        ["trust_score", "Trust score", 0, 1, 0.005, "Legal, social, privacy, and credibility resistance."],
        ["change_authority", "Change authority", 0, 1, 0.005, "How much the principal can alter the environment."],
        ["network_amplification", "Network amplification", 0, 5, 0.05, "How much peer density makes referrals and matching more convincing."],
      ]
    },
    {
      title: "Value stack",
      controls: [
        ["easy_savings_stock_per_agent", "Easy audit stock / agent", 0, 1200, 10, "Finite pool from subscriptions, tariffs, duplicate tools, and obvious renegotiations."],
        ["easy_savings_capture_rate", "Easy savings capture / week", 0.01, 0.90, 0.005, "How quickly the first audit consumes that finite savings pool."],
        ["admin_burden_value_per_agent", "Admin burden relief / week", 0, 120, 0.25, "Ongoing value from not chasing forms, bills, appointments, and admin."],
        ["hard_work_value_per_agent", "Hard-work opportunity / week", 0, 120, 0.25, "Tasks that require follow-through, time, awkward negotiation, or behavior change."],
        ["market_work_value_per_agent", "Market work potential / week", 0, 200, 0.50, "Matched jobs, trades, errands, expert tasks, or peer-to-peer useful work."],
        ["human_availability", "Human availability", 0, 1, 0.005, "Share of matched opportunities the principal is willing and able to accept."],
        ["life_project_stock_per_agent", "Life/project stock / agent", 0, 2500, 10, "Finite backlog of health goals, psychological goals, trips, ideas, and projects."],
        ["project_realization_rate", "Project realization / week", 0, 0.25, 0.001, "How quickly the agent converts life/project backlog into outcomes."],
        ["shadow_value_confidence", "Shadow value confidence", 0, 1, 0.005, "How much non-cash progress counts as value after uncertainty/measurement discount."],
      ]
    },
    {
      title: "Retention",
      controls: [
        ["base_churn", "Base weekly churn", 0, 0.20, 0.001, "Churn before value receipts reduce it."],
        ["min_churn", "Minimum weekly churn", 0, 0.12, 0.001, "Retention floor: churn never falls below this."],
        ["value_threshold_for_retention", "Value threshold for retention", 1, 150, 0.25, "Weekly value per active agent needed before churn relief is strong."],
      ]
    }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function classifyCurve(points, scenario) {
    if (!points.length) return "not enough data";
    const first = points[0];
    const last = points[points.length - 1];
    const initial = safeNumber(scenario.initial_active_agents, 1);
    const capacity = Math.max(initial, safeNumber(scenario.addressable_market, initial));
    const endShare = last.active / capacity;
    const delta = last.active - initial;

    if (last.active < initial * 0.85) return "decay curve";
    if (endShare > 0.85 && delta > initial * 4) return "saturating S-curve";
    if (last.netGrowthRate > first.netGrowthRate * 1.15 && delta > initial * 0.5) return "accelerating curve";
    if (delta > initial * 2) return "compound growth curve";
    if (delta > initial * 0.5) return "slow compounding curve";
    return "near-threshold curve";
  }

  function classifyVerdict(points, scenario) {
    if (!points.length) return "needs support/value proof";
    const initial = safeNumber(scenario.initial_active_agents, 1);
    const last = points[points.length - 1];

    if (last.active < initial * 0.85 || last.netGrowthRate < -0.015) return "high-resistance channel";
    if (last.active > initial * 3 && last.netGrowthRate > -0.01) return "growth loop";
    return "needs support/value proof";
  }

  function emptyLast(active, capacity, scenario) {
    return {
      week: 0,
      active,
      activeBefore: active,
      capacity,
      marketShare: capacity > 0 ? active / capacity : 0,
      remainingMarket: capacity - active,
      socialProofMultiplier: 1,
      referralPressure: 0,
      adoptionPressure: 0,
      churn: safeNumber(scenario.base_churn),
      newAgents: 0,
      churnedAgents: 0,
      netNewAgents: 0,
      netGrowthRate: 0,
      networkMaturity: 0,
      easySavingsValue: 0,
      adminValue: 0,
      hardWorkValue: 0,
      marketWorkValue: 0,
      lifeProjectValue: 0,
      cashValue: 0,
      shadowValue: 0,
      weeklyValuePerAgent: 0,
      weeklyValue: 0,
      weeklyCashValue: 0,
      weeklyShadowValue: 0,
      cumulativeValue: 0,
      cumulativeCashValue: 0,
      cumulativeShadowValue: 0,
      cumulativeEasySavingsValue: 0,
      cumulativeAdminValue: 0,
      cumulativeHardWorkValue: 0,
      cumulativeMarketWorkValue: 0,
      cumulativeLifeProjectValue: 0,
      easySavingsStockRemaining: 0,
      lifeProjectStockRemaining: 0
    };
  }

  function projectScenario(input) {
    const s = { ...input };
    const initial = Math.max(0, safeNumber(s.initial_active_agents));
    const capacity = Math.max(initial + 1, safeNumber(s.addressable_market, initial + 1));
    const weeks = Math.max(1, Math.round(safeNumber(s.weeks, 1)));
    const easyStockPerAgent = Math.max(0, safeNumber(s.easy_savings_stock_per_agent));
    const projectStockPerAgent = Math.max(0, safeNumber(s.life_project_stock_per_agent));

    let active = initial;
    let easySavingsStock = initial * easyStockPerAgent;
    let lifeProjectStock = initial * projectStockPerAgent;
    let cumulativeValue = 0;
    let cumulativeCashValue = 0;
    let cumulativeShadowValue = 0;
    let cumulativeEasySavingsValue = 0;
    let cumulativeAdminValue = 0;
    let cumulativeHardWorkValue = 0;
    let cumulativeMarketWorkValue = 0;
    let cumulativeLifeProjectValue = 0;
    const points = [];

    for (let week = 1; week <= weeks; week += 1) {
      const activeBefore = active;
      const marketShare = clamp(activeBefore / capacity, 0, 1);
      const remainingMarket = Math.max(0, capacity - activeBefore);
      const socialProofMultiplier = 1 + safeNumber(s.network_amplification) * marketShare;
      const referralPressure = safeNumber(s.referrals_per_active_per_week) * marketShare * socialProofMultiplier;
      const adoptionPressure = (safeNumber(s.organic_discovery_rate) + referralPressure)
        * safeNumber(s.invite_conversion)
        * safeNumber(s.trust_score)
        * safeNumber(s.change_authority);

      const networkMaturity = clamp(marketShare * (1 + safeNumber(s.network_amplification)), 0, 1);
      const hardWorkRamp = 1 - Math.exp(-week / 8);
      const easySavingsValue = Math.min(
        easySavingsStock,
        easySavingsStock * clamp(safeNumber(s.easy_savings_capture_rate), 0, 1)
      );
      const adminValue = activeBefore * Math.max(0, safeNumber(s.admin_burden_value_per_agent));
      const hardWorkValue = activeBefore
        * Math.max(0, safeNumber(s.hard_work_value_per_agent))
        * clamp(safeNumber(s.change_authority), 0, 1)
        * hardWorkRamp;
      const marketWorkValue = activeBefore
        * Math.max(0, safeNumber(s.market_work_value_per_agent))
        * clamp(safeNumber(s.human_availability), 0, 1)
        * clamp(safeNumber(s.trust_score), 0, 1)
        * (0.25 + 0.75 * networkMaturity);
      const lifeProjectProgress = lifeProjectStock
        * clamp(safeNumber(s.project_realization_rate), 0, 1)
        * clamp(safeNumber(s.change_authority), 0, 1);
      const lifeProjectValue = lifeProjectProgress * clamp(safeNumber(s.shadow_value_confidence), 0, 1);
      const cashValue = easySavingsValue + adminValue + hardWorkValue + marketWorkValue;
      const shadowValue = lifeProjectValue;
      const weeklyValue = cashValue + shadowValue;
      const weeklyCashValue = cashValue;
      const weeklyShadowValue = shadowValue;
      const weeklyValuePerAgent = activeBefore > 0 ? weeklyValue / activeBefore : 0;

      const valueChurnRelief = Math.min(
        0.10,
        0.025 * (weeklyValuePerAgent / Math.max(1, safeNumber(s.value_threshold_for_retention, 1)))
      );
      const churn = Math.max(safeNumber(s.min_churn), safeNumber(s.base_churn) - valueChurnRelief);
      const newAgents = Math.max(0, remainingMarket * adoptionPressure);
      const churnedAgents = activeBefore * churn;
      const netNewAgents = newAgents - churnedAgents;
      const netGrowthRate = activeBefore > 0 ? netNewAgents / activeBefore : 0;

      active = clamp(activeBefore + netNewAgents, 0, capacity);
      cumulativeEasySavingsValue += easySavingsValue;
      cumulativeAdminValue += adminValue;
      cumulativeHardWorkValue += hardWorkValue;
      cumulativeMarketWorkValue += marketWorkValue;
      cumulativeLifeProjectValue += lifeProjectValue;
      cumulativeCashValue += weeklyCashValue;
      cumulativeShadowValue += weeklyShadowValue;
      cumulativeValue += weeklyValue;

      const activeSurvivalRatio = activeBefore > 0 ? clamp((activeBefore - churnedAgents) / activeBefore, 0, 1) : 0;
      easySavingsStock = Math.max(0, easySavingsStock - easySavingsValue);
      lifeProjectStock = Math.max(0, lifeProjectStock - lifeProjectProgress);
      easySavingsStock = easySavingsStock * activeSurvivalRatio + newAgents * easyStockPerAgent;
      lifeProjectStock = lifeProjectStock * activeSurvivalRatio + newAgents * projectStockPerAgent;

      points.push({
        week,
        active,
        activeBefore,
        capacity,
        marketShare: active / capacity,
        remainingMarket: capacity - active,
        socialProofMultiplier,
        referralPressure,
        adoptionPressure,
        churn,
        newAgents,
        churnedAgents,
        netNewAgents,
        netGrowthRate,
        networkMaturity,
        easySavingsValue,
        adminValue,
        hardWorkValue,
        marketWorkValue,
        lifeProjectValue,
        cashValue,
        shadowValue,
        weeklyValuePerAgent,
        weeklyValue,
        weeklyCashValue,
        weeklyShadowValue,
        cumulativeValue,
        cumulativeCashValue,
        cumulativeShadowValue,
        cumulativeEasySavingsValue,
        cumulativeAdminValue,
        cumulativeHardWorkValue,
        cumulativeMarketWorkValue,
        cumulativeLifeProjectValue,
        easySavingsStockRemaining: easySavingsStock,
        lifeProjectStockRemaining: lifeProjectStock
      });
    }

    const first = points[0] ?? null;
    const last = points[points.length - 1] ?? emptyLast(active, capacity, s);

    return {
      points,
      first,
      last,
      adoptionCeiling: capacity,
      firstNetGrowthRate: first ? first.netGrowthRate : 0,
      finalNetGrowthRate: last.netGrowthRate,
      curveFamily: classifyCurve(points, s),
      verdict: classifyVerdict(points, s)
    };
  }

  const api = { PRESETS, CONTROL_GROUPS, projectScenario };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.AdoptionModel = api;
})(typeof window !== "undefined" ? window : globalThis);
