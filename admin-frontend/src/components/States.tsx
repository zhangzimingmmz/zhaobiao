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
