#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

required_files = [
    SITE / "index.html",
    SITE / "styles.css",
    SITE / "app.js",
    ROOT / ".github/workflows/pages.yml",
]

for path in required_files:
    if not path.exists():
        raise SystemExit(f"missing required file: {path.relative_to(ROOT)}")

index = (SITE / "index.html").read_text()
styles = (SITE / "styles.css").read_text()
app = (SITE / "app.js").read_text()
workflow = (ROOT / ".github/workflows/pages.yml").read_text()

required_index = [
    "Agent Adoption Projections",
    "Projection controls",
    "Active agents",
    "Cumulative value",
    "Scenario comparison",
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
    if scenario not in app:
        raise SystemExit(f"app.js missing scenario: {scenario}")

required_functions = [
    "function projectScenario",
    "function drawLineChart",
    "function updateProjection",
    "effectiveK",
    "change_authority",
]
for needle in required_functions:
    if needle not in app:
        raise SystemExit(f"app.js missing required model/control code: {needle}")

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
