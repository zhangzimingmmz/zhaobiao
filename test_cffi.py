from curl_cffi import requests

headers = {
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'zh,zh-TW;q=0.9,zh-CN;q=0.8',
    'Connection': 'keep-alive',
    'Referer': 'https://www.ccgp-sichuan.gov.cn/maincms-web/noticeInformation?typeId=ggxx',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
}

cookies = {
    'regionCode': '510001',
    'regionFullName': '%E5%9B%9B%E5%B7%9D%E7%9C%81',
    'regionRemark': '1'
}

resp = requests.get('https://www.ccgp-sichuan.gov.cn/gpcms/rest/web/v2/index/getVerify', 
                    headers=headers, cookies=cookies, impersonate="chrome110", timeout=10)
print(resp.status_code)
print(len(resp.content))
