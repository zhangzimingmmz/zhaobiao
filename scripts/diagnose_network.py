"""
网络诊断脚本：用 1 个代理 IP 测试目标站连通性和延迟。
在 50 秒的 IP 有效期内尽量多发请求，采集延迟数据。

用法: python3 scripts/diagnose_network.py
"""
import sys, time, requests
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from crawler.site2 import config
from crawler.site2.session import get_fresh_proxy, generate_sign_headers

TARGET = "https://www.ccgp-sichuan.gov.cn"
VERIFY_URL = f"{config.BASE_URL}/rest/web/v2/index/getVerify"
LIST_URL = config.LIST_URL
DETAIL_URL = config.DETAIL_URL_59

def test_direct():
    """Step 1: 不走代理直连目标站首页"""
    print("=" * 60)
    print(f"Step 1: 直连目标站（不走代理, timeout={config.REQUEST_TIMEOUT}s）")
    print("=" * 60)
    for url, label in [
        (TARGET, "首页"),
        (VERIFY_URL + f"?{int(time.time()*1000)}", "验证码接口"),
    ]:
        try:
            t0 = time.time()
            r = requests.get(url, timeout=config.REQUEST_TIMEOUT, verify=False)
            elapsed = time.time() - t0
            print(f"  {label}: {r.status_code}  {elapsed:.1f}s  {len(r.content)} bytes")
        except Exception as e:
            print(f"  {label}: FAILED  {e}")

def test_proxy():
    """Step 2: 走代理测试，只消耗 1 个 IP"""
    print()
    print("=" * 60)
    print(f"Step 2: 走代理测试（消耗 1 个 IP，50s 内反复测试, timeout={config.REQUEST_TIMEOUT}s）")
    print("=" * 60)

    proxies = get_fresh_proxy()
    if not proxies:
        print("  无法获取代理 IP，跳过")
        return

    proxy_addr = proxies["http"].split("@")[1] if "@" in proxies["http"] else proxies["http"]
    print(f"  代理 IP: {proxy_addr}")

    sess = requests.Session()
    sess.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    })
    sess.proxies.update(proxies)
    host = "www.ccgp-sichuan.gov.cn"
    sess.cookies.set("regionCode", "510001", domain=host)
    sess.cookies.set("regionFullName", quote("四川省"), domain=host)
    sess.cookies.set("regionRemark", "1", domain=host)

    ip_start = time.time()
    results = []
    test_num = 0

    # 2a: 验证码
    print(f"\n  --- 验证码接口 ---")
    try:
        t0 = time.time()
        r = sess.get(VERIFY_URL + f"?{int(time.time()*1000)}", timeout=config.REQUEST_TIMEOUT, verify=False)
        elapsed = time.time() - t0
        ok = r.status_code == 200 and len(r.content) > 100
        results.append(("captcha", elapsed, ok))
        print(f"  验证码: {r.status_code}  {elapsed:.1f}s  {len(r.content)} bytes  {'OK' if ok else 'BAD'}")
    except Exception as e:
        results.append(("captcha", 20, False))
        print(f"  验证码: FAILED  {e}")

    # OCR
    verify_code = ""
    try:
        import ddddocr
        ocr = ddddocr.DdddOcr(show_ad=False)
        verify_code = ocr.classification(r.content)
        print(f"  OCR 结果: {verify_code}")
    except Exception:
        verify_code = "0000"
        print(f"  OCR 失败，使用占位: {verify_code}")

    # 2b: 在剩余时间内反复请求 list 接口
    print(f"\n  --- 列表接口反复测试（直到 IP 过期）---")
    from urllib.parse import urlencode
    test_start = "2026-03-03 00:00:00"
    test_end = "2026-03-03 23:59:59"

    while time.time() - ip_start < 50:
        test_num += 1
        age = time.time() - ip_start
        ts = int(time.time() * 1000)
        params = [
            ("currPage", "1"), ("pageSize", "1"),
            ("siteId", config.SITE_UUID), ("channel", config.CHANNEL_UUID),
            ("noticeType", "59"), ("title", ""), ("purchaseManner", ""),
            ("openTenderCode", ""), ("purchaser", ""), ("agency", ""),
            ("purchaseNature", ""),
            ("operationStartTime", test_start), ("operationEndTime", test_end),
            ("verifyCode", verify_code), ("_t", str(ts)),
        ]
        query_string = urlencode(params)
        full_url = f"{LIST_URL}?{query_string}"
        headers = generate_sign_headers(full_url)
        headers["Referer"] = "https://www.ccgp-sichuan.gov.cn/pay/view/sczc/index"
        try:
            t0 = time.time()
            r = sess.get(LIST_URL, params=params, headers=headers, timeout=config.REQUEST_TIMEOUT, verify=False)
            elapsed = time.time() - t0
            ok = r.status_code == 200
            data = {}
            try:
                data = r.json()
            except Exception:
                pass
            total = data.get("data", {}).get("total", "?") if isinstance(data.get("data"), dict) else "?"
            status = "OK" if data.get("code") == "200" else f"code={data.get('code', '?')}"
            results.append(("list", elapsed, ok and data.get("code") == "200"))
            print(f"  #{test_num:2d} age={age:4.0f}s  list: {r.status_code}  {elapsed:.1f}s  total={total}  {status}")
        except requests.exceptions.ReadTimeout:
            results.append(("list", config.REQUEST_TIMEOUT, False))
            print(f"  #{test_num:2d} age={age:4.0f}s  list: READ TIMEOUT ({config.REQUEST_TIMEOUT}s)")
        except Exception as e:
            results.append(("list", config.REQUEST_TIMEOUT, False))
            err = str(e)[:80]
            print(f"  #{test_num:2d} age={age:4.0f}s  list: ERROR  {err}")

    print(f"\n  --- 汇总 ---")
    total_req = len(results)
    ok_count = sum(1 for _, _, ok in ok for ok in [ok] if ok) if False else sum(1 for _, _, ok in results if ok)
    fail_count = total_req - ok_count
    avg_ok = sum(e for _, e, ok in results if ok) / ok_count if ok_count else 0
    avg_fail = sum(e for _, e, ok in results if not ok) / fail_count if fail_count else 0
    print(f"  总请求: {total_req}, 成功: {ok_count}, 失败: {fail_count}")
    print(f"  成功平均延迟: {avg_ok:.1f}s, 失败平均延迟: {avg_fail:.1f}s")

    if fail_count == 0:
        print(f"\n  ✅ 结论: 代理和目标站都正常，可以跑 backfill")
    elif ok_count == 0:
        print(f"\n  ❌ 结论: 所有请求都失败，目标站可能不可达或代理线路有问题")
    else:
        first_fail_age = None
        for i, (_, _, ok) in enumerate(results):
            if not ok and i > 0:
                first_fail_age = sum(e for _, e, _ in results[:i+1])
                break
        if first_fail_age and first_fail_age > 55:
            print(f"\n  ⚠️ 结论: 前 {ok_count} 个请求正常，后续失败可能是 IP 过期（{first_fail_age:.0f}s）")
        else:
            print(f"\n  ⚠️ 结论: 部分成功部分失败，网络不稳定")

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    print(f"诊断时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    test_direct()
    test_proxy()
