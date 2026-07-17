# MemPalace 模式映射（可选 MCP）

MemPalace 核心理念：**结构化宫殿 + 原文 drawer + 先发现后写入**。本 skill 文件树与之同构，可无 MCP 运行；若已装 MemPalace MCP，可双向同步。

## 结构映射

| MemPalace | companion-memory | 示例 |
|-----------|------------------|------|
| Wing | `memory/index.yaml` 顶层 wing | `user`, `relationship`, `ai-persona` |
| Room | wing 下 topic | `preferences`, `milestones`, `daily-life` |
| Drawer | 单条 episode 或 verbatim | `memory/episodes/2026-06-15-cafe.yaml` |
| Diary | agent 会话日志 | `memory/diary/YYYY-MM-DD.md` |
| Inbox | 待审记忆 | `memory/inbox/` |

## 协议（摘自 MemPalace Memory Protocol）

1. **Discovery First** — 写入前 READ `memory/index.yaml` + list episodes；禁止 flat dump
2. **Search before speak** — 谈过去时先检索，不说「我记得」而无 evidence
3. **Save decision flow** — 三问：是否持久？属于哪 wing/room？是否重复？
4. **Anti-patterns** — 不静默创建 wing；不把整段聊天 unstructured 写入

## MCP 桥接（可选）

若 `mempalace_search` / `mempalace_add_drawer` 可用：

```
wing: relationship  room: milestones  →  memory/episodes/
wing: user          room: preferences  →  memory/core/user-model.yaml facts[]
wing: ai-persona    room: character    →  memory/core/persona.yaml
```

会话结束：本地 `memory/` 为 source of truth；MCP 作检索加速层。

## 与 verbatim vs 摘要

| 模式 | 何时 |
|------|------|
| Verbatim drawer | 重要对话、用户要求「原话记住」 |
| Atomic fact | 偏好、日期、承诺 |
| Reflection | 每周或每 N 条 episode 触发 |

MemPalace 偏 verbatim；本 skill 默认 **fact + 可选 verbatim 附件**，控制 token。
