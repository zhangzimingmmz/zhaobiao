import { getAdminToken } from "./auth";
import type { AdminReviewer, AdminReviewerListData, ApiResponse, ReviewDetail } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth !== false) {
    const token = getAdminToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (payload.code !== 200 || payload.data === undefined) {
    throw new Error(extractApiErrorMessage(payload));
  }
  return payload.data;
}

function extractApiErrorMessage(payload: ApiResponse<unknown>): string {
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }

  if (Array.isArray(payload.detail)) {
    const firstError = payload.detail.find(
      (item) => typeof item?.msg === "string" && item.msg.trim(),
    );
    if (firstError?.msg) {
      return firstError.msg;
    }
  }

  if (
    payload.detail &&
    typeof payload.detail === "object" &&
    !Array.isArray(payload.detail) &&
    typeof payload.detail.message === "string" &&
    payload.detail.message.trim()
  ) {
    return payload.detail.message;
  }

  return "请求失败";
}

export const apiBase = API_BASE;

export type ContactSettings = {
  supportPhone: string;
};

export async function getContactSettings(): Promise<ContactSettings> {
  return apiRequest<ContactSettings>("/api/admin/app-settings/contact");
}

export async function updateContactSettings(supportPhone: string): Promise<ContactSettings> {
  return apiRequest<ContactSettings>("/api/admin/app-settings/contact", {
    method: "PUT",
    body: { supportPhone },
  });
}

export async function getAdminReviewers(): Promise<AdminReviewerListData> {
  return apiRequest<AdminReviewerListData>("/api/admin/reviewers");
}

export async function createAdminReviewer(input: {
  username: string;
  password: string;
}): Promise<AdminReviewer> {
  return apiRequest<AdminReviewer>("/api/admin/reviewers", {
    method: "POST",
    body: input,
  });
}

export async function resetAdminReviewerPassword(
  adminId: string,
  password: string,
): Promise<AdminReviewer> {
  return apiRequest<AdminReviewer>(`/api/admin/reviewers/${adminId}/reset-password`, {
    method: "POST",
    body: { password },
  });
}

export async function updateAdminReviewerUsername(
  adminId: string,
  username: string,
): Promise<AdminReviewer> {
  return apiRequest<AdminReviewer>(`/api/admin/reviewers/${adminId}`, {
    method: "PUT",
    body: { username },
  });
}

export async function updateAdminReviewerStatus(
  adminId: string,
  status: "active" | "disabled",
): Promise<AdminReviewer> {
  return apiRequest<AdminReviewer>(`/api/admin/reviewers/${adminId}/status`, {
    method: "POST",
    body: { status },
  });
}

export async function deleteAdminReviewer(
  adminId: string,
  confirmUsername: string,
): Promise<{ adminId: string; username: string }> {
  return apiRequest<{ adminId: string; username: string }>(`/api/admin/reviewers/${adminId}`, {
    method: "DELETE",
    body: { confirmUsername },
  });
}

export type AdminLoginResponse = {
  token: string;
  tokenType: string;
  username: string;
  adminId: string;
  role: string;
};

export type CompanyUpdateInput = {
  companyName: string;
  creditCode: string;
  contactName?: string;
  contactPhone?: string;
  legalPersonName?: string;
  legalPersonPhone?: string;
  businessScope?: string;
  businessAddress?: string;
};

export async function getCompanyDetail(id: string): Promise<ReviewDetail> {
  return apiRequest<ReviewDetail>(`/api/admin/companies/${id}`);
}

export async function updateCompanyDetail(id: string, data: CompanyUpdateInput): Promise<ReviewDetail> {
  return apiRequest<ReviewDetail>(`/api/admin/companies/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deleteTestCompanyData(id: string, confirmCreditCode: string): Promise<{
  applicationId: string;
  userId: string;
  deletedBy: string;
  deletedByName: string;
}> {
  return apiRequest<{
    applicationId: string;
    userId: string;
    deletedBy: string;
    deletedByName: string;
  }>(`/api/admin/companies/${id}/delete-test-data`, {
    method: "POST",
    body: { confirmCreditCode },
  });
}

export async function invalidateReview(id: string, reason: string): Promise<{
  applicationId: string;
  status: string;
  reason: string;
  auditAt: string;
  auditedBy: string;
  auditedByName: string;
}> {
  return apiRequest<{
    applicationId: string;
    status: string;
    reason: string;
    auditAt: string;
    auditedBy: string;
    auditedByName: string;
  }>(`/api/admin/reviews/${id}/invalidate`, {
    method: "POST",
    body: { reason },
  });
}


// ────────────────────────────────────────────────────────────
// Article Management API
// ────────────────────────────────────────────────────────────

export type Article = {
  id: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  wechatArticleUrl: string;
  category: string | null;
  status: string;
  sortOrder: number;
  publishTime: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string | null;
  authorName: string | null;
  linkStatus: string;
  viewCount: number;
};

export type ArticleCreateInput = {
  title: string;
  summary?: string;
  coverImageUrl?: string;
  wechatArticleUrl: string;
  category?: string;
  sortOrder?: number;
};

export type ArticleUpdateInput = {
  title?: string;
  summary?: string;
  coverImageUrl?: string;
  wechatArticleUrl?: string;
  category?: string;
  sortOrder?: number;
};

export type ValidateUrlResult = {
  valid: boolean;
  title?: string;
  cover?: string;
  summary?: string;
  error?: string;
};

export type CheckDuplicateResult = {
  exists: boolean;
  article?: {
    id: string;
    title: string;
    status: string;
  };
};

export async function validateArticleUrl(url: string): Promise<ValidateUrlResult> {
  return apiRequest<ValidateUrlResult>("/api/admin/articles/validate-url", {
    method: "POST",
    body: { url },
  });
}

export async function checkDuplicateArticle(
  url: string,
  excludeId?: string,
): Promise<CheckDuplicateResult> {
  return apiRequest<CheckDuplicateResult>("/api/admin/articles/check-duplicate", {
    method: "POST",
    body: { url, excludeId },
  });
}

export async function createArticle(data: ArticleCreateInput): Promise<Article> {
  return apiRequest<Article>("/api/admin/articles", {
    method: "POST",
    body: data,
  });
}

export async function getAdminArticles(params: {
  status?: string;
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ total: number; list: Article[] }> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.category) query.set("category", params.category);
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));

  return apiRequest<{ total: number; list: Article[] }>(
    `/api/admin/articles?${query.toString()}`,
  );
}

export async function getArticle(id: string): Promise<Article> {
  return apiRequest<Article>(`/api/admin/articles/${id}`);
}

export async function updateArticle(id: string, data: ArticleUpdateInput): Promise<Article> {
  return apiRequest<Article>(`/api/admin/articles/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function publishArticle(id: string): Promise<{ id: string; status: string; publishTime: string }> {
  return apiRequest<{ id: string; status: string; publishTime: string }>(
    `/api/admin/articles/${id}/publish`,
    { method: "POST", body: {} },
  );
}

export async function unpublishArticle(id: string): Promise<{ id: string; status: string }> {
  return apiRequest<{ id: string; status: string }>(
    `/api/admin/articles/${id}/unpublish`,
    { method: "POST", body: {} },
  );
}

export async function deleteArticle(id: string): Promise<{ message: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getAdminToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBase}/api/admin/articles/${id}`, {
    method: "DELETE",
    headers,
  });

  const payload = (await response.json()) as ApiResponse<{ message: string }>;
  if (payload.code !== 200) {
    throw new Error(payload.message ?? "删除失败");
  }
  return payload.data ?? { message: payload.message ?? "删除成功" };
}
