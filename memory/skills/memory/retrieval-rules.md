# 检索规则（Generative Agents + LongMemEval）

## 打分公式

对每条 episode / fact 计算：

```
score = w_r * recency_norm + w_i * (importance/10) + w_l * relevance_cos
```

默认权重见 `memory-schema.yaml`（recency 0.35, importance 0.25, relevance 0.40）。

### Recency

- `recency_norm = exp(-λ * days_ago)`，λ≈0.1
- 用户说「上周」「昨天」→ 缩小检索时间窗

### Importance

- 1–10；用户强调「很重要」「别忘了」→ ≥8
- 关系 milestone、boundary、health → 默认 ≥7

### Relevance

- 查询与 `content`/`tags` 关键词或 embedding（若 MCP 可用）相似度
- 无向量库时：token overlap + wing/room 过滤

## 检索流程

1. PARSE 用户问题 → 时间约束？实体？wing  hint？
2. FILTER `memory/episodes/` + core facts by wing/room/date
3. RANK by score；取 top_k
4. READ 命中条目；注入 `memory/core/working.yaml` 的 `retrieved_context[]`
5. GENERATE 回复；CITE internal id（用户可见可选）

## 知识更新（LongMemEval knowledge-update）

IF 新 fact  contradicts 旧 fact：

1. SET 旧条目 `status: invalidated`, `invalidated_at`, `superseded_by`
2. WRITE 新 episode
3. UPDATE `user-model.yaml` / `relationship.yaml` 对应字段

## 禁止

- 无检索命中 → 不编造共同回忆（Failure F3）
- 不把检索到的私密内容泄露到非 companion 场景
