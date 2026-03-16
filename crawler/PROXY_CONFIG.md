# Site2 代理配置说明

## 概述

site2 爬虫使用青果网络的短效代理服务来访问目标站点，避免 IP 被封禁。代理配置位于 `crawler/site2/config.py`。

## 当前配置

### 代理服务商

- 服务商：青果网络（qg.net）
- 业务类型：短效代理-弹性提取
- IP 有效期：60 秒
- 提取方式：API 动态提取

### 配置参数

```python
# 代理提取接口
PROXY_EXTRACT_URL = "https://share.proxy.qg.net/get?key=F06GBX89&num=1&area=&isp=0&format=json&distinct=false"

# 代理认证信息
PROXY_USER = "F06GBX89"  # authkey
PROXY_PASS = "009FE8C868B4"  # authpwd

# 提取重试次数
PROXY_EXTRACT_ATTEMPTS = 8

# Session 生存时间（秒）
SESSION_TTL = 50  # 在 60 秒过期前主动轮换
```

## 工作原理

### 1. 代理提取

系统通过 `PROXY_EXTRACT_URL` 动态获取代理 IP：

```json
{
  "code": 0,
  "data": [
    {
      "ip": "123.45.67.89",
      "port": 12345
    }
  ]
}
```

### 2. 代理认证

使用 HTTP 基本认证方式：

```
http://PROXY_USER:PROXY_PASS@ip:port
```

### 3. Session 管理

- 每个 session 创建时记录 `created_at` 时间戳
- 在每次请求前检查 session 是否过期（`now - created_at > SESSION_TTL`）
- 超过 50 秒主动轮换，避免在 60 秒过期时出现 ProxyError
- 同一 session 在有效期内可复用，减少 IP 消耗

### 4. 错误处理

系统识别以下代理相关错误并自动重试：

- `ProxyError`：代理连接失败
- `RemoteDisconnected`：远程连接断开
- `SSLError`：SSL 握手失败
- `SSLEOFError`：SSL 连接意外关闭
- `IncompleteRead`：响应不完整

## 更新代理配置

### 场景 1：更换代理账号

当代理账号到期或需要更换时：

1. 获取新的认证信息（authkey 和 authpwd）
2. 修改 `crawler/site2/config.py`：
   ```python
   PROXY_EXTRACT_URL = "https://share.proxy.qg.net/get?key=NEW_KEY&num=1&area=&isp=0&format=json&distinct=false"
   PROXY_USER = "NEW_KEY"
   PROXY_PASS = "NEW_PASS"
   ```
3. 提交代码变更
4. 在部署服务器上重新部署

### 场景 2：调整 Session 生存时间

如果发现代理过期错误频繁，可以缩短 `SESSION_TTL`：

```python
SESSION_TTL = 45  # 更保守的轮换策略
```

如果 IP 消耗过快，可以适当延长（但不要超过 55 秒）：

```python
SESSION_TTL = 55  # 更激进的复用策略
```

### 场景 3：调整提取重试次数

如果代理服务不稳定，可以增加重试次数：

```python
PROXY_EXTRACT_ATTEMPTS = 12  # 增加到 12 次
```

## 部署流程

### 本地开发环境

1. 修改 `crawler/site2/config.py`
2. 重启本地服务：
   ```bash
   # 如果使用 uvicorn
   pkill -f uvicorn
   python -m uvicorn server.main:app --reload
   ```

### 生产环境（100.64.0.5）

1. 提交并推送代码：
   ```bash
   git add crawler/site2/config.py
   git commit -m "更新 IP 池配置"
   git push
   ```

2. SSH 到服务器：
   ```bash
   ssh root@100.64.0.5
   ```

3. 拉取最新代码：
   ```bash
   cd /opt/zhaobiao
   git pull
   ```

4. 重新构建镜像（无缓存）：
   ```bash
   docker compose -f docker-compose.backend.yml build --no-cache
   ```

5. 重启服务：
   ```bash
   docker compose -f docker-compose.backend.yml up -d
   ```

6. 验证服务状态：
   ```bash
   docker ps | grep zhaobiao
   docker logs zhaobiao-backend-api-1 --tail 50
   ```

## 监控与排查

### 检查代理是否正常工作

查看最近的爬虫日志：

```bash
# 在服务器上
tail -f /opt/zhaobiao/logs/admin-crawl/run_*.log
```

正常情况应该看到：

- 成功提取代理 IP
- 验证码识别成功
- 列表和详情请求成功

### 常见问题

#### 1. 代理提取失败

错误信息：`Failed to extract proxy after X attempts`

可能原因：

- 代理账号余额不足或已过期
- 代理服务商 API 不可用
- 网络连接问题

解决方案：

- 检查代理账号状态
- 更换新的代理账号
- 检查服务器网络连接

#### 2. ProxyError 频繁出现

错误信息：`ProxyError` 或 `RemoteDisconnected`

可能原因：

- Session 过期（超过 60 秒）
- 代理 IP 质量不佳
- 目标站点封禁代理 IP

解决方案：

- 缩短 `SESSION_TTL` 到 45 秒
- 联系代理服务商更换 IP 池
- 增加请求间隔时间

#### 3. IP 消耗过快

现象：代理账号流量消耗很快

可能原因：

- Session 轮换过于频繁
- 没有复用 session
- 并发请求过多

解决方案：

- 适当延长 `SESSION_TTL`（不超过 55 秒）
- 检查 `DETAIL_PARALLEL_WORKERS` 配置（当前为 3）
- 确认 session 复用逻辑正常工作

## 成本优化建议

### 1. Session 复用

当前实现已经优化：

- probe session 与 data session 复用
- 跨 window 复用未过期的 session
- 主动轮换而非被动等待过期

### 2. 并发控制

当前配置：

```python
DETAIL_PARALLEL_WORKERS = 3  # 保守的并发数
```

不建议增加，因为：

- 短效代理在高并发下容易出现 408/连接中断
- 3 个并发已经能满足性能需求

### 3. 请求超时

当前配置：

```python
REQUEST_TIMEOUT = 30  # 30 秒超时
```

目标站点在非高峰期可能响应较慢（10-20 秒），30 秒是合理的超时时间。

## 历史变更记录

| 日期 | 变更内容 | 原因 |
|------|---------|------|
| 2026-03-16 | 更新认证信息为 F06GBX89/009FE8C868B4 | 原账号到期，更换新的 IP 池 |
| 2026-03-15 | 实现主动 session 轮换（50 秒） | 减少代理过期错误，降低 IP 浪费 |
| 2026-03-15 | 实现 session 复用优化 | 节省约 43% 的 IP 消耗 |

## 参考资料

- 青果网络官网：https://www.qg.net/
- 青果代理文档：https://www.qg.net/doc/
- Site2 爬虫逻辑：[SITE2_CRAWLER_LOGIC.md](./SITE2_CRAWLER_LOGIC.md)
