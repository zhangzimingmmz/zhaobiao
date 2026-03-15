## ADDED Requirements

### Requirement: Site2 formal backfill rebuilds a clean baseline
The system SHALL support a formal site2 initialization process that removes historical test data for `site2_ccgp_sichuan` and rebuilds the dataset from `2026-03-01` through the execution time for notice types `59` and `00101`.

#### Scenario: Formal initialization after test cleanup
- **WHEN** an operator starts the formal site2 initialization process
- **THEN** the system MUST clear the historical test dataset for `site2_ccgp_sichuan` before loading the formal baseline
- **AND** the system MUST backfill both `59` and `00101` from `2026-03-01` through the current execution cutoff

#### Scenario: Initialization produces a verifiable baseline
- **WHEN** the formal backfill finishes for a day and notice type
- **THEN** the system MUST expose enough counts or logs to compare source totals with database totals for that day and notice type

### Requirement: Site2 writes SHALL be idempotent across repeated execution
The system SHALL treat `(site, id)` as the unique identity of a site2 notice and MUST converge repeated backfill, incremental, recovery, and manual reruns into a single final record without creating duplicates.

#### Scenario: Re-running the same window does not duplicate records
- **WHEN** the same site2 time window is processed multiple times for the same notice type
- **THEN** the database MUST contain at most one record for each `(site, id)` pair
- **AND** later executions MUST be allowed to update incomplete fields on the existing record

#### Scenario: Manual and scheduled runs converge to the same result
- **WHEN** a manual run and a scheduled run both process overlapping site2 windows
- **THEN** the resulting dataset MUST converge to the same unique records after upsert

### Requirement: Site2 incremental collection SHALL favor non-loss over minimal overlap
The system SHALL run site2 incremental collection on a recurring two-hour cadence, but each incremental execution MUST include a safety overlap window so that records near window boundaries or delayed publication times are re-scanned.

#### Scenario: Incremental run includes overlap
- **WHEN** the scheduled site2 incremental task starts
- **THEN** it MUST scan more than the last exact two-hour slice
- **AND** it MUST rely on idempotent writes so that overlapping records do not create duplicates

#### Scenario: Boundary records remain collectible
- **WHEN** a notice appears near an incremental window boundary or becomes visible late on the source site
- **THEN** a later incremental or recovery run MUST still be able to collect and upsert that notice

### Requirement: Site2 SHALL provide compensating recovery for recent windows
The system SHALL provide a recovery path that reprocesses recent site2 windows across both notice types so that transient failures in captcha solving, proxying, list fetches, or detail fetches do not become permanent data loss.

#### Scenario: Recovery revisits recent notice windows
- **WHEN** the site2 recovery task runs
- **THEN** it MUST re-scan a recent rolling time range that includes previously processed windows
- **AND** it MUST process both `59` and `00101`

#### Scenario: Recovery repairs earlier partial records
- **WHEN** a prior run inserted a site2 notice with missing detail fields
- **THEN** a later recovery run MUST be able to update that same `(site, id)` record with more complete fields

### Requirement: Site2 stability SHALL be observable by reconciliation
The system SHALL provide a reconciliation view that compares source totals and stored totals by date and notice type so operators can detect missing data after backfill, incremental, or recovery runs.

#### Scenario: Daily reconciliation reports coverage
- **WHEN** an operator requests reconciliation for a site2 date range
- **THEN** the system MUST report source totals and database totals for each date and each supported notice type

#### Scenario: Reconciliation highlights gaps
- **WHEN** source totals and database totals differ for a site2 date or type
- **THEN** the system MUST surface that mismatch as a failed or incomplete state rather than silently treating the run as successful

### Requirement: Site2 task interfaces SHALL remain runnable as a coordinated pipeline
The system SHALL keep site2 backfill, incremental, and recovery entry points compatible with the shared execution core so that all three modes can be executed without signature mismatches or divergent behavior.

#### Scenario: Incremental task uses the shared execution path
- **WHEN** the site2 incremental entry point runs
- **THEN** it MUST invoke the same core execution path used by backfill for window processing and persistence

#### Scenario: Recovery task uses the shared execution path
- **WHEN** the site2 recovery entry point runs
- **THEN** it MUST invoke the same core execution path used by backfill for window processing and persistence

