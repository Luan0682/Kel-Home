# Cursor Agent 集成

## 安装

```bash
python skill-core/skill.py install examples/companion-memory --host cursor --scope project
```

Skill 位于 `{project}/.cursor/skills/companion-memory/`。

## 每个会话 Agent 必做

1. **Wakeup**（第一条用户消息前或 skill 激活时）  
   ```bash
   python .cursor/skills/companion-memory/scripts/memory_cli.py --root memory --json wakeup
   ```
2. 将 JSON 中 `relationship_brief` + `retrieved` 纳入回复规划  
3. 谈过去 → `search --json`  
4. 结束或切换话题长休 → `wind-down --summary "..."`

## User Rules 片段（可选）

粘贴到 Cursor **User Rules**：

```
When companion-memory skill is active or user expects AI lover continuity:
- On session start run memory_cli.py wakeup --json under project memory/
- Before claiming you remember something, run search --json
- Never fabricate shared memories; use no-evidence abstain
- On user "记住" run save (inbox) then ask confirm for inbox-promote
- On session end run wind-down with factual summary
Full protocol: read companion-memory references/refs/agent-protocol.md
```

## 与 relationship-match

1. 先跑 `relationship-match` → `relationship/profile.yaml`  
2. 装 `companion-memory` → wakeup 后 READ profile，写入 `user-model` attachment_cues 一行  
3. 后续对话由 episodes 累积，profile 仅作基线

## PyYAML

```bash
pip install pyyaml
```

## MemPalace

若已配 MCP，见 `mempalace-bridge.md`；**仍以本地 memory/ 为准**。
