from __future__ import annotations

import html
import re
from typing import Optional

from bs4 import BeautifulSoup, Comment, NavigableString, Tag


_RICH_TEXT_DROP_TAGS = {
    "script", "style", "meta", "link", "iframe", "object", "embed", "form",
    "input", "button", "textarea", "select", "option", "svg", "canvas", "noscript",
}
_RICH_TEXT_UNWRAP_TAGS = {
    "html", "body", "section", "article", "main", "header", "footer", "font", "span",
    "o:p",
}
_RICH_TEXT_BLOCK_TAGS = {
    "p", "div", "table", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
}
_SITE1_FIELD_PATTERNS = [
    r"拟招标项目名称",
    r"项目批准文件及文号",
    r"项目批准文件文号",
    r"项目批准文件",
    r"招标计划编号",
    r"招标人（建设单位）",
    r"联系人及联系方式",
    r"招标代理机构联系电话",
    r"招标代理联系人",
    r"估算总投资（元）",
    r"投标人主要资格条件要求",
    r"招标项目概况",
    r"(?<!拟招标)(?<!招标)项目名称",
    r"项目编号",
    r"招标人",
    r"联系人",
    r"(?<!及)联系方式",
    r"招标代理机构",
    r"估算总投资",
    r"资金来源",
    r"项目分类",
    r"项目概况",
    r"建设地点",
    r"建设规模",
    r"招标范围",
    r"拟招标内容",
    r"预计招标时间",
    r"拟交易场所",
]


def _normalize_whitespace(value: str) -> str:
    return re.sub(r"[ \t\r\f\v]+", " ", value).strip()


