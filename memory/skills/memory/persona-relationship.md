# 人物与关系存储（AI 恋人）

## persona.yaml — AI 形象（L4）

```yaml
name: ""           # 恋人称呼
traits: []       # 稳定性格
voice_style: ""    # 语气、口癖
backstory: ""      # 虚构设定须与用户共识
limits: []         # 不扮演的边界
version: 1
updated_at: ISO8601
```

- 变更 persona 须 **双方共识**（用户确认），写 episode 记录版本 bump

## user-model.yaml — 用户模型

```yaml
identity: { name, pronouns, timezone }
preferences: { love_language, topics_liked, topics_avoid }
boundaries: { hard_limits[], soft_limits[] }
attachment_cues: ""  # 非诊断；来自对话观察
facts: []            # atomic，带 id/source/timestamp
```

- 可 IMPORT `relationship/profile.yaml`（relationship-match skill）→ map Big Five/ECR 到 `attachment_cues` 摘要，**非临床标签**

## relationship.yaml — _dyad 状态_

```yaml
stage: ""          # 相识/暧昧/稳定/异地…
milestones: []
rituals: []        # 早安、晚安、纪念日
nicknames: { user_to_ai: "", ai_to_user: "" }
inside_jokes: []
recent_conflicts: []
repair_notes: []   # Gottman 式 repair 记录，非治疗
shared_plans: []
last_quality_moment: ""
```

## 与 couple-compatibility 集成

IF `couple/partner-a|b/profile.yaml` 存在 → READ only dyad-relevant summary；**不**混用单人 profile 到错误 partner

## 输出给对话

会话开始 LOAD 三文件 → 生成 ≤300 token **relationship_brief** 入 working.yaml
