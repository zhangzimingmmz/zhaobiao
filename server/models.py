"""Pydantic models for article management."""

from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re


class ArticleCreate(BaseModel):
    """Model for creating a new article."""
    title: str = Field(..., min_length=1, max_length=200)
    summary: Optional[str] = Field(None, max_length=500)
    coverImageUrl: Optional[str] = Field(None, max_length=500)
    wechatArticleUrl: str = Field(..., min_length=1, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    sortOrder: int = Field(default=0)

    @field_validator('wechatArticleUrl')
    @classmethod
    def validate_wechat_url(cls, v: str) -> str:
        """Validate WeChat article URL format."""
        if not v.startswith('https://mp.weixin.qq.com/s'):
            raise ValueError('公众号链接必须以 https://mp.weixin.qq.com/s 开头')
        return v

    @field_validator('category')
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        """Validate category enum values."""
        if v is not None:
            valid_categories = ['company_news', 'policy', 'announcement', 'other']
            if v not in valid_categories:
                raise ValueError(f'分类必须是以下之一: {", ".join(valid_categories)}')
        return v


class ArticleUpdate(BaseModel):
    """Model for updating an existing article."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    summary: Optional[str] = Field(None, max_length=500)
    coverImageUrl: Optional[str] = Field(None, max_length=500)
    wechatArticleUrl: Optional[str] = Field(None, min_length=1, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    sortOrder: Optional[int] = None

    @field_validator('wechatArticleUrl')
    @classmethod
    def validate_wechat_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate WeChat article URL format."""
        if v is not None and not v.startswith('https://mp.weixin.qq.com/s'):
            raise ValueError('公众号链接必须以 https://mp.weixin.qq.com/s 开头')
        return v

    @field_validator('category')
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        """Validate category enum values."""
        if v is not None:
            valid_categories = ['company_news', 'policy', 'announcement', 'other']
            if v not in valid_categories:
                raise ValueError(f'分类必须是以下之一: {", ".join(valid_categories)}')
        return v


class ArticleResponse(BaseModel):
    """Model for article response."""
    id: str
    title: str
    summary: Optional[str]
    coverImageUrl: Optional[str]
    wechatArticleUrl: str
    category: Optional[str]
    status: str
    sortOrder: int
    publishTime: Optional[str]
    createdAt: str
    updatedAt: str
    authorId: Optional[str]
    authorName: Optional[str]
    linkStatus: str
    viewCount: int

    class Config:
        from_attributes = True
