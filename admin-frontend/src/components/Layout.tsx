import React from "react";
import { getAdminUsername } from "../lib/auth";

const NAV_ITEMS = [
  { path: "/dashboard", label: "总览" },
  { path: "/reviews", label: "企业审核" },
  { path: "/companies", label: "企业目录" },
  { path: "/articles", label: "内容管理" },
  { path: "/crawl", label: "采集控制" },
  { path: "/runs", label: "运行记录" },
];

type LayoutProps = {
  path: string;
  title: string;
  subtitle?: string;
  navigate: (path: string) => void;
  children: React.ReactNode;
};

export function Layout({ path, title, subtitle, navigate, children }: LayoutProps) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ZB</div>
          <div>
            <div className="brand-title">运营后台</div>
            <div className="brand-subtitle">单运营最简版</div>
          </div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={path.startsWith(item.path) ? "nav-item active" : "nav-item"}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="content">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="operator-chip">{getAdminUsername() ?? "admin"}</div>
        </header>
        <section className="page-body">{children}</section>
      </main>
    </div>
  );
}
