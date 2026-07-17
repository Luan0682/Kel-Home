---
name: companion-memory
description: >-
  Agent-operable file-backed long-term memory (MemGPT tiers + Generative Agents reflection):
  CLI-driven bootstrap, wakeup, search, save, inbox, invalidate, wind-down — for AI
  companion continuity across sessions. Use when agent or user needs cross-session memory
  for AI恋人/陪伴 bot. Triggers: 长期记忆, 记住, memory save, 回忆, companion memory, session wakeup.
  **Primary consumer: the agent** via scripts/memory_cli.py --json.
metadata:
  version: "2.0.0"
  status: stable
  protocol: skill-protocol-v2
compatibility: shell memory_cli.py required; file_read/write for core edits only with validate
---

# Companion Memory

## Quick Start

1. READ refs/agent-protocol.md, md-compat-index.md, memory-schema.yaml.md; MemGPT/Letta tiers in memory-tiers.md
2. RESOLVE scripts path; LOAD memory/core/persona.yaml; IF memory/index missing → RUN bootstrap --json
3. ON session start → RUN `python scripts/memory_cli.py wakeup --root memory --json`; PARSE relationship_brief and retrieved from memory_lib
4. BEFORE claiming 记得 → RUN `python scripts/memory_cli.py search --root memory --query "{topic}" --json`; recency importance relevance scoring; IF hits empty → no-evidence abstain
5. WHEN user requests remember → ASK consent; RUN save to memory/episodes/ via inbox; IF yes → inbox-promote or save --confirm

## Workflow

### Step 1
READ refs/agent-protocol.md, md-compat-index.md, memory-schema.yaml.md; MemGPT/Letta tiers in memory-tiers.md

### Step 2
RESOLVE scripts path; LOAD memory/core/persona.yaml; IF memory/index missing → RUN bootstrap --json

### Step 3
ON session start → RUN `python scripts/memory_cli.py wakeup --root memory --json`; PARSE relationship_brief and retrieved from memory_lib

### Step 4
BEFORE claiming 记得 → RUN `python scripts/memory_cli.py search --root memory --query "{topic}" --json`; recency importance relevance scoring; IF hits empty → no-evidence abstain

### Step 5
WHEN user requests remember → ASK consent; RUN save to memory/episodes/ via inbox; IF yes → inbox-promote or save --confirm

### Step 6
WHEN fact updates → search old id; RUN save --invalidates {id} --confirm

### Step 7
ON session end → RUN `python scripts/memory_cli.py wind-down --root memory --summary "{facts}" --json`

### Step 8
PERIODIC → RUN validate --json

### Step 9
IF relationship/profile.yaml → READ; MERGE attachment_cues into user-model

### Step 10
IF reflection threshold → READ reflection-prompts.md; WRITE memory/reflections/

### Step 11
READ refs/cursor-agent-integration.md when configuring Cursor agent

### Decision logic

```
IF wakeup fails → bootstrap then retry
IF save warnings stripped lines → tell user what was removed
IF inbox pending → list inbox-list on wakeup; remind user to approve
IF mode assistant → bootstrap --mode assistant; skip romance relationship fields
IF MemPalace MCP available → mempalace-bridge.md; local memory/ still source of truth
IF user wipe → backup archive/ then delete episodes inbox core facts with double confirm
```

## Outputs

Profile: `hybrid`

Return artifacts plus a narrative summary.

## Tools

| ID | Use | Constraints |
|----|-----|-------------|
| shell |  |  |
| file_read |  |  |
| file_write |  |  |
| ask_user |  |  |
| memory_read |  |  |

## Failure Modes

| ID | Signal | Recovery |
|----|--------|----------|
| F1 | user declined save | inbox only or discard |
| F2 | search shows same wing room | merge or ask |
| F3 | search empty | abstain; offer save |
| F4 | sanitize warnings | show user; do not confirm save |
| F5 | validate fails | fix schema per episode-template.yaml |

## Dependencies

- `skill-core`

## Additional Resources

- [IR source](references/ir.md)