def _escape_html(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _wrap_paragraphs(parts: list[str]) -> Optional[str]:
    blocks = []
    for part in parts:
        normalized = _normalize_whitespace(part)
        if not normalized:
            continue
        blocks.append(
            '<p style="margin:0 0 20px;line-height:1.9;word-break:break-word;">'
            f"{_escape_html(normalized)}"
            "</p>"
        )
    return "".join(blocks) or None


def _has_meaningful_html(raw: str) -> bool:
    return bool(re.search(r"<[a-zA-Z][^>]*>", raw))


def _clean_text(raw: str) -> str:
    text = html.unescape(raw)
    text = text.replace("\xa0", " ").replace("\u3000", " ")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _format_plain_text_content(raw: str) -> Optional[str]:
    text = _clean_text(raw)
    if not text:
        return None

    parts = [_normalize_whitespace(part) for part in re.split(r"\n\s*\n", text) if _normalize_whitespace(part)]
    if len(parts) <= 1:
        compact = _normalize_whitespace(text)
        if not compact:
            return None
        parts = [
            _normalize_whitespace(part)
            for part in re.split(
                r"(?<=[。；])(?=(?:\d+(?:\.\d+)?[、.]|第[一二三四五六七八九十百千]+[章节条]))",
                compact,
            )
            if _normalize_whitespace(part)
        ] or [compact]
    return _wrap_paragraphs(parts)


def _html_to_text(raw: str) -> str:
    soup = BeautifulSoup(raw, "html.parser")
    for comment in soup.find_all(string=lambda node: isinstance(node, Comment)):
        comment.extract()
    return soup.get_text("\n", strip=True)


def _render_site2_html(raw: str) -> Optional[str]:
    source = raw.strip()
    if not source:
        return None

    soup = BeautifulSoup(source, "html.parser")

    for comment in soup.find_all(string=lambda node: isinstance(node, Comment)):
        comment.extract()

    for tag in soup.find_all(_RICH_TEXT_DROP_TAGS):
        tag.decompose()

    for tag in list(soup.find_all(True)):
        if tag.name in _RICH_TEXT_UNWRAP_TAGS:
            tag.unwrap()

    for tag in list(soup.find_all(True)):
        if tag.name == "div":
            has_block_child = any(
                isinstance(child, Tag) and child.name in (_RICH_TEXT_BLOCK_TAGS | {"img", "tr", "td", "th", "thead", "tbody"})
                for child in tag.children
            )
            if not has_block_child:
                tag.name = "p"

    for text_node in soup.find_all(string=True):
        if isinstance(text_node, NavigableString):
            parent = text_node.parent
            if parent and parent.name not in {"pre", "code"}:
                text_node.replace_with(re.sub(r"\s+", " ", str(text_node)))

    for tag in soup.find_all(True):
        allowed_attrs: dict[str, str] = {}
        if tag.name == "img":
            src = (tag.get("src") or "").strip()
            if not src:
                tag.decompose()
                continue
            allowed_attrs["src"] = src
            alt = _normalize_whitespace(tag.get("alt") or "")
            if alt:
                allowed_attrs["alt"] = alt
            allowed_attrs["style"] = "max-width:100%;height:auto;display:block;margin:16px 0;border-radius:12px;"
        elif tag.name == "a":
            href = (tag.get("href") or "").strip()
            if href:
                allowed_attrs["href"] = href
            allowed_attrs["style"] = "color:#1677ff;text-decoration:underline;word-break:break-all;"
        elif tag.name in {"p", "li"}:
            allowed_attrs["style"] = "margin:0 0 20px;line-height:1.9;word-break:break-word;"
        elif tag.name in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            allowed_attrs["style"] = "margin:24px 0 16px;font-weight:700;line-height:1.6;color:#1f2937;"
        elif tag.name in {"ul", "ol"}:
            allowed_attrs["style"] = "margin:0 0 20px;padding-left:1.4em;"
        elif tag.name == "table":
            allowed_attrs["style"] = "width:100%;border-collapse:collapse;table-layout:fixed;margin:16px 0;"
        elif tag.name in {"thead", "tbody", "tr"}:
            allowed_attrs = {}
        elif tag.name in {"td", "th"}:
            allowed_attrs["style"] = "border:1px solid #d9dee7;padding:12px 10px;line-height:1.7;vertical-align:top;word-break:break-word;"
            rowspan = tag.get("rowspan")
            colspan = tag.get("colspan")
            if rowspan:
                allowed_attrs["rowspan"] = str(rowspan)
            if colspan:
                allowed_attrs["colspan"] = str(colspan)
        elif tag.name == "blockquote":
            allowed_attrs["style"] = "margin:0 0 20px;padding:16px;border-left:4px solid #1677ff;background:#f5f9ff;color:#475569;line-height:1.8;"
        elif tag.name == "br":
            allowed_attrs = {}
        else:
            allowed_attrs["style"] = "line-height:1.9;word-break:break-word;"

        tag.attrs = {key: value for key, value in allowed_attrs.items() if value}

    rendered_nodes: list[str] = []
    root = soup.body or soup
    for child in root.contents:
        if isinstance(child, NavigableString):
            text = _normalize_whitespace(str(child))
            if text:
                rendered_nodes.append(
                    '<p style="margin:0 0 20px;line-height:1.9;word-break:break-word;">'
                    f"{_escape_html(text)}"
                    "</p>"
                )
        else:
            html_fragment = str(child).strip()
            if html_fragment:
                rendered_nodes.append(html_fragment)

    rendered = "".join(rendered_nodes).strip()
    if rendered:
        return rendered
    return _format_plain_text_content(_html_to_text(source))


def _insert_site1_boundaries(text: str, category_num: Optional[str]) -> str:
    value = text
    value = re.sub(r"\s+", " ", value)

    for pattern in _SITE1_FIELD_PATTERNS:
        value = re.sub(rf"(?<!^)(?<!\n)({pattern})", r"\n\n\1", value)

    numbered_patterns = [
        r"(?<!^)(?<!\n)((?:第[一二三四五六七八九十百千]+[章节条][^\n]{0,18}))",
        r"(?<!^)(?<!\n)((?:\d+\.\d+(?:\.\d+)?\s*))",
        r"(?<!^)(?<!\n)((?:\d+\.\s*))",
    ]
    for pattern in numbered_patterns:
        value = re.sub(pattern, r"\n\n\1", value)

    if category_num == "002001009":
        value = re.sub(r"(?<!^)(?<!\n)(序号)\s+", r"\n\n\1 ", value)
        value = re.sub(r"(?<!^)(?<!\n)(拟招标内容)\s*", r"\n\n\1\n", value)

    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def _render_site1_text(raw: str, category_num: Optional[str]) -> Optional[str]:
    text_source = _html_to_text(raw) if _has_meaningful_html(raw) else raw
    text = _clean_text(text_source)
    if not text:
        return None

    with_boundaries = _insert_site1_boundaries(text, category_num)
    parts = [_normalize_whitespace(part) for part in re.split(r"\n\s*\n", with_boundaries) if _normalize_whitespace(part)]
    if not parts:
        return _format_plain_text_content(text)

    normalized_parts: list[str] = []
    for part in parts:
        split_parts = [
            _normalize_whitespace(item)
            for item in re.split(r"(?<=[。；])(?=(?:\d+(?:\.\d+)?[、.]|第[一二三四五六七八九十百千]+[章节条]))", part)
            if _normalize_whitespace(item)
        ]
        if split_parts and len(part) > 280 and len(split_parts) > 1:
            normalized_parts.extend(split_parts)
        else:
            normalized_parts.append(part)

    return _wrap_paragraphs(normalized_parts) or _format_plain_text_content(text)


def render_notice_body(raw: Optional[str], site: Optional[str], category_num: Optional[str] = None) -> Optional[str]:
    if not raw:
        return None

    source = raw.strip()
    if not source:
        return None

    if site == "site1_sc_ggzyjy":
        return _render_site1_text(source, category_num)
    if site == "site2_ccgp_sichuan":
        return _render_site2_html(source)

    if _has_meaningful_html(source):
        return _render_site2_html(source)
    return _format_plain_text_content(source)
