# API Guide

CaseSignal exposes a JSON API under `/api/v1`. The frontend calls it directly with the Symfony session cookie and uses `application/problem+json` for failures.

## Authentication

- `POST /auth/login` accepts an email address and password, verifies the password server-side, renews the session ID and returns the current operator.
- `GET /auth/me` returns the active operator or `401` when no valid session exists.
- `POST /auth/logout` invalidates the active session.

## Workflow operations

- `GET /dashboard` returns the current operator's workflow metrics, queue and activity summary.
- `POST /demo/reset` restores the signed-in operator's synthetic workflow fixtures and returns the refreshed dashboard. It is available only for this local portfolio demonstration.
- `GET /cases/{caseId}` returns the evidence, confidence, workflow state and complete audit trail for an individual case.
- `POST /cases/{caseId}/actions` applies a guarded workflow action and appends an audit event.

The action body contains an `action` and optional `note`:

```json
{
  "action": "approve",
  "note": "Policy number verified with the customer by phone."
}
```

Supported actions are `approve`, `request_information`, `reject` and `retry`. Closed cases reject further state changes with `409`, unsupported input returns a problem response, and an unauthenticated request returns `401`.

## Demonstration fixtures

Nine session-backed fixtures provide repeatable scenarios for manual testing:

| Case | Status | Scenario |
| --- | --- | --- |
| `CS-1042` | Awaiting review | Missing policy number |
| `CS-1041` | Pending review | Duplicate claim reference |
| `CS-1039` | Awaiting decision | Approval threshold exceeded |
| `CS-1038` | Pending approval | Payment authority needed |
| `CS-1037` | In review | Low extraction confidence |
| `CS-1036` | Awaiting response | Customer evidence requested |
| `CS-1035` | Reprocessing | Safe provider timeout retry |
| `CS-1034` | Resolved | Evidence validated |
| `CS-1033` | Rejected | Unsupported repair category |

The dashboard presents pending, review and waiting states with a yellow status label. `POST /demo/reset` clears only the current operator's fixture state, restores this list and returns a success message plus dashboard payload. It returns `401` if the operator is not signed in.

## Portfolio data policy

This release stores seeded workflow data and the operator's actions in their Symfony server session. It gives each signed-in operator a persistent, isolated interactive demonstration without claiming that the sample data is production data. PostgreSQL and Redis are already part of the Docker environment for the next persistence and asynchronous-workflow increment. The reset endpoint must not be enabled in a production deployment.
