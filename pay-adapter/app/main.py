import asyncio
import logging
import secrets
import time

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, PlainTextResponse

from app.config import settings
from app.sign import epay_sign, hupi_sign

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("pay-adapter")

app = FastAPI(title="Pay-Adapter", docs_url=None, redoc_url=None)

# 易支付 → 虎皮椒 支付类型映射
EPAY_TO_HUPI_TYPE = {
    "wxpay": "wechat",
    "alipay": "alipay",
}


# ============================================================
# 工具函数
# ============================================================

def _extract_params(request: Request, form_data=None) -> dict[str, str]:
    """从 GET query 或 POST form 中提取参数，统一为 dict[str, str]。"""
    if request.method == "GET":
        return {k: v for k, v in request.query_params.items()}
    if form_data is not None:
        return {k: str(v) for k, v in form_data.items()}
    return {}


def _get_notify_url(out_trade_no: str) -> str:
    """根据订单号前缀路由到 aggre-api 的正确 notify 端点。

    aggre-api 生成的订单号格式：
      - 充值订单: USR{userId}NO{random}{timestamp}
      - 订阅订单: SUBUSR{userId}NO{random}{timestamp}
    """
    base = settings.AGGRE_BASE_URL.rstrip("/")
    if out_trade_no.startswith("SUB"):
        return f"{base}/api/subscription/epay/notify"
    return f"{base}/api/user/epay/notify"


async def _notify_aggre_api(notify_url: str, epay_data: dict[str, str]):
    """异步通知 aggre-api，带指数退避重试。

    go-epay 的 EpayNotify 同时支持 GET 和 POST，这里用 GET。
    """
    order = epay_data.get("out_trade_no", "?")
    for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    notify_url,
                    params=epay_data,
                    timeout=15.0,
                    follow_redirects=True,
                )
            body = resp.text.strip()
            if resp.status_code == 200 and body == "success":
                log.info("Notify OK | order=%s attempt=%d", order, attempt)
                return
            log.warning(
                "Notify unexpected | order=%s status=%d body=%s attempt=%d",
                order, resp.status_code, body[:200], attempt,
            )
        except Exception as e:
            log.warning(
                "Notify error | order=%s err=%s attempt=%d",
                order, e, attempt,
            )

        if attempt < settings.NOTIFY_MAX_RETRIES:
            delay = settings.NOTIFY_RETRY_BASE_DELAY * (2 ** (attempt - 1))
            await asyncio.sleep(delay)

    log.error("Notify EXHAUSTED | order=%s url=%s data=%s", order, notify_url, epay_data)


# ============================================================
# 健康检查
# ============================================================

@app.get("/health")
async def health():
    return {"status": "ok"}


# ============================================================
# 接收 aggre-api 请求 → 调用虎皮椒 API → 重定向到支付页
# ============================================================

