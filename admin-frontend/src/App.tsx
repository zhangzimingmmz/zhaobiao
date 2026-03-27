import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { ReviewDetailPage } from "./pages/ReviewDetailPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { CompanyDetailPage } from "./pages/CompanyDetailPage";
import { CrawlPage } from "./pages/CrawlPage";
import { RunsPage } from "./pages/RunsPage";
import { RunDetailPage } from "./pages/RunDetailPage";
import { ArticlesPage } from "./pages/ArticlesPage";
import { ArticleEditorPage } from "./pages/ArticleEditorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ReviewerManagementPage } from "./pages/ReviewerManagementPage";
import { clearAdminSession, getAdminToken } from "./lib/auth";

type RouteMeta = {
  title: string;
  subtitle: string;
  content: React.ReactNode;
};

function usePathname() {
  const [path, setPath] = useState(window.location.pathname || "/dashboard");

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname || "/dashboard");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(nextPath: string) {
    if (nextPath === window.location.pathname) return;
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  }

  return { path, navigate };
}

export function App() {
  const { path, navigate } = usePathname();
  const [authed, setAuthed] = useState(Boolean(getAdminToken()));

  useEffect(() => {
    document.title = "金堂招讯通小程序运营管理后台";
  }, []);

  useEffect(() => {
    if (path === "/reviews") {
      navigate("/enterprise/applications");
      return;
    }
    if (path.startsWith("/reviews/")) {
      navigate(path.replace("/reviews/", "/enterprise/applications/"));
      return;
    }
    if (path === "/companies") {
      navigate("/enterprise/companies");
      return;
    }
    if (path.startsWith("/companies/")) {
      navigate(path.replace("/companies/", "/enterprise/companies/"));
      return;
    }
    if (!authed && path !== "/login") {
      navigate("/login");
    }
    if (authed && path === "/login") {
      navigate("/dashboard");
    }
  }, [authed, path]);

  const route = useMemo<RouteMeta | null>(() => {
    if (!authed) return null;
    if (path === "/dashboard") {
      return {
        title: "总览",
        subtitle: "查看待审核数量和最近一次采集运行情况。",
        content: <DashboardPage navigate={navigate} />,
      };
    }
    if (path === "/enterprise/applications") {
      return {
        title: "企业管理",
        subtitle: "在同一模块中处理申请审核和企业档案。",
        content: <ReviewsPage navigate={navigate} />,
      };
    }
    if (path.startsWith("/enterprise/applications/")) {
      return {
        title: "申请详情",
        subtitle: "查看企业提交资料并完成审核。",
        content: <ReviewDetailPage id={path.replace("/enterprise/applications/", "")} navigate={navigate} />,
      };
    }
    if (path === "/enterprise/companies") {
      return {
        title: "企业管理",
        subtitle: "查看当前企业档案与最近审核结果。",
        content: <CompaniesPage navigate={navigate} />,
      };
    }
    if (path.startsWith("/enterprise/companies/")) {
      return {
        title: "企业档案详情",
        subtitle: "维护企业当前档案并查看审核留痕。",
        content: <CompanyDetailPage id={path.replace("/enterprise/companies/", "")} navigate={navigate} />,
      };
    }
    if (path === "/articles") {
      return {
        title: "内容管理",
        subtitle: "管理公众号文章发布。",
        content: <ArticlesPage navigate={navigate} />,
      };
    }
    if (path === "/articles/new") {
      return {
        title: "新增信息展示",
        subtitle: "创建信息展示并关联公众号文章。",
        content: <ArticleEditorPage navigate={navigate} />,
      };
    }
    if (path.startsWith("/articles/edit/")) {
      return {
        title: "编辑文章",
        subtitle: "修改文章信息。",
        content: <ArticleEditorPage id={path.replace("/articles/edit/", "")} navigate={navigate} />,
      };
    }
    if (path === "/crawl") {
      return {
        title: "采集控制",
        subtitle: "选择动作、填写参数并提交运行。",
        content: <CrawlPage navigate={navigate} />,
      };
    }
    if (path === "/settings") {
      return {
        title: "运营设置",
        subtitle: "配置客服电话等小程序运营信息。",
        content: <SettingsPage navigate={navigate} />,
      };
    }
    if (path === "/settings/reviewers") {
      return {
        title: "审核员管理",
        subtitle: "由超级管理员统一维护审核员账号。",
        content: <ReviewerManagementPage navigate={navigate} />,
      };
    }
    if (path === "/runs") {
      return {
        title: "运行记录",
        subtitle: "查看历史运行记录和状态。",
        content: <RunsPage navigate={navigate} />,
      };
    }
    if (path.startsWith("/runs/")) {
      return {
        title: "运行详情",
        subtitle: "查看动作、参数、摘要和失败原因。",
        content: <RunDetailPage id={path.replace("/runs/", "")} />,
      };
    }
    return {
      title: "总览",
      subtitle: "默认页面。",
      content: <DashboardPage navigate={navigate} />,
    };
  }, [authed, navigate, path]);

  if (!authed) {
    return (
      <LoginPage
        onSuccess={() => {
          setAuthed(true);
          navigate("/dashboard");
        }}
      />
    );
  }

  if (!route) return null;

  return (
    <Layout
      path={path}
      title={route.title}
      subtitle={route.subtitle}
      navigate={navigate}
      onLogout={() => {
        clearAdminSession();
        setAuthed(false);
        navigate("/login");
      }}
    >
      {route.content}
    </Layout>
  );
}