### Requirement: Site2 SHALL be verifiable in a real network environment
The system SHALL support a phased acceptance verification that runs all tasks in a real network environment and checks data and logs.

#### Scenario: Phase 0 preparation
- **WHEN** an operator prepares for full verification
- **THEN** the operator MAY backup `data/notices.db` and create a `logs/` directory
- **AND** the backup is recommended because `--formal` clears all site2 data

#### Scenario: Phase 1 pre-check (read-only)
- **WHEN** the operator runs `precheck`, `cleanup --dry-run`, and `reconcile --start X --end Y`
- **THEN** the system MUST output old data distribution, expected backfill range, and target notice types
- **AND** the system MUST NOT modify the database during pre-check

#### Scenario: Phase 2 formal initialization
- **WHEN** the operator runs `backfill --formal`
- **THEN** the system MUST clear site2 test data and backfill from `2026-03-01` to current date
- **AND** logs MUST include `Deleted X records`, `source_total`, `Page N: fetched=..., upserted=...`, and `backfill complete`
- **AND** the run MUST complete without abnormal exit; `errors` count MAY be non-zero but MUST be acceptable

#### Scenario: Phase 3 incremental and recovery
- **WHEN** the operator runs `incremental` and `recovery`
- **THEN** both tasks MUST complete without abnormal exit
- **AND** logs MUST show `fetched` and `upserted` counts

#### Scenario: Phase 4 reconciliation and verification
- **WHEN** the operator runs `reconcile`, `--verify-idempotent`, `--verify-boundary`, and `--verify-recovery`
- **THEN** reconciliation MUST report source vs db for each date and notice type
- **AND** idempotency verification MUST report `Idempotency: OK` with `dupes=0`
- **AND** boundary verification MUST report `Boundary verification: OK`
- **AND** recovery verification MUST report `Recovery verification: OK` with exit code 0

#### Scenario: Phase 5 data inspection
- **WHEN** the operator inspects the database after verification
- **THEN** there MUST be no duplicate `(site, id)` pairs for `site2_ccgp_sichuan`
- **AND** `category_num` distribution MUST be reasonable (59 and 00101 present)

#### Scenario: Acceptance pass criteria
- **WHEN** all five phases complete
- **THEN** pre-check output MUST show data distribution and ranges
- **AND** formal init MUST complete without abnormal exit
- **AND** incremental and recovery MUST complete with fetched/upserted counts
- **AND** reconciliation MUST show majority of date/type checks as OK; GAP count MAY be non-zero but acceptable
- **AND** idempotency MUST pass with dupes=0
- **AND** boundary and recovery verification MUST output OK with exit 0
- **AND** database MUST have no duplicate (site, id) and reasonable category_num distribution

### Requirement: Site2 verification tooling SHALL be usable without workarounds
The system SHALL ensure verification commands run correctly without requiring dummy arguments or fixing broken imports.

#### Scenario: Reconcile verification flags do not require date range
- **WHEN** an operator runs `reconcile --verify-recovery` or `reconcile --verify-boundary DATE`
- **THEN** the system MUST NOT require `--start` or `--end` arguments
- **AND** the verification MUST execute and exit with the appropriate status code

#### Scenario: Reconcile date range required only for reconciliation
- **WHEN** an operator runs `reconcile --start X --end Y` (without verification flags)
- **THEN** the system MUST require `--start` and `--end`
- **AND** when `--verify-idempotent` is used with reconciliation, the first reconciled window MUST be used for the idempotency check

#### Scenario: Test or smoke entry points use correct exports
- **WHEN** a test or smoke script imports from site2 tasks (e.g. backfill)
- **THEN** it MUST use the actual exported names (e.g. `run` not `run_backfill`)
- **AND** the script MUST execute without import errors

#### Scenario: Optional one-command verification script
- **WHEN** an operator prefers a single script to run all verification phases
- **THEN** the system MAY provide a script (e.g. `scripts/verify_site2.sh`) that runs Phase 0 through Phase 5
- **AND** the script MAY tee output to `logs/` for inspection

#### Scenario: Environment prerequisites documented
- **WHEN** an operator prepares for verification
- **THEN** the runbook or documentation MUST state that proxy, network access, and captcha service are required
- **AND** date expansion (e.g. `$(date +%Y-%m-%d)`) MAY be documented as requiring bash or equivalent
