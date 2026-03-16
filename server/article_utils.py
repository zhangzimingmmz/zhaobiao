"""Utility functions for WeChat article extraction and management."""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import requests
from bs4 import BeautifulSoup


def extract_article_info(url: str, timeout: int = 10) -> dict[str, Any]:
    """
    Extract article information from WeChat article URL.
    
    Args:
        url: WeChat article URL (must start with https://mp.weixin.qq.com/s)
        timeout: Request timeout in seconds
        
    Returns:
        dict with keys: valid, title, cover, summary, error
    """
    if not url.startswith('https://mp.weixin.qq.com/s'):
        return {
            'valid': False,
            'error': '链接格式不正确，必须以 https://mp.weixin.qq.com/s 开头'
        }
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title
        title = None
        title_tag = soup.find('h1', class_='rich_media_title')
        if title_tag:
            title = title_tag.get_text(strip=True)
        
        # Extract cover image
        cover = None
        cover_tag = soup.find('meta', property='og:image')
        if cover_tag:
            cover = cover_tag.get('content')
        
        # Extract summary/description
        summary = None
        desc_tag = soup.find('meta', property='og:description')
        if desc_tag:
            summary = desc_tag.get('content')
        
        if not title:
            return {
                'valid': False,
                'error': '无法提取文章标题，请检查链接是否有效'
            }
        
        return {
            'valid': True,
            'title': title,
            'cover': cover,
            'summary': summary
        }
        
    except requests.Timeout:
        return {
            'valid': False,
            'error': '请求超时，请稍后重试'
        }
    except requests.RequestException as e:
        return {
            'valid': False,
            'error': f'无法访问链接: {str(e)}'
        }
    except Exception as e:
        return {
            'valid': False,
            'error': f'提取文章信息失败: {str(e)}'
        }


def now_iso() -> str:
    """Return current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()


def generate_id() -> str:
    """Generate a unique ID."""
    return str(uuid.uuid4())
