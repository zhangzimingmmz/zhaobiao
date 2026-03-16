/**
 * 状态值到中文展示的映射，用于运营后台统一展示
 */

/** 企业审核状态 */
export function reviewStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "待审核",
    approved: "已通过",
    rejected: "已驳回",
  };
  return map[status] ?? status;
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

/** 站点标识（支持 site1、site2 及完整 ID 如 site1_sc_ggzyjy、site2_ccgp_sichuan） */
export function siteLabel(site: string): string {
  if (site.startsWith("site1")) return "站点一";
  if (site.startsWith("site2")) return "站点二";
  return site;
}
