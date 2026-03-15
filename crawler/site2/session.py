import logging
import time
import hashlib
import base64
from urllib.parse import quote

import ddddocr
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5

from . import config
from . import transport

logger = logging.getLogger(__name__)
DEFAULT_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def generate_sign_headers(url):
    """
    Generate signature headers (nsssjss, sign, time) for Site 2 APIs.
    url can be full URL or path.
    """
    import urllib.parse
    parsed = urllib.parse.urlparse(url)
    # Extract path starting from /gpcms
    path = parsed.path
    if not path.startswith("/gpcms"):
        # If it's already a path like /rest/...
        if not path.startswith("/"):
            path = "/" + path
        if not path.startswith("/gpcms"):
             path = "/gpcms" + path
             
    query = parsed.query
    full_path_with_query = path
    if query:
        full_path_with_query = f"{path}?{query}"
        
    timestamp = int(time.time() * 1000)
    
    # 1. nsssjss = RSA encrypt (path + "$$" + timestamp)
    plain_text = f"{path}$${timestamp}"
    
    pem_key = f"-----BEGIN PUBLIC KEY-----\n{config.RSA_PUBLIC_KEY}\n-----END PUBLIC KEY-----"
    rsa_key = RSA.import_key(pem_key)
    cipher = PKCS1_v1_5.new(rsa_key)
    
    cipher_text_bytes = cipher.encrypt(plain_text.encode('utf-8'))
    nsssjss = base64.b64encode(cipher_text_bytes).decode('utf-8')
    
    # 2. sign = MD5(SHA1(timestamp + "_" + full_path_with_query + "_bosssoft_platform_095285"))
    raw_str = f"{timestamp}_{full_path_with_query}{config.SIGN_SALT}"
    sha1_hash = hashlib.sha1(raw_str.encode('utf-8')).hexdigest()
    sign = hashlib.md5(sha1_hash.encode('utf-8')).hexdigest()
    
    return {
        "nsssjss": nsssjss,
        "sign": sign,
        "time": str(timestamp)
    }

def _apply_session_defaults(sess):
    sess.headers.update({"User-Agent": DEFAULT_USER_AGENT})
    host = "www.ccgp-sichuan.gov.cn"
    sess.cookies.set("regionCode", "510001", domain=host)
    sess.cookies.set("regionFullName", quote("四川省"), domain=host)
    sess.cookies.set("regionRemark", "1", domain=host)

def _fetch_captcha_bytes(session, verify_url):
    return transport.get_bytes(session, verify_url, timeout=30)


def solve_captcha(session):
    """
    Fetch captcha image and solve it using ddddocr.
    Uses the provided session to bind the captcha verification to the cookies.
    """
    ocr = ddddocr.DdddOcr(show_ad=False)
    
    for attempt in range(config.MAX_RETRIES):
        timestamp = int(time.time() * 1000)
        verify_url = f"{config.VERIFY_URL}?{timestamp}"
        
        try:
            captcha_bytes = _fetch_captcha_bytes(session, verify_url)
            if captcha_bytes:
                res = ocr.classification(captcha_bytes)
                logger.debug(f"Captcha OCR result (attempt {attempt+1}): {res}")
                
                # Check if reasonable (usually 4 digits/chars)
                if res and len(res) == 4:
                    return res
        except Exception as e:
            if is_proxy_error(e):
                logger.warning(f"Proxy error fetching captcha on attempt {attempt+1}: {e}")
                raise
            logger.warning(f"Error fetching/solving captcha on attempt {attempt+1}: {e}")
            
        time.sleep(config.RETRY_BACKOFF_FACTOR)
        
    raise Exception("Failed to solve CAPTCHA after maximum retries.")

