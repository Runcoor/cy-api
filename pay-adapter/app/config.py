from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 易支付参数 (自定义，填到 aggre-api 后台的「易支付」配置里)
    EPAY_PID: str
    EPAY_KEY: str

    # 虎皮椒参数 (从虎皮椒后台获取)
    HUPI_APPID: str
    HUPI_APPSECRET: str
    HUPI_API_URL: str = "https://api.xunhupay.com/payment/do.html"

    # 本适配器的公网地址 (例如 https://pay.yourdomain.com)
    BRIDGE_URL: str

    # aggre-api 的对外地址 (例如 https://aggretoken.com)
    # 回调时根据订单号前缀自动路由到正确的 notify 端点
    AGGRE_BASE_URL: str

    # 通知 aggre-api 失败时的最大重试次数
    NOTIFY_MAX_RETRIES: int = 5
    # 重试基础间隔（秒），指数退避: 5, 10, 20, 40, 80
    NOTIFY_RETRY_BASE_DELAY: float = 5.0

    model_config = {"env_file": ".env"}


settings = Settings()
