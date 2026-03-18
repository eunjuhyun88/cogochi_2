# Product Specs

This folder contains the canonical surface specs referenced by `docs/README.md` and `context-kit.json`.

## Release Surface Mapping

| Release surface | Canonical file(s) | Notes |
| --- | --- | --- |
| `Home` | `docs/product-specs/home.md` | first-action path and product promise |
| `Mission` | `docs/product-specs/create-agent.md`, `docs/product-specs/terminal.md`, `docs/product-specs/arena.md` | current implementation still spans multiple routes |
| `Agent HQ` | `docs/product-specs/agents.md`, `docs/product-specs/passport.md` | legacy `Lab` and `Passport` slices are being absorbed here |
| `Market` | `docs/product-specs/signals.md` | current implementation still lives under `/signals` |
| `API and support` | `docs/product-specs/api.md`, `docs/product-specs/community.md` | contracts and supporting social layer |

## Legacy Route Bridge

| Route or slice | Current spec | Release reading |
| --- | --- | --- |
| `/create` | `docs/product-specs/create-agent.md` | `Mission / Create` |
| `/terminal` | `docs/product-specs/terminal.md` | `Mission / Train` |
| `/world` | `docs/product-specs/world.md` | internal mission content, not top-level release IA |
| `/arena*` | `docs/product-specs/arena.md` | `Mission / Arena` |
| `/agent` | `docs/product-specs/agents.md` | `Agent HQ / Overview` |
| `/lab` | page specs only | `Agent HQ / Training` |
| `/passport` | `docs/product-specs/passport.md` | `Agent HQ / Record` |
| `/signals` | `docs/product-specs/signals.md` | `Market` |

## Page Specs

Detailed page-level specs live in `docs/page-specs/`. See `docs/page-specs/index.md` for the full list.
