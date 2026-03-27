import React, { useEffect, useState } from "react";
import { message, Button, Input, Modal } from "antd";
import { apiRequest, invalidateReview } from "../lib/api";
import type { ReviewDetail } from "../lib/types";
import { EnterpriseModuleTabs } from "../components/EnterpriseModuleTabs";
import { ErrorState, LoadingState } from "../components/States";
import { reviewStatusLabel, reviewStatusBadgeClass } from "../lib/statusLabels";
import { isSuperAdmin } from "../lib/auth";

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

  function submitDecision(type: "approve" | "reject") {
    if (type === "reject" && !rejectReason.trim()) {
      message.warning("请填写驳回原因");
      return;
    }
    const content = type === "approve" ? "确认通过此申请？" : "确认驳回此申请？";
    Modal.confirm({
      title: type === "approve" ? "确认通过" : "确认驳回",
      content,
      onOk: async () => {
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
          throw err;
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  function invalidateApplication() {
    let reason = "管理员作废申请";
    Modal.confirm({
      title: "作废申请",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <div>该操作仅限超级管理员，用于异常或测试申请清理。</div>
          <Input.TextArea
            rows={3}
            defaultValue={reason}
            onChange={(event) => {
              reason = event.target.value;
            }}
          />
        </div>
      ),
      okButtonProps: { danger: true },
      okText: "确认作废",
      onOk: async () => {
        setSubmitting(true);
        setError("");
        try {
          await invalidateReview(id, reason);
          message.success("申请已作废");
          await load();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "作废失败";
          setError(msg);
          message.error(msg);
          throw err;
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  const isFinal = item?.status === "approved" || item?.status === "rejected" || item?.status === "invalidated";

  if (loading) return <LoadingState />;
  if (error && !item) return <ErrorState error={error} />;
  if (!item) return null;

  return (
    <div className="stack">
      <EnterpriseModuleTabs active="applications" navigate={navigate} />
      {error ? <ErrorState error={error} /> : null}
      <div className="card">
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span className="detail-label">审核状态</span>
          <span className={reviewStatusBadgeClass(item.status)} style={{ fontSize: "1rem", padding: "4px 12px" }}>
            {reviewStatusLabel(item.status)}
          </span>
        </div>
        <div className="detail-grid" style={{ marginBottom: 16 }}>
          <div>
            <div className="detail-label">提交时间</div>
            <div>{item.createdAt || "-"}</div>
          </div>
          <div>
            <div className="detail-label">审核时间</div>
            <div>{item.auditAt || "-"}</div>
          </div>
          <div>
            <div className="detail-label">审核人</div>
            <div>{item.auditedByName || item.auditedBy || "-"}</div>
          </div>
          <div>
            <div className="detail-label">账号状态</div>
            <div>{item.accountStatus || "-"}</div>
          </div>
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
        <div className="detail-label" style={{ marginBottom: 8 }}>驳回原因</div>
        <Input.TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="驳回时请填写原因"
          />
        {isFinal ? (
          <div style={{ marginBottom: 12, color: "#8c8c8c", fontSize: 14 }}>
            该申请已处理，无需重复操作
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => navigate("/enterprise/applications")}>返回申请列表</Button>
          <Button disabled={submitting || isFinal} onClick={() => submitDecision("reject")}>
            {submitting ? "处理中..." : "驳回"}
          </Button>
          <Button type="primary" disabled={submitting || isFinal} onClick={() => submitDecision("approve")}>
            {submitting ? "处理中..." : "通过"}
          </Button>
          {isSuperAdmin() ? (
            <Button onClick={() => navigate(`/enterprise/companies/${item.id}`)}>查看企业档案</Button>
          ) : null}
          {isSuperAdmin() ? (
            <Button danger disabled={submitting || item.status === "invalidated"} onClick={invalidateApplication}>
              作废申请
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
