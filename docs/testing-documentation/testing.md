# Testing Guide

CaseSignal uses synthetic, session-backed data only. Do not use customer data, live credentials or a live AI provider in automated or manual tests.

## Automated checks

Run frontend checks from `frontend/`:

```sh
bun run lint
bun run build
```

Run backend checks from `backend/`:

```sh
php -l src/Controller/CaseSignalController.php
php -l src/Service/WorkflowCaseStore.php
php bin/console lint:container
```

The delivery plan adds PHPUnit unit/integration coverage, API contract checks and Playwright end-to-end coverage. Run lint, type/build checks and relevant tests on every pull request; run the wider accessibility, security and end-to-end suite before merge to `main`.

## Manual acceptance checks

1. Start the stack with `./start-dev.sh`, then sign in using the documented demonstration account.
2. Confirm the dashboard shows all nine fixtures and yellow labels for Awaiting review, Pending review, Awaiting decision, Pending approval, In review, Awaiting response and Reprocessing.
3. Open `CS-1042`, add a rationale and approve it. Confirm the status becomes Resolved, the metric updates and the audit trail records the action.
4. Open `CS-1037`, request information or queue a retry. Confirm the new status, actor and rationale appear without a page refresh.
5. Open `CS-1034` or `CS-1033` and attempt an action. Confirm closed actions are disabled and no audit event is added.
6. Use **Reset demo**. Confirm all nine original cases and statuses return, including `CS-1042` as Awaiting review.
7. Sign out, then request a protected dashboard route. Confirm the application returns to sign in without showing protected data.
8. Check light and dark modes at narrow and wide viewport widths. Confirm controls remain reachable, the dashboard grid reflows, and yellow review labels remain legible.

## Failure checks

- Send an unsupported workflow action or an unknown case ID and confirm a safe `application/problem+json` message is shown.
- Attempt a reset without a session and confirm the API returns `401` without changing any fixture data.
- Temporarily stop the API container, trigger an action and confirm the frontend keeps the visible case state and presents a safe error message.

## Review evidence

Attach the commands run, expected versus actual outcome, and a screenshot or recording for interface changes to the weekly pull request. Reset the demonstration fixtures before capturing evidence so a reviewer can reproduce the journey.
