# Error Handling

CaseSignal fails closed for permissions, policy controls and uncertain automation. An exception must remain visible and reviewable; it must never silently progress.

## API responses

The API uses `application/problem+json` for errors. A response contains a safe user-facing message, a stable machine-readable error code, a correlation ID, and field errors where relevant. Browser clients never receive stack traces, secrets, AI prompts or sensitive source content.

## Errors to handle

- Invalid case data, unsupported uploads and malformed dates return validation feedback without a partial case submission.
- Expired credentials and missing permissions return `401` or `403` and create an audit event for denied sensitive actions.
- Stale review decisions and duplicate workflow actions return `409`; future persistence uses version checks and idempotency keys.
- Invalid AI output, missing provenance and low-confidence extraction create a human-review exception rather than an automated approval.
- Transient provider, queue, storage and database failures are retried with bounded exponential back-off. Exhausted jobs go to a dead-letter queue and alert the team.
- Repeated requests are rate limited with `429` and clear retry guidance.
- Unauthenticated dashboard requests return a safe `401` problem response; the frontend returns the operator to the sign-in page without exposing protected case data.
- Invalid workflow actions, unknown case IDs and attempts to change a closed case return a stable problem response. The API preserves the prior workflow state and records no audit event when an action is rejected.

## Observability

Each request will carry a correlation ID across HTTP logs, queue messages and audit events. Logs should contain safe identifiers and error codes, never secret or document contents. Core metrics include failed jobs, queue latency, workflow completion rate, exception age, retry count and provider latency.
