## MODIFIED Requirements

### Requirement: Request timeout configuration
The site2 crawler SHALL use `config.REQUEST_TIMEOUT` (default: 30 seconds) for all outbound HTTP requests to the target site, replacing the previously hardcoded `timeout=15`.

#### Scenario: Slow target site response within 30s succeeds
- **WHEN** the target site responds in 25 seconds
- **THEN** the request SHALL succeed without timeout error

#### Scenario: Request exceeding 30s times out
- **WHEN** the target site does not respond within `REQUEST_TIMEOUT` seconds
- **THEN** a `ReadTimeout` exception SHALL be raised

### Requirement: Error-aware session management in process_window
The `process_window` function SHALL handle errors differently based on error type:
- Transport errors (timeout, connection) that are NOT proxy errors → retry with same session
- Proxy errors → create new session
- Empty list results → create new session (existing behavior preserved, may indicate captcha/auth issue)

#### Scenario: ReadTimeout in list fetch retries with same session
- **WHEN** `fetch_list` raises `ReadTimeout` in `process_window`
- **THEN** `process_window` SHALL retry the same page with the same session
- **AND** SHALL NOT call `create_session()`

#### Scenario: ProxyError in detail fetch triggers new session
- **WHEN** `fetch_detail` raises `ProxyError` in the retry loop
- **THEN** `process_window` SHALL call `create_session()` before retrying
