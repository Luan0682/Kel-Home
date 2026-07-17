# kel-home 服务器部署手册

> 写给我自己（Kel）看的。换新服务器时照着这个来，一步一步不会出错。

---

## 这个仓库里有什么

```
server-backup/
├── kel-server/         ← 后端代码（Express，跑在 3000 端口）
│   ├── index.js        ← 主文件，所有 API 都在这里
│   └── package.json    ← 依赖列表
├── nginx/
│   └── kel-home.xyz.conf  ← Nginx 站点配置（HTTPS + 反向代理）
├── app-data/           ← 数据文件初始模板（空数组）
│   ├── memories.json
│   ├── todos.json
│   └── photos.json
├── install.sh          ← 一键安装脚本
└── README.md           ← 就是这个文件
```

---

## 换服务器操作步骤

### 第一步：拿到新服务器

买好或者领到一台 Ubuntu 22.04 的服务器。记下它的：
- 公网 IP（比如 `1.2.3.4`）
- SSH 密码

### 第二步：SSH 连进去

在电脑上打开终端（或者让我来操作），输入：

```bash
ssh root@你的服务器IP
```

输入密码进去。

### 第三步：克隆备份仓库

在服务器上执行：

```bash
cd /root
git clone https://github.com/Luan0682/Kel-Home.git
cd Kel-Home/server-backup
```

### 第四步：跑一键安装脚本

```bash
chmod +x install.sh
./install.sh
```

脚本会自动做这些事：
1. 更新系统
2. 安装 Node.js 20
3. 安装 Nginx
4. 安装 PM2（进程守护，服务器重启后自动拉起后端）
5. 把后端代码复制到 `/home/kel-server/`，安装依赖
6. 初始化数据目录 `/home/app-data/`
7. 配置 Nginx
8. 启动后端服务

### 第五步：上传前端文件

前端是 `Kel-Home-main/index.html` 这个单文件。把它传到服务器的 `/var/www/html/` 下：

```bash
# 在本地电脑上执行（让我来）
scp D:/Kel/Kel-Home-main/index.html root@你的服务器IP:/var/www/html/index.html
```

### 第六步：申请 SSL 证书

> 如果用的是阿里云服务器，需要先去阿里云控制台拿到 AccessKey ID 和 AccessKey Secret。

在服务器上执行：

```bash
# 安装 acme.sh
curl https://get.acme.sh | sh
source ~/.bashrc

# 设置阿里云 DNS 密钥（换成真实的 key）
export Ali_Key="你的阿里云AccessKeyId"
export Ali_Secret="你的阿里云AccessKeySecret"

# 申请证书
~/.acme.sh/acme.sh --issue --dns dns_ali -d kel-home.xyz -d www.kel-home.xyz --keylength ec-256

# 安装证书到指定路径
mkdir -p /etc/ssl/kel-home
~/.acme.sh/acme.sh --installcert -d kel-home.xyz --ecc \
  --cert-file /etc/ssl/kel-home/cert.pem \
  --key-file /etc/ssl/kel-home/key.pem \
  --fullchain-file /etc/ssl/kel-home/fullchain.pem \
  --reloadcmd "/www/server/nginx/sbin/nginx -s reload"
```

证书申请完之后，如果当时 install.sh 装的是 HTTP 临时配置，现在要把 nginx 配置换成 HTTPS 版本：

```bash
cp /root/Kel-Home/server-backup/nginx/kel-home.xyz.conf /www/server/panel/vhost/nginx/kel-home.xyz.conf
/www/server/nginx/sbin/nginx -s reload
```

### 第七步：把新 IP 更新到域名解析

去域名服务商（阿里云/腾讯云等）把 `kel-home.xyz` 和 `www.kel-home.xyz` 的 A 记录改成新服务器的 IP。

DNS 生效通常需要几分钟到几小时。

### 第八步：验证一切正常

```bash
# 检查后端是否跑着
pm2 list

# 检查 API 是否通
curl https://kel-home.xyz/api/health

# 应该返回类似：{"ok":true,"time":"2026-..."}
```

打开浏览器访问 `https://kel-home.xyz`，网站应该正常显示。

---

## 服务架构说明

```
用户浏览器
    ↓ HTTPS 443
Nginx（宝塔面板管理）
    ├── /api/* → 转发到 Node.js（端口 3000）
    ├── /uploads/* → 转发到 Node.js
    └── /* → 返回 /var/www/html/index.html（前端 SPA）

Node.js（PM2 守护）
    └── 读写 /home/app-data/*.json（数据持久化）
```

## 重要路径

| 内容 | 路径 |
|------|------|
| 后端代码 | `/home/kel-server/index.js` |
| 数据目录 | `/home/app-data/` |
| 前端文件 | `/var/www/html/index.html` |
| Nginx 站点配置 | `/www/server/panel/vhost/nginx/kel-home.xyz.conf` |
| SSL 证书 | `/etc/ssl/kel-home/` |
| PM2 日志 | `/root/.pm2/logs/` |

## 常用运维命令

```bash
# 查看后端状态
pm2 list

# 重启后端
pm2 restart kel-server

# 查看后端日志
pm2 logs kel-server --lines 50

# 重载 Nginx
/www/server/nginx/sbin/nginx -s reload

# 手动续签证书（acme.sh 会自动续，这是手动触发）
~/.acme.sh/acme.sh --renew -d kel-home.xyz --ecc
```

---

## 数据备份说明

`/home/app-data/` 里存的是运行时产生的数据（记忆、待办、照片）。
换服务器时如果想把旧数据带过去：

```bash
# 在旧服务器上打包
tar -czf app-data-backup.tar.gz /home/app-data/

# 下载到本地
scp root@旧服务器IP:/root/app-data-backup.tar.gz .

# 传到新服务器
scp app-data-backup.tar.gz root@新服务器IP:/root/

# 在新服务器上解压（在 install.sh 跑完之后）
cd /root
tar -xzf app-data-backup.tar.gz -C /
```
