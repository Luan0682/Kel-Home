# MD 兼容视图 — `memory-schema.yaml`

> **权威源文件**：同目录 `memory-schema.yaml`（本文件由 `skill-core` 自动生成，请勿手改；改源文件后重新 `batch build` 或运行 compat 同步。）

| 项 | 值 |
|----|-----|
| 类型 | `yaml` |
| 路径 | `refs/memory-schema.yaml` |
| 用途 | 记忆宫殿 taxonomy、路径与检索权重；companion-memory Agent CLI。 |

## 内容

```yaml
version: "1.0"

# Palace taxonomy — Discovery First
wings:
  - id: user
    title: 用户
    rooms: [identity, preferences, boundaries, health-notes, life-events]
  - id: relationship
    title: 关系
    rooms: [milestones, rituals, nicknames, conflicts-repair, shared-plans]
  - id: ai-persona
    title: AI 形象
    rooms: [character, voice-style, backstory, limits]
  - id: sessions
    title: 会话归档
    rooms: [transcripts, summaries]

core_files:
  persona: memory/core/persona.yaml
  user_model: memory/core/user-model.yaml
  relationship: memory/core/relationship.yaml
  working: memory/core/working.yaml

paths:
  episodes: memory/episodes/
  reflections: memory/reflections/
  archive: memory/archive/sessions/
  diary: memory/diary/
  inbox: memory/inbox/

episode_schema:
  required: [id, timestamp, wing, room, content, source]
  optional: [importance, tags, invalidates, verbatim_ref, consent]

importance_scale: [1, 10]  # Generative Agents style

retrieval:
  top_k: 8
  weights:
    recency: 0.35
    importance: 0.25
    relevance: 0.40

consent:
  default: ask_before_write
  inbox_ttl_hours: 24

integration:
  relationship_profile: relationship/profile.yaml
  couple_session: couple/session.yaml
```
