#!/usr/bin/env bash
# pay-adapter 一键部署/更新脚本
# 用法: bash deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== pay-adapter deploy ==="

# 检查 .env
if [ ! -f .env ]; then
    echo "[!] .env 文件不存在，从模板创建..."
    cp .env.example .env
    echo "[!] 请编辑 .env 填入实际配置后重新运行此脚本"
    exit 1
fi

# 检查必填项
source .env
for var in EPAY_PID EPAY_KEY HUPI_APPID HUPI_APPSECRET BRIDGE_URL NEW_API_BASE_URL; do
    val="${!var:-}"
    if [ -z "$val" ] || [[ "$val" == *"your_"* ]] || [[ "$val" == *"yourdomain"* ]]; then
        echo "[!] 请先在 .env 中配置 $var"
        exit 1
    fi
done

# 构建并启动
echo "[*] 构建镜像并启动容器..."
docker compose up -d --build

# 等待健康检查
echo "[*] 等待服务就绪..."
for i in $(seq 1 15); do
    if curl -sf http://127.0.0.1:8000/health > /dev/null 2>&1; then
        echo "[OK] 服务已启动: http://127.0.0.1:8000"
        echo ""
        echo "下一步："
        echo "  1. 确保 Caddy 已配置反代（参考 DEPLOY.md）"
        echo "  2. 在 aggre-api 后台配置易支付网关为: ${BRIDGE_URL}/"
        exit 0
    fi
    sleep 2
done

echo "[!] 服务启动超时，请检查日志: docker compose logs"
exit 1
