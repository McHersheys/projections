# Model notes

This repo implements a transparent **scenario workbench**, not a forecast. Version 2 replaces the first flat breakeven multiplier with a Bass-style diffusion curve so the dashboard can show the shapes Tom expected: early compounding, S-curve saturation, near-threshold stagnation, and decay.

## Why v2 changed

The original toy model used:

```text
new_agents = active_agents * effective_k
active_next = active_agents * (1 - churn) + new_agents
```

That is mathematically exponential when `effective_k > churn`, but the baseline household parameters were deliberately close to breakeven (`effective_k ≈ churn`), so the graph looked flat. It also had no finite market ceiling, no organic discovery term, and no social-proof acceleration.

## Core equations

```text
market_share = active / addressable_market
referral_pressure = referrals_per_active_per_week * market_share * (1 + network_amplification * market_share)
adoption_pressure = (organic_discovery_rate + referral_pressure) * invite_conversion * trust_score * change_authority
new_agents = (addressable_market - active) * adoption_pressure
network_bonus = min(network_bonus_cap, network_bonus_per_100_agents * active / 100)
weekly_value_per_agent = base_weekly_value_per_agent + network_bonus
value_churn_relief = min(0.10, 0.025 * weekly_value_per_agent / max(1, value_threshold_for_retention))
weekly_churn = max(min_churn, base_churn - value_churn_relief)
active_agents_next = active_agents + new_agents - active_agents * weekly_churn
weekly_value = active_agents_next * weekly_value_per_agent
```

## Read discipline

- This is a model for **scenario comparison**, not prediction.
- `addressable_market` creates an S-curve ceiling instead of infinite exponential growth.
- `organic_discovery_rate` lets a channel start before referrals dominate.
- `referrals_per_active_per_week` plus `network_amplification` creates social-proof acceleration.
- `change_authority` captures whether the principal can actually alter the environment.
- `trust_score` and conversion are knobs for social/legal/technical resistance.
- `network_bonus` lets peer density create additional value per agent.
- Value receipts reduce churn, but only to a configurable floor.

## Baseline smoke snapshot

Run:

```bash
node scripts/model_smoke.js
```

Expected qualitative shapes:

- household subscription audit: visible compounding from first-value wedge;
- neighbor bulk-buy unlock: fast local S-curve and saturation;
- personal → work bridge: slower compounding, needs support;
- top-down corporate rollout: decay under low change authority.
