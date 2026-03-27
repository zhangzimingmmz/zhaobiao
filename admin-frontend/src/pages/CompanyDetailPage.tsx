import React, { useEffect, useState } from "react";
import { Card, Descriptions, Button, Form, Input, Modal, message } from "antd";
import { deleteTestCompanyData, getCompanyDetail, updateCompanyDetail } from "../lib/api";
import type { ReviewDetail } from "../lib/types";
import { ApiUnavailableState, ErrorState, LoadingState } from "../components/States";
import { reviewStatusBadgeClass, reviewStatusLabel } from "../lib/statusLabels";
import { EnterpriseModuleTabs } from "../components/EnterpriseModuleTabs";
import { isSuperAdmin } from "../lib/auth";

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getCompanyDetail(id);
      setItem(data);
      form.setFieldsValue({
        companyName: data.companyName,
        creditCode: data.creditCode,
        contactName: data.contactPersonName || data.contactName || "",
        contactPhone: data.contactPhone || "",
        legalPersonName: data.legalPersonName || "",
        legalPersonPhone: data.legalPersonPhone || "",
        businessScope: data.businessScope || "",
        businessAddress: data.businessAddress || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function handleSave() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const data = await updateCompanyDetail(id, values);
      setItem(data);
      setEditing(false);
      message.success("企业档案已更新");
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    let confirmCreditCode = "";
    Modal.confirm({
      title: "删除测试企业数据",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <div>该操作会删除该企业账号及其全部申请记录，仅对测试数据开放。</div>
          <div>请输入该企业的统一社会信用代码完成确认。</div>
          <Input
            placeholder={item?.creditCode || "请输入统一社会信用代码"}
            onChange={(event) => {
              confirmCreditCode = event.target.value;
            }}
          />
        </div>
      ),
      okText: "确认删除",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteTestCompanyData(id, confirmCreditCode);
          message.success("测试企业数据已删除");
          navigate("/enterprise/companies");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "删除失败";
          setError(msg);
          message.error(msg);
          throw err;
        }
      },
    });
  }

  if (loading) return <LoadingState />;
  if (error && !item) return <ErrorState error={error} />;
  if (!item) return null;

  return (
    <div className="stack">
      <EnterpriseModuleTabs active="companies" navigate={navigate} />
      <Card
        title="公司档案"
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="link" onClick={() => navigate("/enterprise/companies")}>
              返回企业档案
            </Button>
            {isSuperAdmin() ? (
              <Button onClick={() => setEditing(true)}>编辑档案</Button>
            ) : null}
            {isSuperAdmin() && item.isTestData ? (
              <Button danger onClick={handleDelete}>
                删除测试数据
              </Button>
            ) : null}
          </div>
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
          <Descriptions.Item label="审核人">{item.auditedByName || item.auditedBy || "-"}</Descriptions.Item>
          <Descriptions.Item label="驳回原因">{item.rejectReason || "-"}</Descriptions.Item>
          <Descriptions.Item label="测试数据">{item.isTestData ? "是" : "否"}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="运营备注">
        <ApiUnavailableState label="运营备注与人工跟进记录尚未接入独立 API，当前阶段先保留结构位。" />
      </Card>

      <Card title="关联能力预留">
        <ApiUnavailableState label="企业关联的采集、告警、台账等扩展能力仍待后端补齐，当前页先以只读占位态呈现。" />
      </Card>

      <Modal
        title="编辑企业档案"
        open={editing}
        onCancel={() => setEditing(false)}
        onOk={() => void handleSave()}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="companyName" label="企业名称" rules={[{ required: true, message: "请输入企业名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="creditCode" label="统一社会信用代码" rules={[{ required: true, message: "请输入统一社会信用代码" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系人电话">
            <Input />
          </Form.Item>
          <Form.Item name="legalPersonName" label="法人姓名">
            <Input />
          </Form.Item>
          <Form.Item name="legalPersonPhone" label="法人电话">
            <Input />
          </Form.Item>
          <Form.Item name="businessScope" label="经营范围">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="businessAddress" label="经营地址">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
