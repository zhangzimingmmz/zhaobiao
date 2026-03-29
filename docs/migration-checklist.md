# 迁移到阿里云服务器检查清单

## 迁移前准备

### 1. 服务器购买
- [ ] 购买阿里云轻量应用服务器（2核2G，40GB SSD）
- [ ] 选择 Ubuntu 22.04 LTS 系统
- [ ] 记录公网 IP：`_______________`
- [ ] 配置安全组，开放端口：22, 80, 443

### 2. 域名准备
- [ ] 准备域名：`_______________`
- [ ] 配置 DNS 解析：
  - [ ] A 记录：`api.yourdomain.com` → 新服务器 IP
  - [ ] A 记录：`admin.yourdomain.com` → 新服务器 IP
- [ ] 等待 DNS 生效（可能需要几分钟到几小时）

### 3. 数据备份
- [ ] 备份数据库：`data/notices.db`
- [ ] 备份配置文件：`.env.backend`
- [ ] 备份大小：`_______________`
- [ ] 备份位置：`_______________`

---

## 迁移执行

### 4. 新服务器初始化
- [ ] SSH 登录成功：`ssh root@<新服务器IP>`
- [ ] 系统更新完成：`apt update && apt upgrade -y`
- [ ] Docker 安装完成：`docker --version`
- [ ] Docker Compose 安装完成：`docker-compose --version`
- [ ] 防火墙配置完成：`ufw status`

### 5. 项目部署
- [ ] 代码克隆完成：`/opt/zhaobiao`
- [ ] 数据恢复完成：`data/notices.db` 存在
- [ ] 配置文件更新：`.env.backend` 已修改
- [ ] Docker 容器启动：`docker-compose ps` 显示 running
- [ ] API 可访问：`curl http://localhost:8000/openapi.json`
- [ ] 管理后台可访问：`curl http://localhost:8091`

### 6. Nginx 和 SSL 配置
- [ ] Nginx 安装完成
- [ ] Nginx 配置文件创建：`/etc/nginx/sites-available/zhaobiao`
- [ ] Nginx 配置启用：`/etc/nginx/sites-enabled/zhaobiao`
- [ ] Nginx 测试通过：`nginx -t`
- [ ] Certbot 安装完成
- [ ] SSL 证书申请成功（API 域名）
- [ ] SSL 证书申请成功（管理后台域名）
- [ ] HTTPS 访问成功：`curl https://api.yourdomain.com/openapi.json`

---

## 应用配置更新

### 7. 小程序配置
- [ ] 更新 `miniapp/src/config.ts` 中的 `baseUrl`
- [ ] 重新编译小程序：`npm run build:weapp`
- [ ] 使用微信开发者工具上传新版本
- [ ] 提交审核

### 8. 微信公众平台配置
- [ ] 配置服务器域名：
  - [ ] request 合法域名：`https://api.yourdomain.com`
  - [ ] uploadFile 合法域名：`https://api.yourdomain.com`
  - [ ] downloadFile 合法域名：`https://api.yourdomain.com`

---

## 测试验证

### 9. API 测试
- [ ] 健康检查：`curl https://api.yourdomain.com/openapi.json`
- [ ] 列表接口：`curl https://api.yourdomain.com/api/list?page=1&pageSize=10`
- [ ] 详情接口测试
- [ ] 登录接口测试
- [ ] 管理后台访问：`https://admin.yourdomain.com`

### 10. 小程序测试
- [ ] 小程序启动正常
- [ ] 首页列表加载正常
- [ ] 详情页显示正常
- [ ] 登录注册功能正常
- [ ] 收藏功能正常
- [ ] 搜索筛选功能正常
- [ ] 复制原文链接功能正常

### 11. 管理后台测试
- [ ] 管理员登录成功
- [ ] 审核列表显示正常
- [ ] 审核操作正常
- [ ] 企业管理功能正常
- [ ] 爬虫管理功能正常
- [ ] 文章管理功能正常

### 12. 爬虫测试
- [ ] 查看爬虫日志：`docker-compose logs scheduler`
- [ ] 手动触发爬虫测试
- [ ] 爬虫数据入库正常
- [ ] 定时任务执行正常

---

## 监控和优化

### 13. 监控设置
- [ ] 安装监控工具：`htop`, `iotop`, `nethogs`
- [ ] 检查资源使用：`htop`
- [ ] 检查容器状态：`docker stats`
- [ ] 检查磁盘使用：`df -h`
- [ ] 检查内存使用：`free -h`

### 14. 日志管理
- [ ] 配置日志轮转：`/etc/logrotate.d/docker-containers`
- [ ] 测试日志轮转：`logrotate -f /etc/logrotate.conf`

### 15. 自动备份
- [ ] 创建备份脚本：`/opt/backup.sh`
- [ ] 设置定时任务：`crontab -l` 显示备份任务
- [ ] 测试备份脚本：`/opt/backup.sh`
- [ ] 检查备份文件：`ls -lh /opt/backups/`

---

## 旧服务器处理

### 16. 切换流量
- [ ] 确认新服务器运行稳定（至少观察24小时）
- [ ] 更新所有客户端配置指向新服务器
- [ ] 监控新服务器负载和错误日志

### 17. 旧服务器下线
- [ ] 停止旧服务器上的服务
- [ ] 保留旧服务器数据备份（至少1个月）
- [ ] 确认无遗留问题后，可以释放旧服务器资源

---

## 应急预案

### 18. 回滚准备
- [ ] 保留旧服务器配置和数据
- [ ] 记录旧服务器 IP 和配置
- [ ] 准备快速回滚步骤

### 19. 问题排查
如果遇到问题，按以下顺序排查：

1. **服务无法启动**
   ```bash
   docker-compose -f docker-compose.backend.yml logs
   ```

2. **API 无法访问**
   ```bash
   curl http://localhost:8000/openapi.json
   nginx -t
   systemctl status nginx
   ```

3. **SSL 证书问题**
   ```bash
   certbot certificates
   certbot renew --dry-run
   ```

4. **数据库问题**
   ```bash
   sqlite3 data/notices.db ".tables"
   sqlite3 data/notices.db "SELECT COUNT(*) FROM notices;"
   ```

5. **爬虫问题**
   ```bash
   docker-compose -f docker-compose.backend.yml logs scheduler
   ```

---

## 联系信息

- 阿里云工单：https://workorder.console.aliyun.com/
- 域名服务商：`_______________`
- 备份位置：`_______________`

---

## 迁移完成确认

- [ ] 所有测试通过
- [ ] 监控正常运行
- [ ] 备份正常执行
- [ ] 用户反馈正常
- [ ] 性能满足要求

**迁移完成日期：** `_______________`

**迁移负责人：** `_______________`

**备注：**
```
_______________________________________________
_______________________________________________
_______________________________________________
```
