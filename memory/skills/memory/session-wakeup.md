# 会话唤醒（Agent 版）

**Agent 不要手拼 brief** — 一律调用 CLI。

## W1 — Bootstrap（若需要）

```bash
python scripts/memory_cli.py bootstrap --root memory --persona-name "{name}" --json
```

## W2 — Wakeup

```bash
python scripts/memory_cli.py wakeup --root memory --json
# 或带预检索:
python scripts/memory_cli.py wakeup --root memory --query "{likely topic}" --json
```

解析 JSON 字段：

| 字段 | 用途 |
|------|------|
| `relationship_brief` | 注入本轮人设+关系语境 |
| `retrieved` | 预加载相关 episodes |
| `persona` | 语气、limits |
| `latest_diary` | 上次会话摘要 |

## W3 — 检查 inbox

```bash
python scripts/memory_cli.py inbox-list --root memory --json
```

若有 pending → 问用户是否 promote。

## W4 — 行为约束

- 引用过去 → 先 `search --json`
- 写入 → `save` / `inbox-promote` 流程
- 结束 → `wind-down`

详见 `agent-protocol.md`。
