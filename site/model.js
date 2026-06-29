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
      base_weekly_value_per_agent: 8.0,
      network_bonus_per_100_agents: 0.45,
      network_bonus_cap: 9.0,
      value_threshold_for_retention: 10.0
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
      base_weekly_value_per_agent: 9.0,
      network_bonus_per_100_agents: 2.0,
      network_bonus_cap: 25.0,
      value_threshold_for_retention: 10.0
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
      base_weekly_value_per_agent: 10.0,
      network_bonus_per_100_agents: 0.95,
      network_bonus_cap: 14.0,
      value_threshold_for_retention: 12.0
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
      base_weekly_value_per_agent: 6.0,
      network_bonus_per_100_agents: 0.25,
      network_bonus_cap: 4.0,
      value_threshold_for_retention: 14.0
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
        ["network_amplification", "Network amplification", 0, 5, 0.05, "How much peer density makes referrals more convincing."],
      ]
    },
    {
      title: "Retention and value",
      controls: [
        ["base_churn", "Base weekly churn", 0, 0.20, 0.001, "Churn before value receipts reduce it."],
        ["min_churn", "Minimum weekly churn", 0, 0.12, 0.001, "Retention floor: churn never falls below this."],
        ["base_weekly_value_per_agent", "Base weekly value / agent", 0, 100, 0.25, "Value saved or created before network effects."],
        ["network_bonus_per_100_agents", "Network bonus / 100 agents", 0, 30, 0.05, "Extra weekly value created by peer density."],
        ["network_bonus_cap", "Network bonus cap", 0, 120, 0.5, "Maximum weekly network bonus per agent."],
        ["value_threshold_for_retention", "Value threshold for retention", 1, 100, 0.25, "How much weekly value is needed before churn relief is strong."],
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
    if (endShare > 0.80 && delta > initial * 4) return "saturating S-curve";
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

  function projectScenario(input) {
    const s = { ...input };
    const initial = Math.max(0, safeNumber(s.initial_active_agents));
    const capacity = Math.max(initial + 1, safeNumber(s.addressable_market, initial + 1));
    const weeks = Math.max(1, Math.round(safeNumber(s.weeks, 1)));
    let active = initial;
    let cumulativeValue = 0;
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

      const networkBonus = Math.min(
        safeNumber(s.network_bonus_cap),
        safeNumber(s.network_bonus_per_100_agents) * (activeBefore / 100)
      );
      const weeklyValuePerAgent = safeNumber(s.base_weekly_value_per_agent) + networkBonus;
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
      const weeklyValue = active * weeklyValuePerAgent;
      cumulativeValue += weeklyValue;

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
        networkBonus,
        weeklyValuePerAgent,
        weeklyValue,
        cumulativeValue
      });
    }

    const first = points[0] ?? null;
    const last = points[points.length - 1] ?? {
      week: 0,
      active,
      capacity,
      marketShare: active / capacity,
      churn: safeNumber(s.base_churn),
      netGrowthRate: 0,
      weeklyValue: 0,
      cumulativeValue: 0,
      adoptionPressure: 0,
      referralPressure: 0,
      networkBonus: 0,
      weeklyValuePerAgent: 0
    };

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
