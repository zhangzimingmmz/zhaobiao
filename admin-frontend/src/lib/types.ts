export type ApiResponse<T> = {
  code: number;
  message?: string;
  data?: T;
};

export type ReviewItem = {
  id: string;
  userId: string;
  username: string;
  userMobile: string;
  companyName: string;
  creditCode: string;
  contactName: string | null;
  contactPersonName?: string | null;
  contactPhone: string;
  legalPersonName: string | null;
  legalPersonPhone: string | null;
  businessScope: string | null;
  businessAddress: string | null;
  status: string;
  accountStatus?: string;
  createdAt: string;
  updatedAt: string;
  auditAt: string | null;
  auditedBy: string | null;
  auditedByName?: string | null;
};

export type ReviewDetail = ReviewItem & {
  licenseImage: string;
  rejectReason: string | null;
};

export type CompaniesData = {
  total: number;
  list: ReviewItem[];
};

export type ReviewsData = {
  total: number;
  list: ReviewItem[];
};

export type CrawlAction = {
  actionKey: string;
  site: string;
  taskName: string;
  runKind: string;
  notes?: string;
};

export type CrawlRun = {
  id: string;
  site: string;
  taskName: string;
  actionKey: string;
  runKind: string;
  requestedBy: string;
  status: string;
  statusReason: string | null;
  requestPayload: { params?: Record<string, unknown> };
  resultPayload: { logTail?: string } | null;
  summary: string | null;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  logPath: string | null;
  command: string | null;
  exitCode: number | null;
  fetchedCount: number | null;
  upsertedCount: number | null;
  errorCount: number | null;
};

export type AdminReviewer = {
  adminId: string;
  username: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
