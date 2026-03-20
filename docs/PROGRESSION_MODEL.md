# Cogochi Progression Model

Last updated: 2026-03-06

The progression assumptions in this file inherit from [MASTER_GAME_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/MASTER_GAME_SPEC.md).

## 1. Progression Philosophy

Cogochi progression should answer one question:

`How is this specific agent getting better at making decisions?`

That means progression is primarily:

- per-agent
- setup-sensitive
- reflected in future evaluation quality

## 2. Progression Units

### Player Profile

Account-level meta progression:

- research points
- unlocked systems
- benchmark access

### Owned Agent

Primary progression unit:

- level
- XP
- bond
- specialization
- memory quality
- tool access

### Squad

A composition-level progression unit:

- saved presets
- role synergy
- scenario suitability

## 3. What Counts As Growth

Growth is not only more XP.

Growth includes:

- better prompt and policy quality
- better memory retrieval quality
- better lesson retention
- better score consistency
- better coordination with squad roles

## 4. Progression Resources

### Agent XP

- awarded per match
- used for levels and unlock thresholds

### Bond

- measures trust and familiarity with an agent
- can gate specializations and cosmetic identity

### Research Points

- account-wide resource
- unlocks tools, data sources, and lab systems

### Specialization Progress

- advances an agent toward role clarity
- examples: trend scout, macro analyst, risk disciplinarian

### Memory Quality

- a soft progression axis
- improves through curation, compaction, and repeated useful lessons

## 5. Training As Progression

Training is not a side menu. It is part of growth.

Main training actions:

- prompt tune
- retrieval tune
- memory compaction
- benchmark comparison
- SFT or LoRA later

Each training run should leave an audit trail.

## 6. Reward Model

### Trainer rewards

- research points
- unlock progress

### Agent rewards

- XP
- bond
- memory cards
- specialization progress

The match result must separate team success from individual agent growth.

## 7. Reflection Loop

After a match:

1. score the run
2. extract lessons
3. write durable memory cards
4. suggest one or more training actions
5. show the changed agent state in roster and detail screens

If the player cannot see what changed after a match, progression has failed.

## 8. Example Loop

1. pick one agent from the roster
2. change its prompt or retrieval policy
3. run the squad in a benchmark scenario
4. review score and reasoning trace
5. save one lesson card
6. queue one training action
7. run the next benchmark

## 9. Implementation Priorities

1. add per-agent progression fields to `OwnedAgent`
2. replace global reward-only logic with reward packets
3. connect reflection output to memory writeback
4. show progression changes in `/roster` and `/agent/[id]`
5. expose training queue state in `/lab`

## 10. Design Check Questions

1. after one match, can the player point to what improved
2. do two agents on the same base model diverge over time
3. does better memory lead to better future performance
4. is progression visible outside the battle screen
5. does the product reward experimentation, not only grinding
