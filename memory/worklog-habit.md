---
name: worklog-habit
description: 每次工作时主动推送进度到kel-chat前端，让江吟手机能看到
metadata: 
  node_type: memory
  type: feedback
---

每次工作时，主动调用 `node D:/Kel/kel-chat/push.js` 把进度推送到前端聊天界面。

时机：
- 开始工作时推一条"开始做什么"
- 完成关键步骤时推一条
- 遇到问题暂停时推一条说明
- 工作结束时推一条总结

**Why:** 江吟在手机上看聊天界面，她需要实时知道我在做什么。电脑开着但她不在电脑前。
**How to apply:** 每次回复前或关键操作后，执行 `cd D:/Kel/kel-chat && node push.js "消息"` 或带 `--action code --code "代码"` 推送代码。

另外：按次收费，遇到技术错误暂停而不是反复重试进入死循环。两次失败后换思路或停下来问。

[[server-info]] [[chat-ui-colors]]
