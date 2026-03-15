import React, { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { ReviewItem, ReviewsData } from "../lib/types";
import { EmptyState, ErrorState, LoadingState } from "../components/States";

export function ReviewsPage({ navigate }: { navigate: (path: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState<ReviewItem[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<ReviewsData>(
          `/api/admin/reviews?status=${encodeURIComponent(status)}&page=1&pageSize=50`,
        );
        setItems(data.list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [status]);

  return (
    <div className="stack">
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已驳回</option>
        </select>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState error={error} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState /> : null}
      {!loading && !error && items.length > 0 ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>登录名 / 企业标识</th>
                <th>法人 / 手机号</th>
                <th>状态</th>
                <th>提交时间</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.companyName}<div className="muted">{item.username}</div></td>
                  <td>{item.contactName || "-"}<div className="muted">{item.contactPhone}</div></td>
                  <td>{item.status}</td>
                  <td>{item.createdAt}</td>
                  <td>
                    <button className="secondary-button" onClick={() => navigate(`/reviews/${item.id}`)}>
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
