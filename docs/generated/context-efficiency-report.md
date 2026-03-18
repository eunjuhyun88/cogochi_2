# Context Efficiency Report

This report estimates how much context the routing system saves before the agent reaches implementation files.

## Core Bundles

| Bundle | Files | Lines | Approx Tokens | Reduction vs canonical | Reduction vs all docs |
| --- | --- | --- | --- | --- | --- |
| small map | 5 | 1082 | 9407 | 69.4% | 97.4% |
| canonical | 31 | 3766 | 30737 | 0.0% | 91.6% |
| all docs | 151 | 44074 | 364219 | -1085.0% | 0.0% |

## Estimated Savings

- Small map saves approximately `21330` tokens vs the canonical bundle.
- Small map saves approximately `354812` tokens vs the all-doc bundle.
- Surface `terminal` saves approximately `350261` tokens vs the all-doc bundle.
- Surface `arena` saves approximately `350138` tokens vs the all-doc bundle.
- Surface `community` saves approximately `350816` tokens vs the all-doc bundle.
- Surface `api` saves approximately `350816` tokens vs the all-doc bundle.

## Surface Bundles

| Bundle | Files | Lines | Approx Tokens | Reduction vs canonical | Reduction vs all docs |
| --- | --- | --- | --- | --- | --- |
| terminal | 9 | 1454 | 13958 | 54.6% | 96.2% |
| arena | 9 | 1468 | 14081 | 54.2% | 96.1% |
| community | 8 | 1387 | 13403 | 56.4% | 96.3% |
| api | 8 | 1387 | 13403 | 56.4% | 96.3% |

## Structural Scorecard

| Check | Actual | Target | Result |
| --- | --- | --- | --- |
| Small-map reduction vs canonical | 69.4% | >= 40% | PASS |
| Small-map reduction vs all docs | 97.4% | >= 55% | PASS |
| Worst surface reduction vs all docs | 96.1% | >= 50% | PASS |
| Small-map approx tokens | 9407 | <= 14000 | PASS |
| Small-map file count | 5 | <= 6 | PASS |
| Canonical approx tokens | 30737 | <= 32000 | PASS |

## Structural Readiness

- PASS: structural routing gate

## Budget Checks

- PASS: Small map approx tokens <= 14000
- PASS: Small map files <= 6
- PASS: Canonical approx tokens <= 32000

## Small Map Files

- `README.md`
- `AGENTS.md`
- `docs/README.md`
- `ARCHITECTURE.md`
- `docs/SYSTEM_INTENT.md`

## Notes

- Small-map results tell you whether the canonical entry path is compact enough to be practical.
- Surface bundles tell you whether route/store/API discovery can be done without broad document scans.
- Run `npm run eval:validate` to pair structural evidence with real task evidence.
- Run `npm run harness:benchmark -- --base-url http://localhost:4173` for repeated runtime/noise validation.

