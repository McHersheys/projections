# Projections

Interactive adoption/value projection dashboard for Dreamcatcher agent rollout scenarios.

The model is intentionally simple: it is an editable assumption surface for comparing adoption paths by virality, resistance, change authority, churn, and value receipts. It is **not** a forecast.

## Local preview

```bash
python3 -m http.server 8008 --directory site
# open http://127.0.0.1:8008/
```

## Validate

```bash
python3 scripts/validate_site.py
```

## GitHub Pages

The repository publishes `site/` through `.github/workflows/pages.yml`.
