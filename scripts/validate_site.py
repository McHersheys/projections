#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

required_files = [
    SITE / "index.html",
    SITE / "styles.css",
    SITE / "model.js",
    SITE / "app.js",
    SITE / "vendor/chart.umd.min.js",
    ROOT / "scripts/model_smoke.js",
    ROOT / ".github/workflows/pages.yml",
]

for path in required_files:
    if not path.exists():
        raise SystemExit(f"missing required file: {path.relative_to(ROOT)}")

index = (SITE / "index.html").read_text()
styles = (SITE / "styles.css").read_text()
app = (SITE / "app.js").read_text()
model = (SITE / "model.js").read_text()
workflow = (ROOT / ".github/workflows/pages.yml").read_text()

required_index = [
    "Agent Adoption Projections",
    "Projection controls",
    "Active agents",
    "Cumulative value",
    "Value stack receipts",
    "Scenario comparison",
    "vendor/chart.umd.min.js",
    "model.js",
    "site/app.js".replace("site/", ""),
]
for needle in required_index:
    if needle not in index:
        raise SystemExit(f"index.html missing required text: {needle}")

required_scenarios = [
    "household_subscription_audit",
    "neighbor_bulk_buy_unlock",
    "personal_to_work_agent_bridge",
    "top_down_corporate_rollout",
]
for scenario in required_scenarios:
    if scenario not in model:
        raise SystemExit(f"model.js missing scenario: {scenario}")

required_functions = [
    "function projectScenario",
    "function drawLineChart",
    "function updateProjection",
    "addressable_market",
    "network_amplification",
    "change_authority",
    "easy_savings_stock_per_agent",
    "life_project_stock_per_agent",
    "shadow_value_confidence",
]
for needle in required_functions:
    if needle not in app and needle not in model:
        raise SystemExit(f"missing required model/control code: {needle}")

smoke = subprocess.run(
    ["node", "scripts/model_smoke.js"],
    cwd=ROOT,
    text=True,
    capture_output=True,
    check=False,
)
if smoke.returncode != 0:
    sys.stderr.write(smoke.stdout)
    sys.stderr.write(smoke.stderr)
    raise SystemExit("model smoke test failed")

if "upload-pages-artifact" not in workflow or "deploy-pages" not in workflow:
    raise SystemExit("Pages workflow missing deploy actions")

if not re.search(r"@media\s*\(max-width:\s*760px\)", styles):
    raise SystemExit("styles.css missing mobile breakpoint")

if not re.search(r"@media\s*\(max-width:\s*1080px\)", styles):
    raise SystemExit("styles.css missing tablet breakpoint")

# Basic no-legacy / no-secret guard for public Pages repo.
secretish = re.compile(r"(gho_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|sk-[A-Za-z0-9]{20,}|BEGIN (RSA|OPENSSH|PRIVATE) KEY)")
for path in ROOT.rglob("*"):
    if path.is_dir() or ".git" in path.parts:
        continue
    if path.suffix.lower() not in {".md", ".html", ".css", ".js", ".py", ".yml", ".yaml", ".txt"}:
        continue
    text = path.read_text(errors="ignore")
    if secretish.search(text):
        raise SystemExit(f"possible secret found in {path.relative_to(ROOT)}")

print("site validation passed")
