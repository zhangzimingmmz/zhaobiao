import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { ReviewDetailPage } from "./pages/ReviewDetailPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { CrawlPage } from "./pages/CrawlPage";
import { RunsPage } from "./pages/RunsPage";
import { RunDetailPage } from "./pages/RunDetailPage";
import { ArticlesPage } from "./pages/ArticlesPage";
import { ArticleEditorPage } from "./pages/ArticleEditorPage";
import { getAdminToken } from "./lib/auth";

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
    if (path === "/reviews") {
      return {
        title: "企业审核",
        subtitle: "处理企业认证申请。",
        content: <ReviewsPage navigate={navigate} />,
      };
    }
    if (path.startsWith("/reviews/")) {
      return {
        title: "审核详情",
        subtitle: "查看企业资料并完成审核。",
        content: <ReviewDetailPage id={path.replace("/reviews/", "")} navigate={navigate} />,
      };
    }
    if (path === "/companies") {
      return {
        title: "企业目录",
        subtitle: "查看企业清单和认证状态。",
        content: <CompaniesPage />,
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
        title: "新增文章",
        subtitle: "创建并发布公众号文章。",
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
    <Layout path={path} title={route.title} subtitle={route.subtitle} navigate={navigate}>
      {route.content}
    </Layout>
  );
}