def get_fresh_proxy():
    """
    Fetch a fresh proxy IP from Qingguo API.
    """
    if not hasattr(config, 'PROXY_EXTRACT_URL') or not config.PROXY_EXTRACT_URL:
        return None

    attempts = getattr(config, "PROXY_EXTRACT_ATTEMPTS", config.SESSION_BOOTSTRAP_RETRIES)
    probe_timeout = min(getattr(config, "REQUEST_TIMEOUT", 30), 10)
    last_error = None

    for attempt in range(attempts):
        try:
            data = transport.fetch_json(config.PROXY_EXTRACT_URL, timeout=10)
            if data.get("code") != "SUCCESS" or not data.get("data"):
                logger.error(f"Failed to extract proxy: {data.get('msg', 'Unknown error')}")
                continue

            proxy_addr = data["data"][0]["server"]
            user = config.PROXY_USER
            password = config.PROXY_PASS
            proxy_url = f"http://{user}:{password}@{proxy_addr}"
            proxy_config = {
                "http": proxy_url,
                "https": proxy_url,
            }

            probe_url = f"{config.VERIFY_URL}?{int(time.time() * 1000)}"
            probe_session = transport.new_session(proxies=proxy_config)
            _apply_session_defaults(probe_session)
            probe_bytes = b""
            try:
                probe_bytes = _fetch_captcha_bytes(probe_session, probe_url)
            finally:
                probe_session.close()

            if probe_bytes:
                logger.info(f"Successfully extracted fresh proxy: {proxy_addr}")
                return proxy_config

            logger.warning(
                "Discarding proxy %s during health probe (attempt %s/%s): status=%s content=%s",
                proxy_addr,
                attempt + 1,
                attempts,
                200,
                bool(probe_bytes),
            )
        except Exception as e:
            last_error = e
            logger.warning(
                "Discarding proxy candidate during health probe (attempt %s/%s): %s",
                attempt + 1,
                attempts,
                e,
            )

    if last_error is not None:
        logger.error(f"Error extracting proxy: {last_error}")
    return None

def _build_session():
    """
    Build a fresh logical session with default headers, cookies, and proxy config.
    """
    dynamic_proxies = get_fresh_proxy()
    proxies = dynamic_proxies
    if dynamic_proxies:
        logger.info("Using dynamic proxy for this session.")
    elif hasattr(config, 'PROXIES') and config.PROXIES:
        proxies = config.PROXIES
        logger.info("Using configured static proxies for this session.")
    sess = transport.new_session(proxies=proxies)
    _apply_session_defaults(sess)
    return sess


def create_session():
    """
    Create a new logical transport session, set default cookies, solve captcha,
    and store verifyCode on the returned session object.

    Retry full session bootstrap so a dead proxy or bad captcha path does not
    strand all attempts on the same session.
    """
    attempts = getattr(config, "SESSION_BOOTSTRAP_RETRIES", config.MAX_RETRIES)
    last_error = None

    for attempt in range(attempts):
        sess = _build_session()
        try:
            verify_code = solve_captcha(sess)
            sess.verify_code = verify_code
            sess.created_at = time.time()
            return sess
        except Exception as e:
            last_error = e
            logger.warning(
                "Session bootstrap failed on attempt %s/%s: %s",
                attempt + 1,
                attempts,
                e,
            )
            try:
                sess.close()
            except Exception:
                pass
            if attempt < attempts - 1:
                time.sleep(config.RETRY_BACKOFF_FACTOR * (attempt + 1))

    raise RuntimeError("Failed to create a working site2 session after retries.") from last_error


def is_proxy_error(exc):
    """
    Classify whether an exception indicates a broken proxy tunnel (True)
    vs. a slow/unresponsive target site (False, e.g. ReadTimeout).
    Only proxy errors should trigger session/IP rotation.
    """
    if transport.is_proxy_error(exc):
        return True
    exc_str = f"{type(exc).__name__}: {exc}"
    return any(kw in exc_str for kw in config.PROXY_ERROR_KEYWORDS)


def ensure_fresh(sess):
    """
    Return a fresh session if the current one is approaching proxy expiry.
    Qingguo short-term proxy TTL is 60s; rotate proactively at SESSION_TTL (50s).
    """
    if sess is None:
        return create_session()
    ttl = getattr(config, "SESSION_TTL", 50)
    if time.time() - sess.created_at > ttl:
        logger.info("Session approaching proxy expiry, rotating proactively")
        return create_session()
    return sess
