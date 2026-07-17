# 反思（Reflection）与情节压缩

源自 Generative Agents：当 raw episodes 积累到阈值，合成高层洞察写回 L3。

## 触发条件（任一）

- 新增 episodes ≥ 10 自上次 reflection
- 用户请求「总结一下我们最近的关系」
- 会话结束且 session 标记 `significant: true`
- 距上次 reflection ≥ 7 天

## 步骤

1. LOAD 待处理 episodes（未 `reflected: true`）
2. CLUSTER by wing/room
3. PROMPT 结构：
   - 用户近期情绪/需求变化？
   - 关系 milestone 或 tension？
   - persona 一致性 note？
4. WRITE `memory/reflections/YYYY-MM-DD-{slug}.md`：
   - insights[]（每条 link episode ids）
   - open_questions[]
   - suggested_followups[]（AI 恋人可主动关心）
5. MARK episodes `reflected: true`
6. MERGE 稳定洞察 into `user-model.yaml` / `relationship.yaml`（需 consent 若敏感）

## 与 working memory

Reflection 输出摘要 ≤500 token 可进入 `working.yaml` 的 `session_brief`；全文留 reflections/。

## 观察者模式（可选，Mastra OM 启发）

长 session 可先写 **observation log**（第三人称事实列表），再 reflection — 减少叙事漂移。
