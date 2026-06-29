# Model notes

This repo implements the toy model from the notes-vault thesis `Agent Adoption Virality and Principal Value Dashboard`.

## Core equations

```text
effective_k = referrals_per_active_per_week * invite_conversion * trust_score * change_authority
network_bonus = min(network_bonus_cap, network_bonus_per_100_agents * active_agents / 100)
weekly_value_per_agent = base_weekly_value_per_agent + network_bonus
value_churn_relief = min(0.08, 0.02 * weekly_value_per_agent / max(1, value_threshold_for_retention))
weekly_churn = max(min_churn, base_churn - value_churn_relief)
new_agents = active_agents * effective_k
retained_agents = active_agents * (1 - weekly_churn)
active_agents_next = retained_agents + new_agents
weekly_value = active_agents_next * weekly_value_per_agent
```

## Read discipline

- This is a model for **scenario comparison**, not prediction.
- `change_authority` captures whether the principal can actually alter the environment.
- `trust_score` and conversion are knobs for social/legal/technical resistance.
- `network_bonus` lets peer density create additional value per agent.
- Value receipts reduce churn, but only to a configurable floor.
