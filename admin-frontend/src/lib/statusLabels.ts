/**
 * 状态值到中文展示的映射，用于运营后台统一展示
 */

/** 企业审核状态 */
export function reviewStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "待审核",
    approved: "已通过",
    rejected: "已驳回",
    invalidated: "已作废",
  };
  return map[status] ?? status;
}

/** 企业审核状态对应的 badge 类名（待审核橙、已通过绿、已驳回红） */
export function reviewStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: "badge badge-pending",
    approved: "badge badge-success",
    rejected: "badge badge-fail",
    invalidated: "badge badge-fail",
  };
  return map[status] ?? "badge badge-pending";
}

/** 采集运行状态 */
export function crawlRunStatusLabel(status: string): string {
  const map: Record<string, string> = {
    queued: "排队中",
    running: "运行中",
    succeeded: "成功",
    failed: "失败",
    rejected: "已拒绝",
  };
  return map[status] ?? status;
}

/** 采集运行展示状态（含 errorCount 时视为失败） */
export function crawlRunDisplayStatus(run: {
  status: string;
  errorCount?: number | null;
}): string {
  if ((run.errorCount ?? 0) > 0) return "失败";
  return crawlRunStatusLabel(run.status);
}

/** 采集运行状态对应的 badge 类名 */
export function runStatusBadgeClass(run: {
  status: string;
  errorCount?: number | null;
}): string {
  if ((run.errorCount ?? 0) > 0) return "badge badge-fail";
  const map: Record<string, string> = {
    queued: "badge badge-pending",
    running: "badge badge-running",
    succeeded: "badge badge-success",
    failed: "badge badge-fail",
    rejected: "badge badge-fail",
  };
  return map[run.status] ?? "badge badge-pending";
}

/** 站点标识（支持 site1、site2 及完整 ID 如 site1_sc_ggzyjy、site2_ccgp_sichuan） */
export function siteLabel(site: string): string {
  if (site.startsWith("site1")) return "站点一";
  if (site.startsWith("site2")) return "站点二";
  return site;
}

/** 采集动作键到中文展示名 */
export function actionKeyLabel(actionKey: string): string {
  const map: Record<string, string> = {
    "site1.incremental": "站点一增量采集",
    "site1.recovery": "站点一恢复采集",
    "site1.backfill": "站点一补采",
    "site2.incremental": "站点二增量采集",
    "site2.recovery": "站点二恢复采集",
    "site2.backfill": "站点二补采",
    "site2.precheck": "站点二预检",
    "site2.reconcile": "站点二核对",
  };
  return map[actionKey] ?? actionKey;
}

/** 运行结果摘要（用于今日概览等表格的「结果」列） */
export function runResultLabel(run: {
  status: string;
  statusReason: string | null;
  summary: string | null;
  upsertedCount: number | null;
  fetchedCount: number | null;
  errorCount: number | null;
  resultPayload?: { logTail?: string } | null;
}): string {
  const hasErrors = (run.errorCount ?? 0) > 0;
  if (run.status === "failed" || run.status === "rejected") {
    return run.statusReason ?? "失败";
  }
  if (hasErrors) {
    const tail = run.resultPayload?.logTail ?? "";
    if (tail.includes("验证码") && tail.includes("CAPTCHA")) return "验证码失败";
    if (tail.includes("ProxyError") || tail.includes("代理")) return "代理失败";
    return run.statusReason ?? "采集失败";
  }
  const count = run.upsertedCount ?? run.fetchedCount;
  if (count != null) {
    if (count === 0) return "0条 (窗口无数据)";
    return `${count}条`;
  }
  if (run.summary) {
    const m = run.summary.match(/saved=(\d+)/) ?? run.summary.match(/upserted=(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      return n === 0 ? "0条 (窗口无数据)" : `${n}条`;
    }
  }
  return run.summary ?? "-";
}
