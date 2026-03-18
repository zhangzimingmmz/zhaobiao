import React, { useEffect, useState } from "react";
import { message } from "antd";
import { apiRequest } from "../lib/api";
import type { ReviewDetail } from "../lib/types";
import { ErrorState, LoadingState } from "../components/States";
import { reviewStatusLabel, reviewStatusBadgeClass } from "../lib/statusLabels";

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
      message.warning("请填写驳回原因");
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
      message.success(type === "approve" ? "审核已通过" : "已驳回");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "提交失败";
      setError(msg);
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const isFinal = item?.status === "approved" || item?.status === "rejected";

  if (loading) return <LoadingState />;
  if (error && !item) return <ErrorState error={error} />;
  if (!item) return null;

  return (
    <div className="stack">
      {error ? <ErrorState error={error} /> : null}
      <div className="card">
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span className="detail-label">审核状态</span>
          <span className={reviewStatusBadgeClass(item.status)} style={{ fontSize: "1rem", padding: "4px 12px" }}>
            {reviewStatusLabel(item.status)}
          </span>
        </div>
        <div className="detail-label" style={{ marginBottom: 8 }}>企业信息</div>
        <div className="detail-grid">
          <div>
            <div className="detail-label">企业名称</div>
            <div>{item.companyName}</div>
          </div>
          <div>
            <div className="detail-label">统一社会信用代码</div>
            <div>{item.creditCode}</div>
          </div>
          <div>
            <div className="detail-label">登录名</div>
            <div>{item.username}</div>
          </div>
          <div>
            <div className="detail-label">经营范围</div>
            <div>{item.businessScope || "-"}</div>
          </div>
          <div>
            <div className="detail-label">经营场所地址</div>
            <div>{item.businessAddress || "-"}</div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="detail-label" style={{ marginBottom: 8 }}>人员信息</div>
        <div className="detail-grid">
          <div>
            <div className="detail-label">法人姓名</div>
            <div>{item.legalPersonName || "-"}</div>
          </div>
          <div>
            <div className="detail-label">法人电话</div>
            <div>{item.legalPersonPhone || "-"}</div>
          </div>
          <div>
            <div className="detail-label">联系人姓名</div>
            <div>{item.contactPersonName || item.contactName || "-"}</div>
          </div>
          <div>
            <div className="detail-label">联系人/注册手机号</div>
            <div>{item.contactPhone || item.userMobile || "-"}</div>
          </div>
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
        {isFinal ? (
          <div style={{ marginBottom: 12, color: "#8c8c8c", fontSize: 14 }}>
            该申请已处理，无需重复操作
          </div>
        ) : null}
        <div className="button-row">
          <button className="secondary-button" onClick={() => navigate("/reviews")}>
            返回列表
          </button>
          <button
            className="secondary-button"
            disabled={submitting || isFinal}
            onClick={() => void submitDecision("reject")}
          >
            {submitting ? "处理中..." : "驳回"}
          </button>
          <button
            className="primary-button"
            disabled={submitting || isFinal}
            onClick={() => void submitDecision("approve")}
          >
            {submitting ? "处理中..." : "通过"}
          </button>
        </div>
      </div>
    </div>
  );
}
