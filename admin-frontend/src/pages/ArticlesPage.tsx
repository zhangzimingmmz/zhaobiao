import React, { useEffect, useState } from "react";
import { getAdminArticles, publishArticle, unpublishArticle, deleteArticle, type Article } from "../lib/api";
import { LoadingState, ErrorState } from "../components/States";

type ArticlesPageProps = {
  navigate: (path: string) => void;
};

export function ArticlesPage({ navigate }: ArticlesPageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminArticles({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        keyword: keyword || undefined,
        page,
        pageSize,
      });
      setArticles(data.list);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [statusFilter, categoryFilter, keyword, page]);

  const handlePublish = async (id: string) => {
    if (!confirm("确认发布此文章？")) return;
    try {
      await publishArticle(id);
      alert("发布成功");
      loadArticles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "发布失败");
    }
  };

  const handleUnpublish = async (id: string) => {
    if (!confirm("确认下线此文章？")) return;
    try {
      await unpublishArticle(id);
      alert("下线成功");
      loadArticles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "下线失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此文章？此操作不可恢复。")) return;
    try {
      await deleteArticle(id);
      alert("删除成功");
      loadArticles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  if (loading && articles.length === 0) return <LoadingState />;
  if (error && articles.length === 0) return <ErrorState error={error} />;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="stack">
      <div className="toolbar">
        <button className="primary-button" onClick={() => navigate("/articles/new")}>
          新增文章
        </button>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">全部分类</option>
          <option value="company_news">单位动态</option>
          <option value="policy">政策法规</option>
          <option value="announcement">相关公告</option>
          <option value="other">其他</option>
        </select>
        <input
          type="text"
          placeholder="搜索标题或摘要"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>状态</th>
              <th>发布时间</th>
              <th>浏览量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id}>
                <td>{article.title}</td>
                <td>{article.category || "-"}</td>
                <td>
                  <span className={article.status === "published" ? "" : "muted"}>
                    {article.status === "published" ? "已发布" : "草稿"}
                  </span>
                </td>
                <td>{article.publishTime ? new Date(article.publishTime).toLocaleString() : "-"}</td>
                <td>{article.viewCount}</td>
                <td>
                  <div className="button-row">
                    <button
                      className="secondary-button"
                      onClick={() => navigate(`/articles/edit/${article.id}`)}
                    >
                      编辑
                    </button>
                    {article.status === "draft" && (
                      <button
                        className="primary-button"
                        onClick={() => handlePublish(article.id)}
                      >
                        发布
                      </button>
                    )}
                    {article.status === "published" && (
                      <button
                        className="secondary-button"
                        onClick={() => handleUnpublish(article.id)}
                      >
                        下线
                      </button>
                    )}
                    <button
                      className="secondary-button"
                      onClick={() => handleDelete(article.id)}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="button-row" style={{ justifyContent: "center", marginTop: "1rem" }}>
          <button
            className="secondary-button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </button>
          <span className="muted" style={{ padding: "0.5rem" }}>
            第 {page} / {totalPages} 页 (共 {total} 条)
          </span>
          <button
            className="secondary-button"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
