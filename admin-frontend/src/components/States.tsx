import React from "react";

export function LoadingState({ label = "加载中..." }: { label?: string }) {
  return <div className="state-card">{label}</div>;
}

export function EmptyState({ label = "暂无数据" }: { label?: string }) {
  return <div className="state-card">{label}</div>;
}

export function ErrorState({ error }: { error: string }) {
  return <div className="state-card error">{error}</div>;
}

export function UnauthorizedState({ label = "当前会话无权访问该页面，请重新登录管理员账号。" }: { label?: string }) {
  return <div className="state-card error">{label}</div>;
}

export function ApiUnavailableState({ label = "当前页面依赖的后端能力暂未提供，先以占位态展示。" }: { label?: string }) {
  return <div className="state-card">{label}</div>;
}
