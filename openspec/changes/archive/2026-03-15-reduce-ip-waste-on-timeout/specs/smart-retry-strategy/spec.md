## ADDED Requirements

### Requirement: Error classification distinguishes proxy errors from target-site slowness
The system SHALL classify request errors into two categories:
- **Proxy errors**: `ProxyError`, `RemoteDisconnected`, `SSLError`, `SSLEOFError`, `IncompleteRead` — indicate the proxy tunnel is broken
- **Timeout errors**: `ReadTimeout`, `ConnectionTimeout` — indicate the target site is slow but the proxy is functional

A utility function `is_proxy_error(exc)` SHALL be provided to perform this classification.

#### Scenario: ReadTimeout is not classified as proxy error
- **WHEN** a `requests.exceptions.ReadTimeout` exception is passed to `is_proxy_error`
- **THEN** the function SHALL return `False`

#### Scenario: ProxyError is classified as proxy error
- **WHEN** a `requests.exceptions.ProxyError` exception is passed to `is_proxy_error`
- **THEN** the function SHALL return `True`

#### Scenario: SSLError is classified as proxy error
- **WHEN** an `urllib3.exceptions.SSLError` exception is passed to `is_proxy_error`
- **THEN** the function SHALL return `True`

### Requirement: Session rotation only on proxy errors
The system SHALL only create a new session (consuming a new proxy IP) when the error is classified as a proxy error. For timeout errors, the system SHALL reuse the current session and retry the request.

#### Scenario: Timeout during detail fetch reuses session
- **WHEN** a `ReadTimeout` occurs during `fetch_detail`
- **THEN** the system SHALL retry using the same session without calling `create_session()`
- **AND** the retry count SHALL be incremented normally

#### Scenario: ProxyError during detail fetch rotates session
- **WHEN** a `ProxyError` occurs during `fetch_detail`
- **THEN** the system SHALL call `create_session()` to obtain a new proxy IP before retrying

#### Scenario: Timeout during list fetch reuses session
- **WHEN** a `ReadTimeout` occurs during `fetch_list`
- **THEN** the system SHALL retry using the same session
- **AND** SHALL NOT create a new session

### Requirement: Configurable request timeout
The system SHALL use a configurable `REQUEST_TIMEOUT` value (default 30 seconds) for all HTTP requests to the target site, replacing hardcoded timeout values.

#### Scenario: Config value is used for list requests
- **WHEN** `fetch_list` sends an HTTP request
- **THEN** it SHALL use `config.REQUEST_TIMEOUT` as the timeout parameter

#### Scenario: Config value is used for detail requests
- **WHEN** `fetch_detail` sends an HTTP request
- **THEN** it SHALL use `config.REQUEST_TIMEOUT` as the timeout parameter

### Requirement: Client propagates transport exceptions
`fetch_list` and `fetch_detail` SHALL propagate transport-level exceptions (`ReadTimeout`, `ProxyError`, `ConnectionError`, `SSLError`) to the caller instead of catching them and returning empty results. Business-level errors (API returns error code) SHALL still return empty results.

#### Scenario: ReadTimeout propagated from fetch_list
- **WHEN** `fetch_list` encounters a `ReadTimeout`
- **THEN** the exception SHALL be raised to the caller

#### Scenario: API error code returns empty result
- **WHEN** the target API returns `{"code": "500"}` without transport error
- **THEN** `fetch_list` SHALL return `{"total": 0, "rows": []}` without raising
