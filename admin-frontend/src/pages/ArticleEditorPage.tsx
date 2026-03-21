import React, { useEffect, useState } from "react";
import { Card, Form, Input, Select, Button, message, Space, Typography } from "antd";
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

type ArticleEditorPageProps = {
  id?: string;
  navigate: (path: string) => void;
};

const CATEGORY_OPTIONS = [
  { value: "", label: "请选择" },
  { value: "company_news", label: "工作动态" },
  { value: "policy", label: "政策法规" },
  { value: "other", label: "其他" },
];

const OFFICIAL_ACCOUNT_PUBLISH_URL = "https://mp.weixin.qq.com/";

export function ArticleEditorPage({ id, navigate }: ArticleEditorPageProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [urlValidating, setUrlValidating] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      getArticle(id)
        .then((article) => {
          const category = article.category === "announcement" ? "other" : (article.category || "");
          form.setFieldsValue({
            title: article.title,
            summary: article.summary || "",
            coverImageUrl: article.coverImageUrl || "",
            wechatArticleUrl: article.wechatArticleUrl,
            category,
            sortOrder: article.sortOrder,
          });
        })
        .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
        .finally(() => setLoading(false));
    }
  }, [id, form]);

  const handleUrlBlur = async () => {
    const url = form.getFieldValue("wechatArticleUrl");
    if (!url) return;

    setUrlValidating(true);
    setUrlError(null);
    setDuplicateWarning(null);

    try {
      const validateResult = await validateArticleUrl(url);
      if (!validateResult.valid) {
        setUrlError(validateResult.error || "链接无效");
        return;
      }
      if (validateResult.title && !form.getFieldValue("title")) {
        form.setFieldValue("title", validateResult.title);
      }
      if (validateResult.cover && !form.getFieldValue("coverImageUrl")) {
        form.setFieldValue("coverImageUrl", validateResult.cover);
      }
      if (validateResult.summary && !form.getFieldValue("summary")) {
        form.setFieldValue("summary", validateResult.summary);
      }
      const duplicateResult = await checkDuplicateArticle(url, id);
      if (duplicateResult.exists && duplicateResult.article) {
        setDuplicateWarning(
          `该文章已存在: ${duplicateResult.article.title} (${duplicateResult.article.status})`,
        );
      }
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "校验失败");
    } finally {
      setUrlValidating(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const data: ArticleCreateInput | ArticleUpdateInput = {
        title: values.title,
        summary: values.summary || undefined,
        coverImageUrl: values.coverImageUrl || undefined,
        wechatArticleUrl: values.wechatArticleUrl,
        category: values.category || undefined,
        sortOrder: values.sortOrder ?? 0,
      };
      if (id) {
        await updateArticle(id, data);
        message.success("保存成功");
      } else {
        await createArticle(data as ArticleCreateInput);
        message.success("创建成功");
      }
      navigate("/articles");
    } catch (err) {
      if (err instanceof Error && err.message) {
        message.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const data: ArticleCreateInput | ArticleUpdateInput = {
        title: values.title,
        summary: values.summary || undefined,
        coverImageUrl: values.coverImageUrl || undefined,
        wechatArticleUrl: values.wechatArticleUrl,
        category: values.category || undefined,
        sortOrder: values.sortOrder ?? 0,
      };
      let articleId = id;
      if (id) {
        await updateArticle(id, data);
      } else {
        const created = await createArticle(data as ArticleCreateInput);
        articleId = created.id;
      }
      if (articleId) {
        await publishArticle(articleId);
        message.success("发布成功");
        navigate("/articles");
      }
    } catch (err) {
      if (err instanceof Error && err.message) {
        message.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Card className="article-editor-card" loading />;
  if (error) return <Card className="article-editor-card"><p style={{ color: "#ff4d4f" }}>{error}</p></Card>;

  return (
    <Card className="article-editor-card">
      <div className="article-editor-shortcut">
        <div>
          <div className="article-editor-shortcut__title">公众号信息发布快捷入口</div>
          <Typography.Text type="secondary">
            先进入企业微信公众号后台新建或编辑图文，再将文章链接粘贴到下方表单中创建发布对象。
          </Typography.Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            onClick={() => window.open(OFFICIAL_ACCOUNT_PUBLISH_URL, "_blank", "noopener,noreferrer")}
          >
            打开公众号后台
          </Button>
        </Space>
      </div>
      <Form form={form} layout="vertical">
        <Form.Item
          name="wechatArticleUrl"
          label="公众号文章链接"
          rules={[{ required: true, message: "请输入公众号链接" }]}
        >
          <Input
            placeholder="https://mp.weixin.qq.com/s/..."
            onBlur={handleUrlBlur}
            disabled={submitting}
          />
        </Form.Item>
        {urlValidating && <p style={{ color: "#8c8c8c", fontSize: 14, marginTop: -16 }}>正在校验...</p>}
        {urlError && <p style={{ color: "#ff4d4f", fontSize: 14, marginTop: -16 }}>{urlError}</p>}
        {duplicateWarning && <p style={{ color: "#faad14", fontSize: 14, marginTop: -16 }}>{duplicateWarning}</p>}

        <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
          <Input placeholder="文章标题" disabled={submitting} />
        </Form.Item>

        <Form.Item name="summary" label="摘要">
          <Input.TextArea placeholder="文章摘要" rows={3} disabled={submitting} />
        </Form.Item>

        <Form.Item name="coverImageUrl" label="封面图 URL">
          <Input placeholder="自动从公众号文章提取，也可手动填写" disabled={submitting} />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(_, v) => v.coverImageUrl}>
          {({ getFieldValue }) =>
            getFieldValue("coverImageUrl") ? (
              <img
                src={getFieldValue("coverImageUrl")}
                alt="封面预览"
                className="article-editor-preview"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null
          }
        </Form.Item>

        <Form.Item name="category" label="分类">
          <Select options={CATEGORY_OPTIONS} disabled={submitting} />
        </Form.Item>

        <Form.Item name="sortOrder" label="排序权重" initialValue={0}>
          <Input type="number" disabled={submitting} />
        </Form.Item>
        <p style={{ color: "#8c8c8c", fontSize: 14, marginTop: -16 }}>数值越大越靠前</p>

        <Form.Item>
          <div className="article-editor-actions">
            <Button type="primary" onClick={handleSaveDraft} loading={submitting}>
              {submitting ? "保存中..." : "保存草稿"}
            </Button>
            <Button type="primary" onClick={handlePublish} loading={submitting}>
              {submitting ? "发布中..." : id ? "保存并发布" : "创建并发布"}
            </Button>
            <Button onClick={() => navigate("/articles")} disabled={submitting}>
              返回
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
}
