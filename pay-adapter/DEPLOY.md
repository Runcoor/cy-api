# pay-adapter 部署教程

易支付 → 虎皮椒协议转换适配器。无数据库，纯无状态转发服务。

## 架构

```
用户(国内) → Caddy(HTTPS) → pay-adapter(Docker) → 虎皮椒API
虎皮椒回调 → Caddy → pay-adapter → aggre-api(美国VPS)
```

## 前置要求

- 香港 VPS（最低配置即可：1核 512MB）
- 一个域名（用子域名 `pay.yourdomain.com` 指向香港 VPS）
- Docker 已安装

---

## 1. 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
```

## 2. 安装 Caddy

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
```

## 3. DNS 解析

在你的域名 DNS 管理面板中添加一条 A 记录：

| 类型 | 名称 | 值 | 代理/CDN |
|------|------|----|----------|
| A | pay | 香港 VPS 的公网 IP | **关闭**（不要开 CDN） |

> 虎皮椒回调不能走 CDN，必须直连。

## 4. 配置 Caddy

编辑 Caddy 配置文件：

```bash
vi /etc/caddy/Caddyfile
```

写入以下内容（替换你的域名）：

```caddyfile
pay.yourdomain.com {
    reverse_proxy 127.0.0.1:8000
}
```

启动 Caddy（自动申请 Let's Encrypt 证书）：

```bash
systemctl enable --now caddy
```

验证证书是否正常：

```bash
# 等待约 30 秒让证书签发完成
curl -I https://pay.yourdomain.com/health
# 应返回 HTTP/2 200
```

> Caddy 会自动续期证书，无需任何 cron 任务。

## 5. 部署 pay-adapter

```bash
# 上传代码到服务器
mkdir -p /opt/pay-adapter
cd /opt/pay-adapter
# （把代码文件传上来：scp、git clone、或直接复制）

# 创建配置
cp .env.example .env
vi .env
```

`.env` 需要填写的内容：

```bash
# 自定义（与 aggre-api 后台一致）
EPAY_PID=10001
EPAY_KEY=一个随机密钥比如用 openssl rand -hex 16 生成

# 从虎皮椒后台获取
HUPI_APPID=你的appid
HUPI_APPSECRET=你的appsecret

# 本服务地址（Caddy 提供 HTTPS）
BRIDGE_URL=https://pay.yourdomain.com

# aggre-api 地址
NEW_API_BASE_URL=https://api.yourdomain.com
```

一键部署：

```bash
bash deploy.sh
```

## 6. 配置 aggre-api

进入 aggre-api 管理后台 → 运营设置 → 充值设置 → 开启易支付：

| 配置项 | 值 |
|--------|----|
| 支付网关地址 | `https://pay.yourdomain.com/` |
| 商户 PID | 与 .env 中 `EPAY_PID` 一致 |
| 商户 KEY | 与 .env 中 `EPAY_KEY` 一致 |

---

## 日常运维

### 查看日志

```bash
cd /opt/pay-adapter

# 实时日志
docker compose logs -f

# 最近 100 行
docker compose logs --tail 100
```

### 重启服务

```bash
docker compose restart
```

### 更新代码后重新部署

```bash
# 更新代码文件后
docker compose up -d --build
```

### 查看容器状态

```bash
docker compose ps
```

输出示例：
```
NAME          STATUS                    PORTS
pay-adapter   Up 2 hours (healthy)      127.0.0.1:8000->8000/tcp
```

`(healthy)` 表示健康检查通过，服务正常运行。

---

## 迁移到新机器

### 在老机器上打包

```bash
cd /opt/pay-adapter
bash migrate.sh pack
```

会生成 `pay-adapter-backup.tar.gz`，包含所有代码和 `.env` 配置。

### 传输到新机器

```bash
scp pay-adapter-backup.tar.gz root@新机器IP:/opt/
```

### 在新机器上恢复

```bash
cd /opt
tar xzf pay-adapter-backup.tar.gz
cd pay-adapter
bash migrate.sh restore
```

然后安装并配置 Caddy（步骤 2 和 4），更新 DNS 解析指向新 IP。

---

## 故障排查

### 用户付款后额度未到账

```bash
# 查看是否收到虎皮椒回调
docker compose logs | grep "Hupi notify"

# 查看是否成功通知 aggre-api
docker compose logs | grep "Notify"
```

可能原因：
- `Notify error` → aggre-api 不可达，检查 `NEW_API_BASE_URL` 配置和网络
- `Notify unexpected` → aggre-api 返回非 `success`，检查 aggre-api 的易支付配置（PID/KEY 是否匹配）
- 没有任何 `Hupi notify` 日志 → 虎皮椒回调未到达，检查 DNS 和防火墙

### 支付页面报 502

```bash
docker compose logs | grep "Hupi API"
```

可能原因：
- `Hupi API error` → 无法连接虎皮椒，检查网络
- `Hupi API rejected` → 虎皮椒返回错误，检查 `HUPI_APPID` 和 `HUPI_APPSECRET`

### 支付页面报 403

签名验证失败。检查 aggre-api 后台的 PID/KEY 与 `.env` 中的是否完全一致。
