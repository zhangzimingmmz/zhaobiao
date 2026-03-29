#!/bin/bash
# 迁移到阿里云服务器脚本
# 使用方法：./scripts/migrate-to-aliyun.sh <新服务器IP> <域名>

set -e

NEW_SERVER_IP=$1
DOMAIN=$2

if [ -z "$NEW_SERVER_IP" ] || [ -z "$DOMAIN" ]; then
    echo "使用方法: $0 <新服务器IP> <域名>"
    echo "例如: $0 47.xxx.xxx.xxx yourdomain.com"
    exit 1
fi

API_DOMAIN="api.$DOMAIN"
ADMIN_DOMAIN="admin.$DOMAIN"

echo "=========================================="
echo "迁移到阿里云服务器"
echo "=========================================="
echo "新服务器 IP: $NEW_SERVER_IP"
echo "API 域名: $API_DOMAIN"
echo "管理后台域名: $ADMIN_DOMAIN"
echo "=========================================="
echo ""

# 步骤 1: 备份当前数据
echo "步骤 1: 备份当前数据..."
BACKUP_FILE="data-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $BACKUP_FILE data/ .env.backend
echo "✓ 备份完成: $BACKUP_FILE"
echo ""

# 步骤 2: 上传备份到新服务器
echo "步骤 2: 上传备份到新服务器..."
echo "请确保已经配置了 SSH 密钥或准备输入密码"
scp $BACKUP_FILE root@$NEW_SERVER_IP:/tmp/
echo "✓ 上传完成"
echo ""

# 步骤 3: 在新服务器上执行初始化
echo "步骤 3: 在新服务器上执行初始化..."
ssh root@$NEW_SERVER_IP << 'ENDSSH'
set -e

echo "更新系统..."
apt update && apt upgrade -y

echo "安装基础工具..."
apt install -y git curl wget vim htop ufw

echo "安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

echo "安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✓ 初始化完成"
ENDSSH
echo ""

# 步骤 4: 部署项目
echo "步骤 4: 部署项目到新服务器..."
ssh root@$NEW_SERVER_IP << ENDSSH
set -e

# 克隆代码
cd /opt
if [ -d "zhaobiao" ]; then
    echo "项目目录已存在，更新代码..."
    cd zhaobiao
    git pull
else
    echo "克隆项目代码..."
    git clone https://github.com/your-repo/zhaobiao.git
    cd zhaobiao
fi

# 解压备份
echo "恢复数据..."
tar -xzf /tmp/$BACKUP_FILE
rm /tmp/$BACKUP_FILE

# 修改配置
echo "更新配置..."
sed -i 's/API_PUBLISH_BIND=.*/API_PUBLISH_BIND=0.0.0.0:8000/' .env.backend
sed -i 's/ADMIN_FRONTEND_PUBLISH_BIND=.*/ADMIN_FRONTEND_PUBLISH_BIND=0.0.0.0:8091/' .env.backend

# 启动服务
echo "启动服务..."
docker-compose -f docker-compose.backend.yml up -d

echo "✓ 项目部署完成"
ENDSSH
echo ""

# 步骤 5: 配置 Nginx
echo "步骤 5: 配置 Nginx 和 SSL..."
ssh root@$NEW_SERVER_IP << ENDSSH
set -e

# 安装 Nginx 和 Certbot
apt install -y nginx certbot python3-certbot-nginx

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/zhaobiao << 'EOF'
server {
    listen 80;
    server_name $API_DOMAIN;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name $ADMIN_DOMAIN;
    
    location / {
        proxy_pass http://127.0.0.1:8091;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/zhaobiao /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

echo "✓ Nginx 配置完成"
echo ""
echo "请手动执行以下命令配置 SSL 证书："
echo "  certbot --nginx -d $API_DOMAIN"
echo "  certbot --nginx -d $ADMIN_DOMAIN"
ENDSSH
echo ""

# 步骤 6: 设置自动备份
echo "步骤 6: 设置自动备份..."
ssh root@$NEW_SERVER_IP << 'ENDSSH'
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /opt/zhaobiao/data/notices.db $BACKUP_DIR/notices_$DATE.db
find $BACKUP_DIR -name "notices_*.db" -mtime +7 -delete
echo "Backup completed: $DATE"
EOF

chmod +x /opt/backup.sh

# 添加定时任务
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup.sh >> /var/log/backup.log 2>&1") | crontab -

echo "✓ 自动备份配置完成"
ENDSSH
echo ""

echo "=========================================="
echo "迁移完成！"
echo "=========================================="
echo ""
echo "后续步骤："
echo "1. 配置 SSL 证书："
echo "   ssh root@$NEW_SERVER_IP"
echo "   certbot --nginx -d $API_DOMAIN"
echo "   certbot --nginx -d $ADMIN_DOMAIN"
echo ""
echo "2. 测试 API："
echo "   curl https://$API_DOMAIN/openapi.json"
echo ""
echo "3. 更新小程序配置："
echo "   修改 miniapp/src/config.ts 中的 baseUrl"
echo "   重新编译并上传小程序"
echo ""
echo "4. 配置小程序服务器域名："
echo "   在微信公众平台添加 https://$API_DOMAIN"
echo ""
echo "=========================================="
