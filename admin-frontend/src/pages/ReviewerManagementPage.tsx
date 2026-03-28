import React, { useRef, useState } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { Alert, Button, Form, Input, Modal, Tag, message } from "antd";
import {
  createAdminReviewer,
  deleteAdminReviewer,
  getAdminReviewers,
  resetAdminReviewerPassword,
  updateAdminReviewerStatus,
  updateAdminReviewerUsername,
} from "../lib/api";
import type { AdminReviewer } from "../lib/types";
import { isSuperAdmin } from "../lib/auth";
import { UnauthorizedState } from "../components/States";

const USERNAME_RULES = [
  { required: true, message: "请输入审核员用户名" },
  { min: 3, max: 32, message: "用户名长度需在 3-32 位之间" },
  { pattern: /^[A-Za-z0-9_.-]{3,32}$/, message: "用户名仅支持字母、数字、点、下划线和中划线" },
];
const PASSWORD_LENGTH_RULE = { min: 8, max: 128, message: "密码长度需在 8-128 位之间" };
const ACTIVE_LIMIT_MESSAGE = "最多只能有 3 个启用中的审核员，请先停用或删除未使用账号";

type ReviewerManagementPageProps = {
  navigate: (path: string) => void;
};

export function ReviewerManagementPage({ navigate }: ReviewerManagementPageProps) {
  const actionRef = useRef<ActionType>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminReviewer | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminReviewer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReviewer | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [maxActiveReviewers, setMaxActiveReviewers] = useState(3);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [resetForm] = Form.useForm();
  const [deleteForm] = Form.useForm();

  if (!isSuperAdmin()) {
    return <UnauthorizedState label="仅超级管理员可管理审核员账号。" />;
  }

  const reload = () => actionRef.current?.reload();

  const openCreateModal = () => {
    if (activeCount >= maxActiveReviewers) {
      message.warning(ACTIVE_LIMIT_MESSAGE);
      return;
    }
    setCreateOpen(true);
  };

  const openEditModal = (record: AdminReviewer) => {
    setEditTarget(record);
    editForm.setFieldsValue({ username: record.username });
  };

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

  const handleUpdateUsername = async () => {
    if (!editTarget) return;
    try {
      const values = await editForm.validateFields();
      const username = values.username.trim();
      if (username === editTarget.username) {
        message.warning("用户名未发生变化");
        return;
      }
      setSaving(true);
      await updateAdminReviewerUsername(editTarget.adminId, username);
      message.success("审核员用户名已更新");
      setEditTarget(null);
      editForm.resetFields();
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
    if (nextStatus === "active" && activeCount >= maxActiveReviewers) {
      message.warning(ACTIVE_LIMIT_MESSAGE);
      return;
    }
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

  const handleDeleteReviewer = async () => {
    if (!deleteTarget) return;
    try {
      const values = await deleteForm.validateFields();
      setSaving(true);
      await deleteAdminReviewer(deleteTarget.adminId, values.confirmUsername);
      message.success("审核员已删除");
      setDeleteTarget(null);
      deleteForm.resetFields();
      reload();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setSaving(false);
    }
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
          <Button type="link" size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => setResetTarget(record)}>
            重置密码
          </Button>
          <Button type="link" size="small" onClick={() => handleToggleStatus(record)}>
            {record.status === "active" ? "停用" : "启用"}
          </Button>
          <Button type="link" danger size="small" onClick={() => setDeleteTarget(record)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`启用中的审核员 ${activeCount}/${maxActiveReviewers}`}
        description="最多允许 3 个启用中的审核员。已有历史审核记录的审核员不能删除，只能停用或修改用户名。"
      />
      <ProTable<AdminReviewer>
        actionRef={actionRef}
        rowKey="adminId"
        columns={columns}
        search={false}
        request={async () => {
          const data = await getAdminReviewers();
          setActiveCount(data.activeCount);
          setMaxActiveReviewers(data.maxActiveReviewers);
          return { data: data.list, success: true, total: data.total };
        }}
        toolBarRender={() => [
          <Button key="back" onClick={() => navigate("/settings")}>
            返回运营设置
          </Button>,
          <Button key="new" type="primary" onClick={openCreateModal}>
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
            rules={USERNAME_RULES}
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
        title={editTarget ? `修改用户名：${editTarget.username}` : "修改用户名"}
        open={Boolean(editTarget)}
        onCancel={() => {
          setEditTarget(null);
          editForm.resetFields();
        }}
        onOk={() => void handleUpdateUsername()}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="username"
            label="新用户名"
            rules={USERNAME_RULES}
          >
            <Input placeholder="请输入新的审核员用户名" maxLength={32} />
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

      <Modal
        title={deleteTarget ? `删除审核员：${deleteTarget.username}` : "删除审核员"}
        open={Boolean(deleteTarget)}
        onCancel={() => {
          setDeleteTarget(null);
          deleteForm.resetFields();
        }}
        onOk={() => void handleDeleteReviewer()}
        confirmLoading={saving}
        okButtonProps={{ danger: true }}
        okText="确认删除"
        destroyOnClose
      >
        <div style={{ marginBottom: 12, color: "#595959" }}>
          仅允许删除从未参与过审核的账号。请输入该审核员用户名确认删除。
        </div>
        <Form form={deleteForm} layout="vertical">
          <Form.Item
            name="confirmUsername"
            label="确认用户名"
            rules={[{ required: true, message: "请输入该审核员用户名以确认删除" }]}
          >
            <Input placeholder={deleteTarget?.username || "请输入审核员用户名"} maxLength={32} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
