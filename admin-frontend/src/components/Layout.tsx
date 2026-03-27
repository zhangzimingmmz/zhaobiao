import React from "react";
import { ProLayout } from "@ant-design/pro-components";
import { Button } from "antd";
import { getAdminRole, getAdminUsername } from "../lib/auth";

const ROUTE = {
  path: "/",
  routes: [
    { path: "/dashboard", name: "总览" },
    { path: "/enterprise/applications", name: "企业管理" },
    { path: "/articles", name: "内容管理" },
    { path: "/crawl", name: "采集控制" },
    { path: "/settings", name: "运营设置" },
    { path: "/runs", name: "运行记录" },
  ],
};

type LayoutProps = {
  path: string;
  title: string;
  subtitle?: string;
  navigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "#1f4f6b",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
        }}
      >
        ZB
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>金堂招讯通小程序运营管理后台</div>
        <div style={{ fontSize: 12, color: "#8c8c8c" }}>公众号内容发布与运营管理</div>
      </div>
    </div>
  );
}

function OperatorChip() {
  const role = getAdminRole();
  const roleLabel = role === "super_admin" ? "超级管理员" : "审核员";
  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        background: "#f5f5f5",
        color: "#595959",
        fontSize: 14,
      }}
    >
      <span>{getAdminUsername() ?? "admin"}</span>
      <span style={{ marginLeft: 8, color: "#8c8c8c" }}>{roleLabel}</span>
    </div>
  );
}

function EnvironmentChip() {
  const env = import.meta.env.VITE_APP_ENV || import.meta.env.MODE || "development";
  const normalized = String(env).toLowerCase();
  const isProd = normalized === "production" || normalized === "prod";
  const label = isProd ? "生产环境" : normalized === "test" ? "测试环境" : "内部环境";

  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        background: isProd ? "#fff7e6" : "#e6f4ff",
        color: isProd ? "#ad6800" : "#0958d9",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
}

export function Layout({ path, title, subtitle, navigate, onLogout, children }: LayoutProps) {
  const menuItemRender = (item: { path?: string }, defaultDom: React.ReactNode) => (
    <a
      onClick={(e) => {
        e.preventDefault();
        navigate(item.path || "/dashboard");
      }}
      href={item.path}
    >
      {defaultDom}
    </a>
  );

  return (
    <ProLayout
      route={ROUTE}
      location={{ pathname: path }}
      menuItemRender={menuItemRender}
      logo={<Logo />}
      title=""
      pageTitleRender={false}
      headerTitleRender={false}
      menuHeaderRender={false}
      rightContentRender={() => (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <EnvironmentChip />
          <OperatorChip />
          <Button onClick={onLogout}>退出登录</Button>
        </div>
      )}
      layout="mix"
      fixSiderbar
      contentStyle={{ padding: 24 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 700 }}>{title}</h1>
        {subtitle ? <p style={{ margin: 0, color: "#8c8c8c", fontSize: 14 }}>{subtitle}</p> : null}
      </div>
      {children}
    </ProLayout>
  );
}
