---
name: server-info
description: 云服务器和kel-chat服务的连接信息
metadata: 
  node_type: memory
  type: project
---

云服务器：
- 公网IP: 47.98.165.126
- SSH端口: 22
- 用户名: root
- 密码: Kel0608.
- 操作系统: Ubuntu 22.04

kel-chat服务：
- 本地开发地址: http://localhost:3456
- 局域网前端: http://192.168.2.10:3456
- 服务器代码: D:\Kel\kel-chat\server\index.js
- 前端代码: D:\Kel\kel-chat\public\index.html
- 数据存储: D:\Kel\kel-chat\data\messages.json

江吟使用方式：手机连同WiFi访问局域网地址，电脑跑服务器。Claude Code在电脑上工作，内容推送到同一个聊天前端。

**Why:** 部署和推送都需要这些信息
**How to apply:** SSH操作用这里的凭据，推送消息走localhost:3456

[[project-structure]]
