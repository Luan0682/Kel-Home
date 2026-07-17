# MD 兼容视图 — `eval-companion-memory.yaml`

> **权威源文件**：同目录 `eval-companion-memory.yaml`（本文件由 `skill-core` 自动生成，请勿手改；改源文件后重新 `batch build` 或运行 compat 同步。）

| 项 | 值 |
|----|-----|
| 类型 | `yaml` |
| 路径 | `refs/eval-companion-memory.yaml` |
| 用途 | Skill 编译测试断言（eval）；CI `batch build --test` 读取 YAML 源文件。 |

## 内容

```yaml
tests:
  - id: T1
    description: agent CLI protocol
    assert:
      contains: ["agent-protocol.md", "memory_cli.py", "wakeup", "wind-down", "bootstrap"]
      sections: ["Quick Start", "Workflow", "Failure Modes"]

  - id: T2
    description: retrieval CLI
    assert:
      contains: ["memory_cli.py search", "recency", "importance", "relationship_brief", "MemGPT"]

  - id: T3
    description: consent inbox pipeline
    assert:
      contains: ["inbox-promote", "consent", "invalidate", "no-evidence", "abstain"]

  - id: T4
    description: agent store paths
    assert:
      contains: ["memory/episodes", "core/persona", "validate", "memory_lib"]
```
