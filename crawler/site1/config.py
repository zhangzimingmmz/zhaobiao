"""
网站一（四川省公共资源交易网）采集配置
与《原始数据接口文档》1.1 保持一致
"""

# 站点标识
SITE = "site1_sc_ggzyjy"

# 主接口 URL
LIST_URL = "https://ggzyjy.sc.gov.cn/inteligentsearch/rest/esinteligentsearch/getFullTextDataNew"

# 请求头模板
HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/145.0.0.0 Safari/537.36"
    ),
    "Origin": "https://ggzyjy.sc.gov.cn",
    "Referer": "https://ggzyjy.sc.gov.cn/jyxx/transactionInfo.html",
    "X-Requested-With": "XMLHttpRequest",
}

# 分页：每页条数
RN = 12

# 探测时使用的每页条数（只取 totalcount）
PROBE_RN = 1

# 单窗口最大条数阈值（超过则拆窗口）
MAX_WINDOW_COUNT = 360

# 重试次数
RETRY_TIMES = 3

# 退避基数（秒）
RETRY_BACKOFF = 2.0

# 请求超时（秒）
REQUEST_TIMEOUT = 30

# 三类业务的 categorynum 与 condition
CATEGORIES = {
    "002001009": {
        "name": "工程建设-招标计划",
        "condition": [
            {
                "fieldName": "categorynum",
                "equal": "002001009",
                "notEqual": None,
                "equalList": None,
                "notEqualList": None,
                "isLike": True,
                "likeType": 2,
            }
        ],
    },
    "002001001": {
        "name": "工程建设-招标公告",
        "condition": [
            {
                "fieldName": "categorynum",
                "equal": "002001001",
                "notEqual": None,
                "equalList": None,
                "notEqualList": None,
                "isLike": True,
                "likeType": 2,
            }
        ],
    },
    "002002001": {
        "name": "政府采购-采购公告",
        "condition": [
            {
                "fieldName": "ZHUANZAI",
                "equal": "四川省政府采购网",
                "notEqual": None,
                "equalList": None,
                "notEqualList": None,
            },
            {
                "fieldName": "categorynum",
                "equal": "002002001",
                "notEqual": None,
                "equalList": None,
                "notEqualList": None,
                "isLike": True,
                "likeType": 2,
            },
        ],
    },
}

# 所有分类 ID 列表
ALL_CATEGORY_IDS = list(CATEGORIES.keys())

# 网站一 Base URL（用于拼接 originUrl）
BASE_URL = "https://ggzyjy.sc.gov.cn"

# sort 字段（JSON 字符串）
SORT_JSON = '{"ordernum":"0","webdate":"0"}'

# 通用请求体模板（不含 pn/rn/condition/time，由 client 填充）
REQUEST_BODY_TEMPLATE = {
    "token": "",
    "sdt": "",
    "edt": "",
    "wd": "",
    "inc_wd": "",
    "exc_wd": "",
    "fields": "",
    "cnum": "",
    "sort": SORT_JSON,
    "ssort": "",
    "cl": 10000,
    "terminal": "",
    "highlights": "",
    "statistics": None,
    "unionCondition": None,
    "accuracy": "",
    "noParticiple": "1",
    "searchRange": None,
    "noWd": True,
}