@app.api_route("/submit.php", methods=["GET", "POST"])
async def epay_submit(request: Request):
    """接收 aggre-api (go-epay) 的易支付标准请求，转换并跳转到虎皮椒收银台。"""

    form_data = None
    if request.method == "POST":
        form_data = await request.form()
    params = _extract_params(request, form_data)

    out_trade_no = params.get("out_trade_no", "?")
    log.info("Submit received | order=%s type=%s money=%s",
             out_trade_no, params.get("type"), params.get("money"))

    # 1. 验证 PID
    if str(params.get("pid", "")) != settings.EPAY_PID:
        log.warning("Bad PID | got=%s", params.get("pid"))
        raise HTTPException(status_code=403, detail="Invalid PID")

    # 2. 验证签名（与 go-epay GenerateParams 一致）
    expected_sign = epay_sign(params, settings.EPAY_KEY)
    if expected_sign != params.get("sign"):
        log.warning("Bad signature | order=%s", out_trade_no)
        raise HTTPException(status_code=403, detail="Invalid signature")

    # 3. 映射支付类型
    epay_type = params.get("type", "alipay")
    hupi_type = EPAY_TO_HUPI_TYPE.get(epay_type, "alipay")

    # 4. 构造虎皮椒请求参数
    hupi_params = {
        "version": "1.1",
        "appid": settings.HUPI_APPID,
        "trade_order_id": out_trade_no,
        "total_fee": params.get("money", "0"),
        "title": params.get("name", "API Recharge"),
        "time": str(int(time.time())),
        "notify_url": f"{settings.BRIDGE_URL.rstrip('/')}/notify/hupi",
        "return_url": params.get("return_url", ""),
        "callback_url": params.get("return_url", ""),
        "plugins": "pay-adapter",
        "nonce_str": secrets.token_hex(16),
        "type": hupi_type,
    }

    # 5. 签名
    hupi_params["hash"] = hupi_sign(hupi_params, settings.HUPI_APPSECRET)

    # 6. POST 请求虎皮椒 API
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                settings.HUPI_API_URL,
                data=hupi_params,
                timeout=15.0,
            )
        result = resp.json()
    except Exception as e:
        log.error("Hupi API error | order=%s err=%s", out_trade_no, e)
        raise HTTPException(status_code=502, detail="Payment gateway unavailable")

    if result.get("errcode") != 0:
        log.error("Hupi API rejected | order=%s resp=%s", out_trade_no, result)
        raise HTTPException(
            status_code=502,
            detail=f"Payment gateway: {result.get('errmsg', 'unknown error')}",
        )

    pay_url = result.get("url")
    if not pay_url:
        log.error("Hupi no URL | order=%s resp=%s", out_trade_no, result)
        raise HTTPException(status_code=502, detail="Payment gateway returned no URL")

    log.info("Redirect to payment | order=%s", out_trade_no)
    return RedirectResponse(url=pay_url, status_code=302)


# ============================================================
# 接收虎皮椒回调 → 翻译为易支付格式 → 通知 aggre-api
# ============================================================

@app.post("/notify/hupi")
async def hupi_notify(request: Request):
    """接收虎皮椒异步回调，验签后翻译为易支付格式通知 aggre-api。"""

    form_data = await request.form()
    params = {k: str(v) for k, v in form_data.items()}

    out_trade_no = params.get("trade_order_id", "?")
    status = params.get("status", "?")
    log.info("Hupi notify received | order=%s status=%s", out_trade_no, status)

    # 1. 验证虎皮椒签名
    expected_hash = hupi_sign(params, settings.HUPI_APPSECRET)
    if expected_hash != params.get("hash"):
        log.warning("Bad hupi signature | order=%s", out_trade_no)
        return PlainTextResponse("fail")

    # 2. 仅处理支付成功
    if status != "OD":
        log.info("Non-success status ignored | order=%s status=%s", out_trade_no, status)
        return PlainTextResponse("success")

    # 3. 构造易支付标准回调参数（与 go-epay Verify 兼容）
    epay_notify_data = {
        "pid": settings.EPAY_PID,
        "trade_no": params.get("transaction_id", ""),
        "out_trade_no": out_trade_no,
        "type": params.get("type", "alipay"),
        "name": params.get("order_title", "API Recharge"),
        "money": params.get("total_fee", ""),
        "trade_status": "TRADE_SUCCESS",
    }

    # 4. 按 go-epay 的签名规则签名
    epay_notify_data["sign"] = epay_sign(epay_notify_data, settings.EPAY_KEY)
    epay_notify_data["sign_type"] = "MD5"

    # 5. 确定 aggre-api 的通知地址并异步发送（带重试）
    notify_url = _get_notify_url(out_trade_no)
    log.info("Will notify aggre-api | order=%s url=%s", out_trade_no, notify_url)

    asyncio.create_task(_notify_aggre_api(notify_url, epay_notify_data))

    # 立即告诉虎皮椒已收到，防止重复推送
    return PlainTextResponse("success")
