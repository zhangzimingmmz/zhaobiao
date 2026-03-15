## 1. Control-plane execution foundation

- [x] 1.1 Define run request / lifecycle / lock persistence and the shared task registry for supported admin actions.
- [x] 1.2 Implement the dispatcher and startup recovery flow for `queued` / `running` manual requests.
- [x] 1.3 Add controlled subprocess adapters for supported tasks and capture exit status, summary, and log path.
- [x] 1.4 Enforce site-level execution locks and clear rejection reasons for conflicting requests.

## 2. Admin control APIs and surfaces

- [x] 2.1 Add `/api/admin/crawl/*` endpoints for submitting manual requests, polling status, and querying supported actions.
- [x] 2.2 Implement request validation for action allowlist, parameter schema, and bounded backfill constraints.
- [x] 2.3 Extend `/admin/crawl` with manual request forms, status polling, and visible reject/failure summaries.
- [x] 2.4 Merge manual runs into the existing crawl run history so `triggerSource=admin` and request metadata are visible in one place.

## 3. Safety verification and rollout

- [x] 3.1 Verify supported actions (`incremental`、`recovery`、bounded `backfill`、`precheck`、plain `reconcile`) can be triggered and reach terminal states.
- [x] 3.2 Verify disallowed actions (`cleanup`、`backfill --formal`、unsafe flags / oversized windows) are rejected with explicit reasons.
- [x] 3.3 Verify site-level lock behavior, startup orphan recovery, and failure summaries for subprocess exits.
- [x] 3.4 Document rollout guardrails, including the supported action matrix, backfill limits, and rollback path to read-only monitoring.
