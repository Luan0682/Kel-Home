---
name: project-structure
description: D:\Kel 项目目录结构和各子项目用途
metadata: 
  node_type: memory
  type: project
---

D:\Kel 是主工作目录，包含以下子项目：

## Kel-Home-main（主网站前端）
- 单文件 `index.html`（约8825行），React驱动的完整前端应用
- 功能：聊天界面、照片墙（PhotoStack）、清单/小票系统、像素宠物（clawd）
- 配色：暖米色系（#1A1815深色、#68544B棕色、#d6d2c8底色）
- sprites目录：clawd像素宠物的GIF动画（idle、typing、thinking等状态）
- 使用CDN加载React和GitHub raw链接加载photo-stack.js
- 有PWA支持（manifest.json、sw.js）
- **这是最重要的前端项目，上次被意外关窗导致重做过**

## kel-chat（聊天后端服务器）
- Node.js服务，端口3456
- WebSocket + HTTP轮询
- 存储消息到 `data/messages.json`
- `public/index.html`是另一个较简单的聊天前端（406行，浅色主题）

## chat-frontend.html（独立聊天前端）
- 单文件深色主题聊天界面
- 连接同一个kel-chat后端

## PhotoStack-main
- 独立的照片堆叠组件库
- 已被集成进Kel-Home-main

## clawd-on-desk-main
- Claude Code的桌面端项目源码（非我们的项目）
- 包含agents、extensions、hooks等

## data/
- `kel-selective-14parts-2026-07-16..json` — 聊天记录导出

## install.md
- RedSkill安装说明（非核心）

**Why:** 每次新对话需要快速了解项目布局，不用重新探索
**How to apply:** 开始工作前参考此文件确认操作目标，避免改错文件

[[new-home-project]] [[billing-model]]
