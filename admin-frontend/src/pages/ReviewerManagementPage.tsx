import React, { useRef, useState } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Form, Input, Modal, Tag, message } from "antd";
import {
  createAdminReviewer,
  getAdminReviewers,
  resetAdminReviewerPassword,
  updateAdminReviewerStatus,
} from "../lib/api";
import type { AdminReviewer } from "../lib/types";
import { isSuperAdmin } from "../lib/auth";
import { UnauthorizedState } from "../components/States";

const PASSWORD_LENGTH_RULE = { min: 8, max: 128, message: "密码长度需在 8-128 位之间" };

type ReviewerManagementPageProps = {
  navigate: (path: string) => void;
};

export function ReviewerManagementPage({ navigate }: ReviewerManagementPageProps) {
  const actionRef = useRef<ActionType>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminReviewer | null>(null);
  const [saving, setSaving] = useState(false);
  const [createForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  if (!isSuperAdmin()) {
    return <UnauthorizedState label="仅超级管理员可管理审核员账号。" />;
  }

  const reload = () => actionRef.current?.reload();

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setSaving(true);
      await createAdminReviewer(values);
      message.success("审核员已创建");
      setCreateOpen(false);
      createForm.resetFields();
      reload();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const values = await resetForm.validateFields();
      setSaving(true);
      await resetAdminReviewerPassword(resetTarget.adminId, values.password);
      message.success("审核员密码已重置");
      setResetTarget(null);
      resetForm.resetFields();
      reload();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (record: AdminReviewer) => {
    const nextStatus = record.status === "active" ? "disabled" : "active";
    const actionLabel = nextStatus === "active" ? "启用" : "停用";
    Modal.confirm({
      title: `确认${actionLabel}审核员`,
      content:
        nextStatus === "active"
          ? "启用后，该审核员可以重新登录后台并执行审核。"
          : "停用后，该审核员将无法继续登录后台。",
      okText: actionLabel,
      onOk: async () => {
        try {
          await updateAdminReviewerStatus(record.adminId, nextStatus);
          message.success(`审核员已${actionLabel}`);
          reload();
        } catch (err) {
          message.error(err instanceof Error ? err.message : `${actionLabel}失败`);
          throw err;
        }
      },
    });
  };

  const columns: ProColumns<AdminReviewer>[] = [
    { title: "用户名", dataIndex: "username", key: "username" },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: () => "审核员",
      width: 100,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (_, record) => (
        <Tag color={record.status === "active" ? "green" : "default"}>
          {record.status === "active" ? "启用中" : "已停用"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (_, record) => new Date(record.createdAt).toLocaleString(),
      width: 180,
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (_, record) => new Date(record.updatedAt).toLocaleString(),
      width: 180,
    },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="link" size="small" onClick={() => setResetTarget(record)}>
            重置密码
          </Button>
          <Button type="link" size="small" onClick={() => handleToggleStatus(record)}>
            {record.status === "active" ? "停用" : "启用"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ProTable<AdminReviewer>
        actionRef={actionRef}
        rowKey="adminId"
        columns={columns}
        search={false}
        request={async () => {
          const data = await getAdminReviewers();
          return { data: data.list, success: true, total: data.total };
        }}
        toolBarRender={() => [
          <Button key="back" onClick={() => navigate("/settings")}>
            返回运营设置
          </Button>,
          <Button key="new" type="primary" onClick={() => setCreateOpen(true)}>
            新增审核员
          </Button>,
        ]}
      />

      <Modal
        title="新增审核员"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        onOk={() => void handleCreate()}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入审核员用户名" }]}
          >
            <Input placeholder="例如 reviewer3" maxLength={32} />
          </Form.Item>
          <Form.Item
            name="password"
            label="初始密码"
            rules={[
              { required: true, message: "请输入初始密码" },
              PASSWORD_LENGTH_RULE,
            ]}
          >
            <Input.Password placeholder="至少 8 位" maxLength={128} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={resetTarget ? `重置密码：${resetTarget.username}` : "重置密码"}
        open={Boolean(resetTarget)}
        onCancel={() => {
          setResetTarget(null);
          resetForm.resetFields();
        }}
        onOk={() => void handleResetPassword()}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={resetForm} layout="vertical">
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: "请输入新密码" },
              PASSWORD_LENGTH_RULE,
            ]}
          >
            <Input.Password placeholder="至少 8 位" maxLength={128} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
