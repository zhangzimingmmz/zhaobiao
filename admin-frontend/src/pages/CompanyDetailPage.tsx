import React, { useEffect, useState } from "react";
import { Card, Descriptions, Button } from "antd";
import { apiRequest } from "../lib/api";
import type { ReviewDetail } from "../lib/types";
import { ApiUnavailableState, ErrorState, LoadingState } from "../components/States";
import { reviewStatusBadgeClass, reviewStatusLabel } from "../lib/statusLabels";

export function CompanyDetailPage({
  id,
  navigate,
}: {
  id: string;
  navigate: (path: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [item, setItem] = useState<ReviewDetail | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<ReviewDetail>(`/api/admin/reviews/${id}`);
        setItem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) return <LoadingState />;
  if (error && !item) return <ErrorState error={error} />;
  if (!item) return null;

  return (
    <div className="stack">
      <Card
        title="公司档案"
        extra={
          <Button type="link" onClick={() => navigate("/companies")}>
            返回企业目录
          </Button>
        }
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="企业名称">{item.companyName}</Descriptions.Item>
          <Descriptions.Item label="统一社会信用代码">{item.creditCode}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <span className={reviewStatusBadgeClass(item.status)}>{reviewStatusLabel(item.status)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="登录名">{item.username || "-"}</Descriptions.Item>
          <Descriptions.Item label="注册手机号">{item.userMobile || "-"}</Descriptions.Item>
          <Descriptions.Item label="联系人">{item.contactPersonName || item.contactName || "-"}</Descriptions.Item>
          <Descriptions.Item label="联系人电话">{item.contactPhone || "-"}</Descriptions.Item>
          <Descriptions.Item label="法人姓名">{item.legalPersonName || "-"}</Descriptions.Item>
          <Descriptions.Item label="法人电话">{item.legalPersonPhone || "-"}</Descriptions.Item>
          <Descriptions.Item label="经营范围">{item.businessScope || "-"}</Descriptions.Item>
          <Descriptions.Item label="经营场所地址">{item.businessAddress || "-"}</Descriptions.Item>
          <Descriptions.Item label="最近审核时间">{item.auditAt || "-"}</Descriptions.Item>
          <Descriptions.Item label="审核人">{item.auditedBy || "-"}</Descriptions.Item>
          <Descriptions.Item label="驳回原因">{item.rejectReason || "-"}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="运营备注">
        <ApiUnavailableState label="运营备注与人工跟进记录尚未接入独立 API，当前阶段先保留结构位。" />
      </Card>

      <Card title="关联能力预留">
        <ApiUnavailableState label="企业关联的采集、告警、台账等扩展能力仍待后端补齐，当前页先以只读占位态呈现。" />
      </Card>
    </div>
  );
}
