import React, { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { ReviewDetail } from "../lib/types";
import { ErrorState, LoadingState } from "../components/States";
import { reviewStatusLabel } from "../lib/statusLabels";

export function ReviewDetailPage({
  id,
  navigate,
}: {
  id: string;
  navigate: (path: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [item, setItem] = useState<ReviewDetail | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<ReviewDetail>(`/api/admin/reviews/${id}`);
      setItem(data);
      setRejectReason(data.rejectReason ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function submitDecision(type: "approve" | "reject") {
    if (type === "reject" && !rejectReason.trim()) {
      setError("请填写驳回原因");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiRequest(
        `/api/admin/reviews/${id}/${type}`,
        {
          method: "POST",
          body: type === "approve" ? {} : { rejectReason },
        },
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error && !item) return <ErrorState error={error} />;
  if (!item) return null;

  return (
    <div className="stack">
      {error ? <ErrorState error={error} /> : null}
      <div className="card detail-grid">
        <div>
          <div className="detail-label">登录名</div>
          <div>{item.username}</div>
        </div>
        <div>
          <div className="detail-label">企业名称</div>
          <div>{item.companyName}</div>
        </div>
        <div>
          <div className="detail-label">统一信用代码</div>
          <div>{item.creditCode}</div>
        </div>
        <div>
          <div className="detail-label">法人姓名</div>
          <div>{item.legalPersonName || item.contactName || "-"}</div>
        </div>
        <div>
          <div className="detail-label">法人电话</div>
          <div>{item.legalPersonPhone || "-"}</div>
        </div>
        <div>
          <div className="detail-label">注册手机号</div>
          <div>{item.contactPhone}</div>
        </div>
        <div>
          <div className="detail-label">经营范围</div>
          <div>{item.businessScope || "-"}</div>
        </div>
        <div>
          <div className="detail-label">经营场所地址</div>
          <div>{item.businessAddress || "-"}</div>
        </div>
        <div>
          <div className="detail-label">状态</div>
          <div>{reviewStatusLabel(item.status)}</div>
        </div>
      </div>
      <div className="card stack">
        <div className="detail-label">营业执照</div>
        <a href={item.licenseImage} target="_blank" rel="noreferrer">
          查看图片
        </a>
      </div>
      <div className="card stack">
        <label>
          驳回原因
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </label>
        <div className="button-row">
          <button className="secondary-button" onClick={() => navigate("/reviews")}>
            返回列表
          </button>
          <button className="secondary-button" disabled={submitting} onClick={() => void submitDecision("reject")}>
            驳回
          </button>
          <button className="primary-button" disabled={submitting} onClick={() => void submitDecision("approve")}>
            通过
          </button>
        </div>
      </div>
    </div>
  );
}
