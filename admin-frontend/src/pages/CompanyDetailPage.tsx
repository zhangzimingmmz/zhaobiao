import React, { useEffect, useState } from "react";
import { Card, Descriptions, Button, Form, Input, Modal, message } from "antd";
import { deleteTestCompanyData, getCompanyDetail, resetCompanyUserPassword, updateCompanyDetail } from "../lib/api";
import type { ReviewDetail } from "../lib/types";
import { ErrorState, LoadingState } from "../components/States";
import { reviewStatusBadgeClass, reviewStatusLabel } from "../lib/statusLabels";
import { EnterpriseModuleTabs } from "../components/EnterpriseModuleTabs";
import { isSuperAdmin } from "../lib/auth";

const BEIJING = "Asia/Shanghai";

function formatDetailTime(iso?: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date
    .toLocaleString("zh-CN", {
      timeZone: BEIJING,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
}

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
  const [resettingPassword, setResettingPassword] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getCompanyDetail(id);
      setItem(data);
      form.setFieldsValue({
        username: data.username || "",
        userMobile: data.userMobile || "",
        idCard: "",
        creditCode: data.creditCode,
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
      title: "删除企业数据",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <div>该操作会删除该企业账号及其全部申请记录，删除后不可恢复。</div>
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
          message.success("企业数据已删除");
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

  function handleResetPassword() {
    let password = "";
    let confirmPassword = "";
    Modal.confirm({
      title: "重置登录密码",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <div>请先通过电话或人工方式完成身份核验，再为该企业账号设置新密码。</div>
          <Input.Password
            placeholder="请输入新密码（6-128 位）"
            onChange={(event) => {
              password = event.target.value;
            }}
          />
          <Input.Password
            placeholder="请再次输入新密码"
            onChange={(event) => {
              confirmPassword = event.target.value;
            }}
          />
        </div>
      ),
      okText: "确认重置",
      okButtonProps: { danger: true, loading: resettingPassword },
      onOk: async () => {
        if (!password) {
          message.error("请输入新密码");
          throw new Error("请输入新密码");
        }
        if (password.length < 6 || password.length > 128) {
          message.error("密码长度需在 6-128 位之间");
          throw new Error("密码长度需在 6-128 位之间");
        }
        if (password !== confirmPassword) {
          message.error("两次输入的密码不一致");
          throw new Error("两次输入的密码不一致");
        }

        try {
          setResettingPassword(true);
          await resetCompanyUserPassword(id, password);
          message.success("登录密码已重置");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "重置密码失败";
          message.error(msg);
          throw err;
        } finally {
          setResettingPassword(false);
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
        title="注册资料"
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="link" onClick={() => navigate("/enterprise/companies")}>
              返回企业档案
            </Button>
            {isSuperAdmin() ? (
              <Button onClick={handleResetPassword}>重置密码</Button>
            ) : null}
            {isSuperAdmin() ? (
              <Button onClick={() => setEditing(true)}>编辑档案</Button>
            ) : null}
            {isSuperAdmin() ? (
              <Button danger onClick={handleDelete}>
                删除企业
              </Button>
            ) : null}
          </div>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="登录名">{item.username || "-"}</Descriptions.Item>
          <Descriptions.Item label="注册手机号">{item.userMobile || "-"}</Descriptions.Item>
          <Descriptions.Item label="注册人身份证号">{item.idCardMasked || "-"}</Descriptions.Item>
          <Descriptions.Item label="统一社会信用代码">{item.creditCode || "-"}</Descriptions.Item>
          <Descriptions.Item label="法人姓名">{item.legalPersonName || "-"}</Descriptions.Item>
          <Descriptions.Item label="法人手机号">{item.legalPersonPhone || "-"}</Descriptions.Item>
          <Descriptions.Item label="经营范围" span={2}>{item.businessScope || "-"}</Descriptions.Item>
          <Descriptions.Item label="经营场所地址" span={2}>{item.businessAddress || "-"}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="审核信息">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="当前状态">
            <span className={reviewStatusBadgeClass(item.status)}>{reviewStatusLabel(item.status)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="审核人">{item.auditedByName || item.auditedBy || "-"}</Descriptions.Item>
          <Descriptions.Item label="提交时间">{formatDetailTime(item.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="审核时间">{formatDetailTime(item.auditAt)}</Descriptions.Item>
          <Descriptions.Item label="驳回原因" span={2}>{item.rejectReason || "-"}</Descriptions.Item>
        </Descriptions>
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
          <Form.Item name="username" label="登录名" rules={[{ required: true, message: "请输入登录名" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="userMobile" label="注册手机号" rules={[{ required: true, message: "请输入注册手机号" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="idCard"
            label="注册人身份证号"
            extra={`当前：${item.idCardMasked || "-"}`}
          >
            <Input />
          </Form.Item>
          <Form.Item name="creditCode" label="统一社会信用代码" rules={[{ required: true, message: "请输入统一社会信用代码" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="legalPersonName" label="法人姓名" rules={[{ required: true, message: "请输入法人姓名" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="legalPersonPhone" label="法人手机号">
            <Input />
          </Form.Item>
          <Form.Item name="businessScope" label="经营范围">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="businessAddress" label="经营场所地址" rules={[{ required: true, message: "请输入经营场所地址" }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
