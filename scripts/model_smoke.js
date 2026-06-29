#!/usr/bin/env node
const { PRESETS, projectScenario } = require('../site/model.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const snapshots = Object.fromEntries(
  Object.entries(PRESETS).map(([key, preset]) => [key, projectScenario(preset)])
);

for (const [key, result] of Object.entries(snapshots)) {
  assert(result.points.length === PRESETS[key].weeks, `${key}: expected ${PRESETS[key].weeks} points`);
  assert(Number.isFinite(result.last.active), `${key}: active is not finite`);
  assert(Number.isFinite(result.last.cumulativeValue), `${key}: cumulative value is not finite`);
  assert(result.last.active >= 0, `${key}: active went negative`);
  assert(result.last.active <= PRESETS[key].addressable_market + 1e-6, `${key}: active exceeded market ceiling`);
}

assert(snapshots.household_subscription_audit.last.active > PRESETS.household_subscription_audit.initial_active_agents * 8, 'household curve should visibly compound from first-value wedge');
assert(snapshots.neighbor_bulk_buy_unlock.last.active / PRESETS.neighbor_bulk_buy_unlock.addressable_market > 0.95, 'neighbor bulk-buy curve should visibly saturate local market');
assert(snapshots.personal_to_work_agent_bridge.last.active > PRESETS.personal_to_work_agent_bridge.initial_active_agents * 1.8, 'personal→work bridge should show slow compounding, not flatness');
assert(snapshots.top_down_corporate_rollout.last.active < PRESETS.top_down_corporate_rollout.initial_active_agents * 0.35, 'top-down corporate rollout should decay under low authority');

const summary = Object.fromEntries(Object.entries(snapshots).map(([key, result]) => [key, {
  active: Number(result.last.active.toFixed(1)),
  cumulativeValue: Number(result.last.cumulativeValue.toFixed(0)),
  firstNetWeek: Number((result.firstNetGrowthRate * 100).toFixed(1)),
  finalNetWeek: Number((result.finalNetGrowthRate * 100).toFixed(1)),
  curve: result.curveFamily,
  verdict: result.verdict
}]));

console.log(JSON.stringify(summary, null, 2));
