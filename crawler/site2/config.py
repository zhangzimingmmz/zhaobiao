import os

SITE_ID = "site2_ccgp_sichuan"

BASE_URL = "https://www.ccgp-sichuan.gov.cn/gpcms"
LIST_URL = f"{BASE_URL}/rest/web/v2/info/selectInfoForIndex"
DETAIL_URL_00101 = f"{BASE_URL}/rest/web/v2/index/selectInfoByOpenTenderCode"
DETAIL_URL_59 = f"{BASE_URL}/rest/web/v2/info/getInfoById"
VERIFY_URL = f"{BASE_URL}/rest/web/v2/index/getVerify"

# RSA Public Key from config.js
RSA_PUBLIC_KEY = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCS2TZDs5+orLYCL5SsJ54+bPCVs1ZQQwP2RoPkFQF2jcT0HnNNT8ZoQgJTrGwNi5QNTBDoHC4oJesAVYe6DoxXS9Nls8WbGE8ZNgOC5tVv1WVjyBw7k2x52C/qjPoyo/kO5TYl6Qnu4jqW/ImLoup/nsJppUznF0YgbyU/dFFNBQIDAQAB"
SIGN_SALT = "_bosssoft_platform_095285"

# 抓包确认的网站二固定标识符（siteId + channel），签名计算和列表请求均需携带
SITE_UUID = "94c965cc-c55d-4f92-8469-d5875c68bd04"
CHANNEL_UUID = "c5bff13f-21ca-4dac-b158-cb40accd3035"

# Notice types
NOTICE_TYPES = {
    "00101": "采购公告",
    "59": "采购意向"
}

# Pagination
DEFAULT_PAGE_SIZE = 10
MAX_WINDOW_COUNT = 360

# Retry configuration
MAX_RETRIES = 3
RETRY_BACKOFF_FACTOR = 1

# Detail parallel fetch (ThreadPoolExecutor workers per page).
# Keep this conservative to reduce proxy tunnel 408/abrupt close bursts under short-lived proxies.
DETAIL_PARALLEL_WORKERS = 3

# HTTP request timeout (seconds). Target site can be slow (10-20s) during off-peak hours.
REQUEST_TIMEOUT = 30

# Proxy session TTL (seconds). Qingguo short-term proxy expires at 60s; rotate proactively at 50s.
SESSION_TTL = 50

# Full session bootstrap retries. Each retry recreates the session so a bad proxy
# does not poison all captcha attempts.
SESSION_BOOTSTRAP_RETRIES = 3

# ==========================================
# 代理配置 (Proxy Configuration)
# ==========================================
# 您的业务类型为“短效代理-弹性提取”，需要通过接口动态获取 IP
# 提取链接来自当前可用的短效代理账号
PROXY_EXTRACT_URL = "https://share.proxy.qg.net/get?key=F06GBX89&num=1&area=&isp=0&format=json&distinct=false"
PROXY_PASS = "009FE8C868B4"
PROXY_USER = "F06GBX89"
PROXY_EXTRACT_ATTEMPTS = 8

PROXY_ERROR_KEYWORDS = ["ProxyError", "RemoteDisconnected", "SSLError", "SSLEOFError", "IncompleteRead"]

PROXIES = {}
