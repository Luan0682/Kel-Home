---
name: kel-home-frontend
description: Kel-Home-main前端的技术细节和功能模块
metadata: 
  node_type: memory
  type: project
---

## Kel-Home-main 前端详情

**位置：** `D:\Kel\Kel-Home-main\index.html`（单文件，~8825行）

**技术栈：**
- React 18.3.1（CDN加载，UMD版本）
- 无构建工具，纯HTML+内联JS
- PWA：manifest.json + sw.js
- 照片组件从GitHub CDN加载：`cdn.jsdelivr.net/gh/Luan0682/Kel-Home@main/photo-stack.js`

**功能模块：**
1. 聊天界面 — 主要交互区域
2. PhotoStack照片墙 — 照片堆叠浏览
3. 清单/小票系统（Receipt Sheet）— 带锯齿边缘的复古小票样式
4. Clawd像素宠物 — 桌面宠物动画（多种状态GIF）
5. 底部导航栏 — 图标+圆角卡片样式

**设计语言：**
- 暖色系：深色`#1A1815`、棕色`#68544B`、米色`#d6d2c8`
- 卡片圆角14px，阴影柔和
- 动画：fadeUp、slideIn、heartbeat、breathe
- 适配iOS safe-area

**Clawd精灵动画状态：**
bubble, building, carrying, conducting, debugger, error, happy, headphones-groove, idle-reading, idle, juggling, notification, react-annoyed, react-double-jump, sleeping, sweeping, thinking, typing

**关键注意：**
- 这个文件很大（8825行），修改时要精准定位不要全文重写
- 之前被意外关窗导致丢失重做过，所以要做好版本管理
- GitHub仓库：Luan0682/Kel-Home

**Why:** 避免每次重新读8000+行文件才知道结构
**How to apply:** 修改前端时，先根据功能模块定位行号区间，再精准编辑

[[project-structure]] [[new-home-project]]
