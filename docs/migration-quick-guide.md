# 迁移快速指南

## 一、准备工作（1小时）

### 1. 购买服务器
```
阿里云轻量应用服务器
- 配置：2核2G，40GB SSD
- 系统：Ubuntu 22.04 LTS
- 价格：99元/年
```

### 2. 准备域名
```
需要两个子域名：
- api.yourdomain.com  → API 服务
- admin.yourdomain.com → 管理后台
```

### 3. 备份数据
```bash
cd /path/to/current/zhaobiao
tar -czf data-backup.tar.gz data/ .env.backend
```

---

## 二、自动化迁移（30分钟）

### 使用迁移脚本
```bash
# 在当前服务器上执行
cd /path/to/zhaobiao
chmod +x scripts/migrate-to-aliyun.sh
./scripts/migrate-to-aliyun.sh <新服务器IP> <域名>

# 例如：
./scripts/migrate-to-aliyun.sh 47.xxx.xxx.xxx yourdomain.com
```

脚本会自动完成：
- ✓ 备份当前数据
- ✓ 上传到新服务器
- ✓ 安装 Docker 和依赖
- ✓ 部署项目
- ✓ 配置 Nginx
- ✓ 设置自动备份

---

## 三、手动配置 SSL（10分钟）

```bash
# SSH 登录新服务器
ssh root@<新服务器IP>

# 申请 SSL 证书
certbot --nginx -d api.yourdomain.com
certbot --nginx -d admin.yourdomain.com

# 输入邮箱，同意条款，等待证书申请完成
```

---

## 四、更新小程序配置（20分钟）

### 1. 修改配置文件
```typescript
// miniapp/src/config.ts
export const config = {
  baseUrl: 'https://api.yourdomain.com',  // 改为新域名
}
```

### 2. 重新编译
```bash
cd miniapp
npm run build:weapp
```

### 3. 上传小程序
- 打开微信开发者工具
- 上传新版本
- 提交审核

### 4. 配置服务器域名
在微信公众平台 → 开发管理 → 开发设置 → 服务器域名：
- request 合法域名：`https://api.yourdomain.com`
- uploadFile 合法域名：`https://api.yourdomain.com`
- downloadFile 合法域名：`https://api.yourdomain.com`

---

## 五、测试验证（15分钟）

### 1. API 测试
```bash
# 健康检查
curl https://api.yourdomain.com/openapi.json

# 列表接口
curl https://api.yourdomain.com/api/list?page=1&pageSize=10

# 管理后台
curl https://admin.yourdomain.com
```

### 2. 小程序测试
- [ ] 启动小程序
- [ ] 测试列表加载
- [ ] 测试详情页
- [ ] 测试登录注册
- [ ] 测试收藏功能

### 3. 管理后台测试
- [ ] 访问 https://admin.yourdomain.com
- [ ] 测试登录
- [ ] 测试审核功能

---

## 六、监控和维护

### 查看服务状态
```bash
# 查看容器状态
docker-compose -f docker-compose.backend.yml ps

# 查看日志
docker-compose -f docker-compose.backend.yml logs -f

# 查看资源使用
htop
docker stats
```

### 查看备份
```bash
ls -lh /opt/backups/
```

### 重启服务
```bash
cd /opt/zhaobiao
docker-compose -f docker-compose.backend.yml restart
```

---

## 常见问题

### Q1: SSL 证书申请失败
**原因：** DNS 解析未生效或端口未开放

**解决：**
```bash
# 检查 DNS
nslookup api.yourdomain.com

# 检查端口
ufw status
netstat -tlnp | grep :80
```

### Q2: 小程序无法连接 API
**原因：** 服务器域名未配置或 SSL 证书问题

**解决：**
1. 检查微信公众平台的服务器域名配置
2. 确认 SSL 证书有效：`curl https://api.yourdomain.com/openapi.json`

### Q3: 数据库数据丢失
**原因：** 备份未正确恢复

**解决：**
```bash
# 检查数据库文件
ls -lh /opt/zhaobiao/data/notices.db

# 检查数据
sqlite3 /opt/zhaobiao/data/notices.db "SELECT COUNT(*) FROM notices;"
```

### Q4: 服务器内存不足
**原因：** 爬虫并发过高

**解决：**
```python
# 修改 crawler/site1/config.py 或 site2/config.py
DETAIL_PARALLEL_WORKERS = 2  # 降低并发数
```

### Q5: 爬虫不运行
**原因：** 定时任务未启动

**解决：**
```bash
# 查看 scheduler 日志
docker-compose -f docker-compose.backend.yml logs scheduler

# 重启 scheduler
docker-compose -f docker-compose.backend.yml restart scheduler
```

---

## 应急回滚

如果新服务器出现严重问题，需要回滚到旧服务器：

```bash
# 1. 停止新服务器
ssh root@<新服务器IP>
cd /opt/zhaobiao
docker-compose -f docker-compose.backend.yml down

# 2. 启动旧服务器
ssh root@<旧服务器IP>
cd /path/to/zhaobiao
docker-compose -f docker-compose.backend.yml up -d

# 3. 恢复 DNS 解析（如果已修改）
# 将域名解析改回旧服务器 IP

# 4. 回滚小程序配置
# 修改 miniapp/src/config.ts，改回旧地址
# 重新编译并上传
```

---

## 成本估算

| 项目 | 费用 | 说明 |
|------|------|------|
| 阿里云服务器 | 99元/年 | 2核2G，40GB SSD |
| 域名 | 50-100元/年 | .com 域名 |
| SSL 证书 | 免费 | Let's Encrypt |
| **总计** | **约150-200元/年** | |

---

## 时间估算

| 阶段 | 时间 | 说明 |
|------|------|------|
| 准备工作 | 1小时 | 购买服务器、准备域名 |
| 自动化迁移 | 30分钟 | 运行迁移脚本 |
| SSL 配置 | 10分钟 | 申请证书 |
| 小程序更新 | 20分钟 | 修改配置、编译、上传 |
| 测试验证 | 15分钟 | 全面测试 |
| **总计** | **约2小时** | 不含审核等待时间 |

---

## 联系支持

如果遇到问题，可以：
1. 查看详细文档：`docs/migration-checklist.md`
2. 查看日志：`docker-compose logs`
3. 提交 issue 到项目仓库
