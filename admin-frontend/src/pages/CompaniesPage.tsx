import React, { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { CompaniesData } from "../lib/types";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { reviewStatusLabel } from "../lib/statusLabels";

export function CompaniesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<CompaniesData["list"]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<CompaniesData>("/api/admin/companies?page=1&pageSize=50");
        setItems(data.list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (items.length === 0) return <EmptyState />;

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>登录名 / 企业标识</th>
            <th>法人 / 手机号</th>
            <th>状态</th>
            <th>审核时间</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.companyName}<br /><span className="muted">{item.username}</span></td>
              <td>{item.contactName || "-"}<br /><span className="muted">{item.contactPhone}</span></td>
              <td>{reviewStatusLabel(item.status)}</td>
              <td>{item.auditAt ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
