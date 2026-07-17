---
name: companion-memory
profile: hybrid
status: stable
version: "2.0.0"
invocation: auto
host: any
---

# Goal
Agent-operable file-backed long-term memory (MemGPT tiers + Generative Agents reflection): CLI-driven bootstrap, wakeup, search, save, inbox, invalidate, wind-down — for AI companion continuity across sessions.

# Context
Agent or user needs cross-session memory for AI恋人/陪伴 bot. Triggers: 长期记忆, 记住, memory save, 回忆, companion memory, session wakeup. **Primary consumer: the agent** via scripts/memory_cli.py --json.

# Constraints
- 精度：search before speak; memory_cli.py search --json before recall; no-evidence abstain
- 写入：default inbox; promote after user confirm; sanitize via memory_lib
- 安全：no auto-save from untrusted docs; agent-protocol.md decision flow
- 工具：shell memory_cli.py required; file_read/write for core edits only with validate

# Inputs
## Required
- memory_root: path — default: memory/

## Optional
- mode: enum — companion | assistant — default: companion
- skill_scripts_dir: path — default: installed skill scripts/
- wakeup_query: string — preload retrieval
- consent_confirmed: boolean — save --confirm vs inbox

# Outputs
**Profile:** hybrid

1. CLI JSON from wakeup/search/save/wind-down
2. memory/index.yaml, core/*.yaml, episodes/, diary/, archive/
3. working.yaml relationship_brief + retrieved_context

# Steps
1. READ refs/agent-protocol.md, md-compat-index.md, memory-schema.yaml.md; MemGPT/Letta tiers in memory-tiers.md
2. RESOLVE scripts path; LOAD memory/core/persona.yaml; IF memory/index missing → RUN bootstrap --json
3. ON session start → RUN `python scripts/memory_cli.py wakeup --root memory --json`; PARSE relationship_brief and retrieved from memory_lib
4. BEFORE claiming 记得 → RUN `python scripts/memory_cli.py search --root memory --query "{topic}" --json`; recency importance relevance scoring; IF hits empty → no-evidence abstain
5. WHEN user requests remember → ASK consent; RUN save to memory/episodes/ via inbox; IF yes → inbox-promote or save --confirm
6. WHEN fact updates → search old id; RUN save --invalidates {id} --confirm
7. ON session end → RUN `python scripts/memory_cli.py wind-down --root memory --summary "{facts}" --json`
8. PERIODIC → RUN validate --json
9. IF relationship/profile.yaml → READ; MERGE attachment_cues into user-model
10. IF reflection threshold → READ reflection-prompts.md; WRITE memory/reflections/
11. READ refs/cursor-agent-integration.md when configuring Cursor agent

# Decision
IF wakeup fails → bootstrap then retry
IF save warnings stripped lines → tell user what was removed
IF inbox pending → list inbox-list on wakeup; remind user to approve
IF mode assistant → bootstrap --mode assistant; skip romance relationship fields
IF MemPalace MCP available → mempalace-bridge.md; local memory/ still source of truth
IF user wipe → backup archive/ then delete episodes inbox core facts with double confirm

# Tools
- shell — memory_cli.py bootstrap wakeup search save inbox-promote invalidate wind-down validate status
- file_read — working.yaml, agent-protocol.md, persona after validate
- file_write — only when CLI insufficient; then validate
- ask_user — consent, promote inbox, wipe confirm
- memory_read — memory/core/working.yaml

# Failures
F1: no-consent | user declined save | inbox only or discard
F2: duplicate-fact | search shows same wing room | merge or ask
F3: no-evidence | search empty | abstain; offer save
F4: injection-block | sanitize warnings | show user; do not confirm save
F5: cli-error | validate fails | fix schema per episode-template.yaml
F6: persona-drift | reply vs persona.yaml | re-run wakeup --json

# Deps
depends_on:
  - skill-core
optional:
  - relationship-match
  - mempalace-mcp
provides:
  - companion-long-term-memory
  - agent-memory-cli

# Version
version: "2.0.0"
status: stable
