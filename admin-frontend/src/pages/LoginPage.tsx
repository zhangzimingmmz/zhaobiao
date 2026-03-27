import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import { apiRequest, type AdminLoginResponse } from "../lib/api";
import { saveAdminSession } from "../lib/auth";

type LoginPageProps = {
  onSuccess: () => void;
};

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish(values: { username: string; password: string }) {
    setSubmitting(true);
    try {
      const data = await apiRequest<AdminLoginResponse>(
        "/api/admin/login",
        {
          method: "POST",
          body: values,
          auth: false,
        },
      );
      saveAdminSession(data.token, data.username, data.role, data.adminId);
      onSuccess();
    } catch (err) {
      form.setFields([{ name: "password", errors: [err instanceof Error ? err.message : "登录失败"] }]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div>
          <div className="eyebrow">招标平台</div>
          <h1>金堂招讯通小程序运营管理后台</h1>
          <p>固定账号密码，登录后会长期保存在本地浏览器中。</p>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ username: "admin", password: "" }}
        >
          <Form.Item
            name="username"
            label="账号"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              {submitting ? "登录中..." : "登录"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
