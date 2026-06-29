# Model notes

This repo implements a transparent **scenario workbench**, not a forecast. Version 2 replaces the first flat breakeven multiplier with a Bass-style diffusion curve so the dashboard can show early compounding, S-curve saturation, near-threshold stagnation, and decay.

Version 3 adds a **staged value stack**. The key change is that value is not one endless weekly number. A household can get a sharp first receipt from a finite audit stock, then the agent has to find harder/admin/project/market opportunities whose curves have different friction, timing, and measurement quality.

## Why the value model changed

The prior model used one weekly value number:

```text
weekly_value_per_agent = base_weekly_value_per_agent + network_bonus
```

That missed the phenomenon Tom described:

- the first subscription/bill audit can find a finite stock of obvious savings;
- after that, easy savings taper and later gains require work, time, negotiation, or behavior change;
- useful work can be matched through the network: errands, trades, expert tasks, reputation-based jobs, arbitrarily complex contributions;
- health, psychological goals, self-actualization, holidays, projects, and idea realization are real value, but should be confidence-weighted rather than treated as clean cash;
- ongoing removal of administrative burden is a recurring stream rather than a one-off win.

## Adoption equations

```text
market_share = active / addressable_market
referral_pressure = referrals_per_active_per_week * market_share * (1 + network_amplification * market_share)
adoption_pressure = (organic_discovery_rate + referral_pressure) * invite_conversion * trust_score * change_authority
new_agents = (addressable_market - active) * adoption_pressure
```

`addressable_market` gives the curve a ceiling. `referrals_per_active_per_week` and `network_amplification` create peer-density acceleration. `trust_score` and `change_authority` capture resistance: people may hear about the agent, but the loop only works when they trust it and can change their environment.

## Staged value equations

```text
easy_savings_receipt = easy_savings_stock * easy_savings_capture_rate
network_maturity = clamp(market_share * (1 + network_amplification), 0, 1)
hard_work_ramp = 1 - exp(-week / 8)
admin_receipt = active * admin_burden_value_per_agent
hard_work_receipt = active * hard_work_value_per_agent * change_authority * hard_work_ramp
market_work_receipt = active * market_work_value_per_agent * human_availability * trust_score * (0.25 + 0.75 * network_maturity)
life_project_progress = life_project_stock * project_realization_rate * change_authority
life_project_receipt = life_project_progress * shadow_value_confidence
weekly_cash_value = easy_savings_receipt + admin_receipt + hard_work_receipt + market_work_receipt
weekly_shadow_value = life_project_receipt
weekly_value = weekly_cash_value + weekly_shadow_value
```

### Interpretation

- **Easy audit stock** is finite per active agent/household. It is consumed over time, so a week-two subscription win does not imply infinite future subscription wins.
- **Admin burden relief** is recurring: the agent keeps saving attention and time.
- **Hard-work receipt** ramps slowly because some wins require awkward conversations, follow-through, or delayed behavior change.
- **Market work receipt** grows with network maturity because a richer market has more peers, principals, trust paths, and division-of-labor matches.
- **Life/project receipt** is confidence-weighted shadow value: health goals, psychological progress, project realization, trips, and ideas count, but with an explicit uncertainty discount.

When active agents churn, their remaining easy-savings and life/project stock leaves the modeled active cohort. New agents add fresh finite stock.

## Retention equations

```text
weekly_value_per_active = weekly_value / active
value_churn_relief = min(0.10, 0.025 * weekly_value_per_active / max(1, value_threshold_for_retention))
weekly_churn = max(min_churn, base_churn - value_churn_relief)
active_next = active + new_agents - active * weekly_churn
```

The model assumes value receipts improve retention, but only down to `min_churn`.

## Read discipline

- This is a model for **scenario comparison**, not prediction.
- The value stack is deliberately arguable: every category can be debated, tuned, or removed.
- Cash-like value and confidence-weighted life/project value are separated internally, even though the headline cumulative value sums them for quick comparison.
- `shadow_value_confidence` is the guardrail for health/self-actualization/project value. Do not read it as guaranteed cash.
- A strong first audit can create an early retention wedge even if later weekly easy savings taper.
- A richer agent network should increase market-work value because it improves matching, trust, and division of labor.

## Baseline smoke snapshot

Run:

```bash
node scripts/model_smoke.js
```

Expected qualitative shapes:

- household subscription audit: visible compounding from a first-audit value wedge;
- neighbor bulk-buy unlock: fast local S-curve and saturation;
- personal → work bridge: slower compounding, with market-work value improving as the network matures;
- top-down corporate rollout: decay under low change authority.
