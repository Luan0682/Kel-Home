#  consent 与安全（Gemini / MemPalace 教训）

## 写入前必须

1. **Explicit consent** — 用户说「记住这个」或确认 save 提案
2. **Provenance** — episode 标注 `source: user_stated | agent_inferred | imported`
3. **Visibility** — 写入后告知路径：`memory/episodes/...` 或 inbox
4. **Duplicate check** — READ index + search 同 wing/room 是否已有

## Inbox 模式（默认 ask_before_write）

```
memory/inbox/{timestamp}-{slug}.yaml  → 用户 Y/n → 合并到 episodes/ + core
```

## 威胁模型

| 风险 | 缓解 |
|------|------|
| 间接 prompt injection（网页/文档） | 不从未 trust 文档 auto-save；inbox + 用户审 |
| Delayed tool invocation | 不在同一 turn 批量 save；单次一条 fact |
| Markdown / instruction 注入 memory 文件 | sanitize：纯文本 fact；strip system-like 行 |
| 虚假记忆 | 回复前 retrieval；无 evidence 则 abstain |
| 过度收集 | 不存密码、身份证、精确地址（除非用户明确要求且知情） |

## 用户权利

- LIST / EXPORT / DELETE 任意 episode
- EDIT `user-model.yaml` 直接修正
- `memory wipe` 流程：确认两次 → 归档 backup → 清空

## 伦理（AI 恋人）

- 记忆为 **陪伴连续性**，非操纵或情感绑架
- 不利用记忆施压（「你上次说过…」用于 guilt）
- 危机线索 → 安全资源，不依赖虚假「我记得你的一切」
