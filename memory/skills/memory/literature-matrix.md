# 文献与工程对照

> 供 companion-memory 设计溯源；实施以本 theme `refs/` 与 `memory/` 文件为准。

## 学术论文

| 工作 | 贡献 | 本 skill 采纳 |
|------|------|---------------|
| [MemGPT (Packer et al., 2023)](https://arxiv.org/abs/2310.08560) | OS 式 virtual context；main vs external；function 自主换页 | 五层 + core/working 块；显式 retrieve/evict |
| [Generative Agents (Park et al., 2023)](https://arxiv.org/abs/2304.03442) | Memory stream；reflection；planning；三维检索 | episodes + reflections；检索打分 |
| [LongMemEval (Wu et al., ICLR 2025)](https://arxiv.org/abs/2410.10813) | 500 题 benchmark；index/retrieve/read；session 分解 | 时间戳、fact 粒度、知识更新失效 |
| [Gemini 1.5 (Gemini Team, 2024)](https://arxiv.org/abs/2403.05530) | 超长 context 作「伪记忆」 | 仅作 L1 补充；仍要外存 |
| [Gemini 2.5 tech report (2025)](https://arxiv.org/abs/2507.06261) | Agentic 长上下文工作流 | session 快照 + 检索混合 |

## 大厂 / 产品工程

| 系统 | 机制 | 风险/教训 | 本 skill |
|------|------|-----------|----------|
| **Google Gemini Memory** | 跨会话 user facts 文件；save 工具 | [Prompt injection 污染长期记忆](https://embracethered.com/blog/posts/2025/gemini-memory-persistence-prompt-injection/)；需用户可见 save | `consent-security.md`；inbox 确认 |
| **Gemini CLI save_memory** | 工具 + eval 防 markdown 注入 | [PR #18091](https://github.com/google-gemini/gemini-cli/pull/18091) 安全加固 | 消毒写入；禁止未审 untrusted 文档 |
| **OpenAI ChatGPT Memory** | 自动提取偏好 | 用户可查看/删除 | 用户可编辑 `memory/core/user-model.yaml` |
| **Letta (MemGPT OSS)** | Core / Recall / Archival 三层 | [Agent Memory 博客](https://www.letta.com/blog/agent-memory) | 映射见 `memory-tiers.md` |
| **Mem0** | 分层抽取 + 多信号检索；LoCoMo/LongMemEval | [ECAI 2025 paper](https://arxiv.org/abs/2504.19413) | fact 原子化索引 |
| **Zep** | 时序知识图 | 工业对话记忆 | 可选 `relationship.yaml` 边 |

## 开源 Skill / 参考实现

| 项目 | 特点 | 借鉴 |
|------|------|------|
| **[MemPalace](https://github.com/MemPalace/mempalace)** | Wing/Room/Drawer；verbatim；MCP 29 tools；diary | `palace-taxonomy.md`；Discovery First |
| **generative-agents-skill** (OpenClaw) | Stanford 架构 skill 化 | observe/reflect/plan 步骤 |
| **Mastra Observational Memory** | LongMemEval SOTA 路线 | 观察者摘要链（可选 reflection） |

## Benchmark 能力对照（LongMemEval 六类）

| 类别 | 含义 | skill 机制 |
|------|------|------------|
| single-session user | 本轮用户事实 | L1 session log |
| single-session preference | 偏好 | user-model + episodes |
| knowledge update | 偏好变更 | invalidate + 新 fact |
| temporal reasoning | 时间先后 | ISO 时间戳 + timeline |
| multi-session | 跨会话推理 | L2 episodes 检索 |
| abstention | 无证据不答 | F3 no-evidence |

## 延伸阅读

- LoCoMo：多会话社交对话记忆 benchmark
- BEAM：百万/千万 token 规模记忆评测
- Cognitive science：Baddeley working memory model — 解释 L0 vs L1 分工
