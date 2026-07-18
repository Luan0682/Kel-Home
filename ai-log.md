# 操作日志

---

## 2026-07-17

### 本轮工作背景
- git revert 已执行，回退到 `bba3f15`（服务器备份干净版本）
- 服务器部署已完成，域名可正常访问
- 三个bug都重新回来，需要逐一修复

### 操作记录

**1. 修复光标跳末尾 bug**
- 改了：`chat-frontend.html`
- 做了什么：加 `compositionstart/compositionend` 监听，输入法组合期间跳过高度重算，Enter键也加 `!composing` 保护
- 状态：✅ 完成

**2. 修复 API 保存 bug（刷新丢失）**
- 改了：`Kel-Home-main/index.html`
- 根本原因：`persist()` 函数里 `data` 对象缺少 `apiPresets` 字段，每次刷新都回退到默认值
- 修法：在 persist() 的 data 对象里加 `apiPresets: s.apiPresets`
- 顺带修了 saveApiDraft 里 url 字段用 `||` 导致无法清空的问题（改为 `!== undefined` 判断）
- 状态：✅ 完成

**3. 语音输入 bug → 整体重写输入框**
- 改了：`chat-frontend.html`（完全重写输入区域）
- 做了什么：删掉旧输入框所有代码，重新写干净版本
  - 多行 textarea，自动扩展高度，max-height 50vh
  - 底部工具栏：左模型选择 / 中上传按钮 / 右发送按钮
  - 只绑 input 事件做高度自适应，不绑 compositionstart/end，不拦截任何输入法事件
  - 回车 = 换行，只有点发送按钮才发送
  - 发送后清空、恢复高度、自动聚焦
- 已部署到服务器 /var/www/html/chat-frontend.html
- 状态：✅ 完成，等测试语音输入

---

### 输入框全部重做（主站）
- 改了：`Kel-Home-main/index.html`
- 做了什么：删掉受控 textarea + input/composition/高度 JS，重写 Claude App 风格 composer
  - 不受控 textarea（id=kel-composer-input），无 value/onInput/onKeyDown
  - CSS field-sizing:content + min-height + max-height:50vh
  - 底部栏：模型下拉占位 / 上传按钮 / 发送按钮（有内容才可点）
  - 只点发送才发消息，回车换行；发送后清空并聚焦
- 已部署：scp → 47.98.165.126:/var/www/html/index.html
- 状态：✅ 部署完成，等测试语音输入与发送

### 发送机制改回多条入队
- 改了：`Kel-Home-main/index.html`
- 回车=立刻变成用户气泡（可连发多条），发送键=一起调 API
- 输入法确认键用 isComposing 过滤，不绑 composition 事件
- 已部署服务器；GitHub push 暂时网络失败，本地已 commit f18ff0e
- PhotoStack：已接入多图展示，但不是一比一（见回复说明）

### 修复 JavaScript 语法错误
- 改了：`Kel-Home-main/index.html`
- 问题：`_mcpStartPolling()` 方法末尾多了个逗号 `},` → 应该是 `}`
- 原因：上次修复残留问题，class 方法之间不需要逗号分隔
- 定位方法：用 `node --check` 验证提取的 script 块，找到第 6412 行
- 修复后：语法检查通过，已部署到服务器
- 状态：✅ 完成，commit 77a6453（GitHub push 因网络失败暂未推送）

### 首页/音乐/聊天页重构（第一批可测）
- 改了：`Kel-Home-main/index.html`
- 首页：删聊天/纪念日/设置卡片；保留日历/日记；加正则/音乐；间距 gap 12px；计时器下加音乐迷你卡
- 音乐：新增全屏音乐页 `tab: music`，底栏改为主页/记忆库/聊天/音乐/设置
- 聊天列表：胶囊 Tab 改为 Chats / Soul / 设置；Soul 为折叠 Persona 编辑
- 聊天详情：头部胶囊 Tab Chat / Soul / 设置；设置页空白占位
- 已部署：`scp` → `/var/www/html/index.html`
- 本地备份 commit：`0c67d50`
- 状态：✅ 先上传供浏览器验证

### UI 细化：仅图标 + 主题间距
- 首页卡片 / 底栏：去掉中文标签，只留线性图标
- 底栏音乐位改回 MCP；音乐入口只保留首页卡片 + 迷你卡
- Settings 新增「主题」卡片：可调首页卡片间距
- Soul 折叠栏去掉 emoji
- 音乐页返回改为点英文 `Music`
- commit：`e2cd4f7`，已部署
- 状态：✅ 完成

### 主题尺寸滑块 + 聊天列表去标签 + 正则页收尾（2026-07-18）
- 改了：`Kel-Home-main/index.html`
- 主题页：补全 `homeCardSizeChange` / `homeCardSizeLabel` 绑定，卡片尺寸滑块真正可调并持久化
- 聊天列表：去掉顶部 Chats/Soul/设置 胶囊标签，只保留对话列表（更不挤）
- 聊天详情：保留 Soul / 设置入口（原样）
- 正则：首页卡片进完整 Regex 页，编辑仍在正则内容里，空状态已补
- 语法：`node --check` 通过
- 状态：已部署服务器 + force-with-lease 推到 GitHub master (46d2d91)

