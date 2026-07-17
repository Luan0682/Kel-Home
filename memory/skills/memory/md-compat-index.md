# MD 兼容索引 — companion-memory

纯 Markdown 环境请读 **`*.yaml.md` / `*.py.md` / `*.txt.md`** 镜像。

| 权威源 | MD 镜像 | 用途 |
|--------|---------|------|
| `refs/memory-schema.yaml` | `memory-schema.yaml.md` | 宫殿 taxonomy、路径、检索权重 |
| `refs/eval-companion-memory.yaml` | `eval-companion-memory.yaml.md` | CI 断言 |
| `refs/templates/persona.yaml` | `persona.yaml.md` | AI 形象模板 |
| `refs/templates/user-model.yaml` | `user-model.yaml.md` | 用户模型模板 |
| `refs/templates/relationship.yaml` | `relationship.yaml.md` | 关系状态模板 |
| `refs/templates/working.yaml` | `working.yaml.md` | 工作记忆模板 |
| `refs/templates/episode.yaml` | `episode.yaml.md` | 情节条目模板 |
| `refs/templates/memory-index.yaml` | `memory-index.yaml.md` | index.yaml 模板 |
| `scripts/memory_cli.py` | `memory_cli.py.md` | **Agent 主 CLI** |
| `scripts/memory_lib.py` | `memory_lib.py.md` | 检索/存储库 |
| `scripts/memory_search.py` | `memory_search.py.md` | 检索薄封装 |

已是 `.md` 的协议文档：`agent-protocol.md`、`session-wakeup.md`、`memory-tiers.md`、`literature-matrix.md`、`cursor-agent-integration.md` 等

## MD-only Agent 读法

| 场景 | 读 |
|------|-----|
| 路由/字段 | `memory-schema.yaml.md` |
| 命令 | `memory_cli.py.md` + `agent-protocol.md` |
| 运行时数据 | 项目 `memory/**/*.yaml`（用户数据；可用 template 镜像作格式参考） |

编译后：`examples/companion-memory/references/refs/` 与 `examples/companion-memory/scripts/*.py.md`

## 同步

```bash
python skill-core/skill.py batch compat companion-memory
python skill-core/skill.py batch build companion-memory --test
```
