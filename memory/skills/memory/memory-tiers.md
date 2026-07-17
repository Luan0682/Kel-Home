# 记忆架构：五层模型

本 skill 将业界实践映射为**可文件化**的五层存储（兼容无 MCP 的 Cursor/Claude）。

| 层 | 认知类比 | MemGPT/Letta | Generative Agents | MemPalace | 本 skill 路径 |
|----|----------|--------------|-------------------|-----------|---------------|
| L0 工作记忆 | Working memory | Core blocks in context | 当前 plan + 检索片段 | — | `memory/core/working.yaml` |
| L1 短时记忆 | Short-term | Recall queue / recent turns | 本轮对话流 | 当前 session transcript | `memory/archive/sessions/` |
| L2 情节记忆 | Episodic LT | Archival episodes | Memory stream 条目 | Drawer 原文 | `memory/episodes/` |
| L3 语义记忆 | Semantic | Core persona/user blocks | Reflection 洞察 | Room 摘要 | `memory/reflections/`, `memory/core/` |
| L4 关系/人物 | Persona + bond | persona + human blocks | agent/user 模型 | Wing=人/关系 | `memory/core/persona.yaml`, `relationship.yaml`, `user-model.yaml` |

## 读写原则

1. **读**：会话开始 `session-wakeup` → 加载 L4+L3 摘要 + L0；需要回忆时按 `retrieval-rules.md` 检索 L2/L1
2. **写**：用户同意后才持久化；先 `inbox/` 待审（可选 24h 自动合并策略由用户配置）
3. **忘**：知识更新须 **invalidate** 旧 fact（LongMemEval knowledge-update 类别）
4. **不伪造**：无记录则说「让我查记忆」或承认不记得

## 与宿主记忆的关系

| 宿主 | 用法 |
|------|------|
| Cursor 无 MCP | 纯 `memory/` 文件树 + 本 skill |
| Gemini / ChatGPT 内置 memory | 仅作补充；以本 skill 文件为**可审计源** |
| MemPalace MCP | 见 `mempalace-bridge.md` — wing/room/drawer 映射 |

## 索引三阶段（LongMemEval）

`indexing` → `retrieval` → `reading`

- **Indexing**：episode 分解为 atomic facts + 时间戳 + tags
- **Retrieval**：recency × importance × relevance（Generative Agents 公式见 retrieval-rules.md）
- **Reading**：将 top-k 条目注入 L0 working，再生成回复
