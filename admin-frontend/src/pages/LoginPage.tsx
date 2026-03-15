import React, { useState } from "react";
import { apiRequest } from "../lib/api";
import { saveAdminSession } from "../lib/auth";

type LoginPageProps = {
  onSuccess: () => void;
};

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await apiRequest<{ token: string; tokenType: string; username: string }>(
        "/api/admin/login",
        {
          method: "POST",
          body: { username, password },
          auth: false,
        },
      );
      saveAdminSession(data.token, data.username);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <div className="eyebrow">招标平台</div>
          <h1>运营后台登录</h1>
          <p>固定账号密码，登录后会长期保存在本地浏览器中。</p>
        </div>
        <label>
          账号
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <div className="inline-error">{error}</div> : null}
        <button className="primary-button" disabled={submitting}>
          {submitting ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  );
}
