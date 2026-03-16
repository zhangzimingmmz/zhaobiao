import React, { useEffect, useState } from "react";
import {
  createArticle,
  updateArticle,
  getArticle,
  validateArticleUrl,
  checkDuplicateArticle,
  publishArticle,
  type ArticleCreateInput,
  type ArticleUpdateInput,
} from "../lib/api";
import { LoadingState, ErrorState } from "../components/States";

type ArticleEditorPageProps = {
  id?: string;
  navigate: (path: string) => void;
};

export function ArticleEditorPage({ id, navigate }: ArticleEditorPageProps) {
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [wechatArticleUrl, setWechatArticleUrl] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  
  const [urlValidating, setUrlValidating] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const article = await getArticle(id);
      setTitle(article.title);
      setSummary(article.summary || "");
      setCoverImageUrl(article.coverImageUrl || "");
      setWechatArticleUrl(article.wechatArticleUrl);
      setCategory(article.category || "");
      setSortOrder(article.sortOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlBlur = async () => {
    if (!wechatArticleUrl) return;
    
    setUrlValidating(true);
    setUrlError(null);
    setDuplicateWarning(null);

    try {
      // Validate URL
      const validateResult = await validateArticleUrl(wechatArticleUrl);
      if (!validateResult.valid) {
        setUrlError(validateResult.error || "链接无效");
        return;
      }

      // Auto-fill fields
      if (validateResult.title && !title) {
        setTitle(validateResult.title);
      }
      if (validateResult.cover && !coverImageUrl) {
        setCoverImageUrl(validateResult.cover);
      }
      if (validateResult.summary && !summary) {
        setSummary(validateResult.summary);
      }

      // Check duplicate
      const duplicateResult = await checkDuplicateArticle(wechatArticleUrl, id);
      if (duplicateResult.exists && duplicateResult.article) {
        setDuplicateWarning(
          `该文章已存在: ${duplicateResult.article.title} (${duplicateResult.article.status})`
        );
      }
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "校验失败");
    } finally {
      setUrlValidating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title || !wechatArticleUrl) {
      alert("标题和公众号链接为必填项");
      return;
    }

    setSubmitting(true);
    try {
      const data: ArticleCreateInput | ArticleUpdateInput = {
        title,
        summary: summary || undefined,
        coverImageUrl: coverImageUrl || undefined,
        wechatArticleUrl,
        category: category || undefined,
        sortOrder,
      };

      if (id) {
        await updateArticle(id, data);
        alert("保存成功");
      } else {
        await createArticle(data as ArticleCreateInput);
        alert("创建成功");
      }
      navigate("/articles");
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!title || !wechatArticleUrl) {
      alert("标题和公众号链接为必填项");
      return;
    }

    setSubmitting(true);
    try {
      let articleId = id;
      
      const data: ArticleCreateInput | ArticleUpdateInput = {
        title,
        summary: summary || undefined,
        coverImageUrl: coverImageUrl || undefined,
        wechatArticleUrl,
        category: category || undefined,
        sortOrder,
      };

      if (id) {
        await updateArticle(id, data);
      } else {
        const created = await createArticle(data as ArticleCreateInput);
        articleId = created.id;
      }

      if (articleId) {
        await publishArticle(articleId);
        alert("发布成功");
        navigate("/articles");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="card stack" style={{ maxWidth: "800px" }}>
      <label>
        公众号文章链接 <span className="inline-error">*</span>
        <input
          type="text"
          value={wechatArticleUrl}
          onChange={(e) => setWechatArticleUrl(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://mp.weixin.qq.com/s/..."
          disabled={submitting}
        />
        {urlValidating && <p className="muted" style={{ fontSize: "0.9rem", marginTop: "4px" }}>正在校验...</p>}
        {urlError && <p className="inline-error" style={{ fontSize: "0.9rem", marginTop: "4px" }}>{urlError}</p>}
        {duplicateWarning && <p style={{ color: "#b8860b", fontSize: "0.9rem", marginTop: "4px" }}>{duplicateWarning}</p>}
      </label>

      <label>
        标题 <span className="inline-error">*</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文章标题"
          disabled={submitting}
        />
      </label>

      <label>
        摘要
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="文章摘要"
          disabled={submitting}
          rows={3}
        />
      </label>

      <label>
        封面图 URL
        <input
          type="text"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://..."
          disabled={submitting}
        />
        {coverImageUrl && (
          <img
            src={coverImageUrl}
            alt="封面预览"
            style={{ marginTop: "0.5rem", maxWidth: "200px", maxHeight: "200px", display: "block" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </label>

      <label>
        分类
        <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={submitting}>
          <option value="">请选择</option>
          <option value="company_news">单位动态</option>
          <option value="policy">政策法规</option>
          <option value="announcement">相关公告</option>
          <option value="other">其他</option>
        </select>
      </label>

      <label>
        排序权重
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          disabled={submitting}
        />
        <p className="muted" style={{ fontSize: "0.9rem", marginTop: "4px" }}>数值越大越靠前</p>
      </label>

      <div className="button-row">
        <button className="primary-button" onClick={handleSaveDraft} disabled={submitting}>
          {submitting ? "保存中..." : "保存草稿"}
        </button>
        <button className="primary-button" onClick={handlePublish} disabled={submitting}>
          {submitting ? "发布中..." : id ? "保存并发布" : "创建并发布"}
        </button>
        <button className="secondary-button" onClick={() => navigate("/articles")} disabled={submitting}>
          返回
        </button>
      </div>
    </div>
  );
}
