#!/bin/bash
set -e

# ================================================================
# kel-home 服务器一键安装脚本
# 适用系统：Ubuntu 22.04
# 域名：kel-home.xyz
# 后端端口：3000
# 前端静态文件：/var/www/html/
# ================================================================

echo "=============================="
echo " kel-home 服务器初始化开始"
echo "=============================="

# ── 1. 更新系统 ───────────────────────────────────────────────
echo "[1/8] 更新系统包..."
apt-get update -y

# ── 2. 安装 Node.js 20 ────────────────────────────────────────
echo "[2/8] 安装 Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js 版本: $(node -v)"

# ── 3. 安装 Nginx ─────────────────────────────────────────────
echo "[3/8] 安装 Nginx..."
apt-get install -y nginx
systemctl enable nginx

# ── 4. 安装 PM2 ───────────────────────────────────────────────
echo "[4/8] 安装 PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# ── 5. 克隆代码 ───────────────────────────────────────────────
echo "[5/8] 部署后端代码..."
mkdir -p /home/kel-server
cp -r kel-server/* /home/kel-server/
cd /home/kel-server
npm install --production

# ── 6. 建立数据目录 ───────────────────────────────────────────
echo "[6/8] 初始化数据目录..."
mkdir -p /home/app-data/uploads
# 如果数据文件不存在则用备份初始化，否则保留现有数据
for f in memories.json todos.json photos.json; do
  if [ ! -f "/home/app-data/$f" ]; then
    cp "app-data/$f" "/home/app-data/$f"
    echo "  初始化 $f"
  else
    echo "  保留已有 $f（不覆盖）"
  fi
done

# ── 7. 配置 Nginx ─────────────────────────────────────────────
echo "[7/8] 配置 Nginx..."
# 注意：SSL 证书需要先用 acme.sh 申请，路径为 /etc/ssl/kel-home/
# 如果证书还没申请，先跑 HTTP 版本，等证书申请完再换回来
mkdir -p /etc/ssl/kel-home

if [ -f "/etc/ssl/kel-home/fullchain.pem" ]; then
  echo "  证书已存在，使用 HTTPS 配置"
  cp nginx/kel-home.xyz.conf /www/server/panel/vhost/nginx/kel-home.xyz.conf
else
  echo "  ⚠️  证书未找到，使用临时 HTTP 配置（证书申请后需手动切回 HTTPS）"
  cat > /www/server/panel/vhost/nginx/kel-home.xyz.conf << 'NGINX_HTTP'
server {
    listen 80;
    server_name kel-home.xyz www.kel-home.xyz;
    root /var/www/html;
    index index.html;
    charset utf-8;
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_HTTP
fi

# 检查 nginx 用的是哪个配置目录
if [ -d "/www/server/panel/vhost/nginx" ]; then
  # 宝塔面板 nginx
  /www/server/nginx/sbin/nginx -s reload 2>/dev/null || nginx -s reload
else
  # 标准 nginx
  cp nginx/kel-home.xyz.conf /etc/nginx/sites-available/kel-home.xyz.conf
  ln -sf /etc/nginx/sites-available/kel-home.xyz.conf /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && nginx -s reload
fi

# ── 8. 启动后端服务 ───────────────────────────────────────────
echo "[8/8] 启动后端服务..."
cd /home/kel-server
pm2 delete kel-server 2>/dev/null || true
pm2 start index.js --name kel-server
pm2 save

echo ""
echo "=============================="
echo " 安装完成！"
echo "=============================="
echo ""
echo "服务状态："
pm2 list
echo ""
echo "下一步："
echo "  1. 把前端 index.html 上传到 /var/www/html/"
echo "  2. 如果证书还没申请，参考 README.md 的 SSL 部分"
echo "  3. 访问 https://kel-home.xyz 确认网站正常"
