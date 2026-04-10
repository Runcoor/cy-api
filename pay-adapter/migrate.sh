#!/usr/bin/env bash
# pay-adapter 迁移脚本
# 在老机器上打包，在新机器上解压即可运行
# 用法:
#   老机器: bash migrate.sh pack     → 生成 pay-adapter-backup.tar.gz
#   新机器: bash migrate.sh restore  → 解压并启动
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
BACKUP_FILE="pay-adapter-backup.tar.gz"

case "${1:-}" in
    pack)
        echo "=== 打包迁移文件 ==="
        # 只打包必要文件，排除运行时产物
        tar -czf "$BACKUP_FILE" \
            --exclude='__pycache__' \
            --exclude='.venv' \
            --exclude='.pytest_cache' \
            --exclude='pay-adapter-backup.tar.gz' \
            -C "$(dirname "$SCRIPT_DIR")" \
            "$(basename "$SCRIPT_DIR")"
        echo "[OK] 已打包: $SCRIPT_DIR/$BACKUP_FILE"
        echo ""
        echo "传输到新机器:"
        echo "  scp $BACKUP_FILE root@新机器IP:/opt/"
        echo ""
        echo "在新机器上:"
        echo "  cd /opt && tar xzf $BACKUP_FILE && cd pay-adapter && bash migrate.sh restore"
        ;;

    restore)
        echo "=== 恢复并启动 ==="

        # 检查 Docker
        if ! command -v docker &> /dev/null; then
            echo "[*] 安装 Docker..."
            curl -fsSL https://get.docker.com | sh
            systemctl enable --now docker
        fi

        # 检查 .env
        if [ ! -f .env ]; then
            echo "[!] .env 不存在，请从 .env.example 创建并填写配置"
            exit 1
        fi

        # 启动
        docker compose up -d --build
        echo "[OK] 服务已启动"
        echo ""
        echo "如需 HTTPS，请安装 Caddy 并配置反代（参考 DEPLOY.md）"
        ;;

    *)
        echo "用法: bash migrate.sh [pack|restore]"
        echo ""
        echo "  pack    - 在老机器上打包所有文件"
        echo "  restore - 在新机器上解压并启动"
        exit 1
        ;;
esac
