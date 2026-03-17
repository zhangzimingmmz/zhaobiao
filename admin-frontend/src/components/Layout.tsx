import React from "react";
import { ProLayout } from "@ant-design/pro-components";
import { getAdminUsername } from "../lib/auth";

const ROUTE = {
  path: "/",
  routes: [
    { path: "/dashboard", name: "总览" },
    { path: "/reviews", name: "审核队列" },
    { path: "/companies", name: "企业管理" },
    { path: "/articles", name: "内容管理" },
    { path: "/crawl", name: "采集控制" },
    { path: "/runs", name: "运行记录" },
  ],
};

type LayoutProps = {
  path: string;
  title: string;
  subtitle?: string;
  navigate: (path: string) => void;
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
        <div style={{ fontSize: 18, fontWeight: 700 }}>运营后台</div>
        <div style={{ fontSize: 12, color: "#8c8c8c" }}>单运营最简版</div>
      </div>
    </div>
  );
}

function OperatorChip() {
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
      {getAdminUsername() ?? "admin"}
    </div>
  );
}

export function Layout({ path, title, subtitle, navigate, children }: LayoutProps) {
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
      rightContentRender={() => <OperatorChip />}
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
