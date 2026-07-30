# SwiftCase Portfolio Project Plan: Workflow Exception Control Centre

## 1. Purpose

Build a polished, deployable demonstration called **Workflow Exception Control Centre**. It is a focused operational workspace for service businesses where automation has encountered a case it cannot safely complete without review.

The product demonstrates the engineering judgement needed for SwiftCase: automate routine work, expose uncertainty, retain a complete audit trail, and give a person a fast, clear route to make the final decision. It is deliberately a complementary slice of a workflow platform, rather than an attempt to recreate SwiftCase.

SwiftCase publicly describes an integrated platform for case management, workflow automation, document generation, analytics, AI agents, policy guards and human hand-off. This project is tailored to those themes while remaining small enough to build and explain well.

## 2. The Problem Demonstrated

An incoming email or uploaded document creates a case. A workflow attempts to extract key details, classify urgency, validate the information against a rule set, and route the case. Ambiguous data, missing required evidence, failed external calls, low-confidence AI output, or policy-sensitive actions must not silently progress.

The control centre places those cases into an exception queue. An operator can inspect the source evidence, understand why automation stopped, correct data, approve or reject a suggested action, and resume the workflow. Every action is recorded.

### Example scenario

An insurance repair request arrives by email with a PDF estimate. The system extracts the claimant name, policy number, repair value and due date. It flags the case when the policy number is missing, the repair value exceeds an approval threshold, or extraction confidence is below the configured threshold. A reviewer resolves the issue and triggers the next workflow step.

Use synthetic, non-identifying sample data only. Do not use SwiftCase customer data, branding assets, internal documentation or credentials.

## 3. Goals and Boundaries

### Goals

- Show confident work in PHP and Symfony, including a maintainable existing-platform-style architecture.
- Demonstrate a secure workflow lifecycle: intake, validation, exception routing, human decision, retry and audit.
- Build an accessible, responsive Next.js interface using Tailwind CSS and Framer Motion for restrained, purposeful feedback.
- Show practical AI integration: structured extraction, confidence-aware handling, policy checks and human approval.
- Produce a clear engineering story covering testing, observability, security, documentation and delivery discipline.

### Explicit boundaries

- **No FastAPI or separate Python service.** Symfony owns application logic, validation, persistence, background jobs and the JSON API.
- Next.js is the frontend. It makes authenticated custom requests to Symfony's JSON API; it does not require a separate backend-for-frontend for this scope.
- The AI provider is an interchangeable adapter. It is not a source of truth and cannot execute irreversible workflow actions.
- Document parsing and AI extraction are represented by local fixtures or a configurable provider during the first release, so the demo remains repeatable and cost-controlled.
- This is not production legal, insurance or financial advice. Domain rules are illustrative and configurable.

## 4. Proposed Technical Design

| Area | Choice | Responsibility |
| --- | --- | --- |
| Backend | PHP 8.3+, Symfony | Domain rules, API, authentication, workflows, audit events and asynchronous jobs |
| Frontend | Next.js + TypeScript | Operator workspace, queue, case detail and analytics views |
| Tooling | Bun | Frontend package management, scripts, test runner and local developer commands |
| Styling | Tailwind CSS | Accessible design tokens and responsive layout |
| Motion | Framer Motion | Status changes, queue transitions and reduced-motion-aware feedback |
| Data | PostgreSQL | Cases, workflow runs, exceptions, decisions, audit events and idempotency keys |
| Async work | Symfony Messenger + Redis | Intake, extraction, retry and notification jobs |
| Files | S3-compatible object storage | Original fixtures/documents and derived artefacts, accessed by short-lived URLs |
| AI integration | Symfony provider adapter | Structured extraction with schema validation, confidence and provenance |
| Local delivery | Docker Compose | Repeatable PHP, Node/Next.js, PostgreSQL and Redis environment |
| CI | GitHub Actions | Linting, tests, security checks, build and deployment gates |

### Architecture and data flow

1. The frontend creates a case or submits an intake fixture to Symfony.
2. Symfony validates the request, stores the case, writes an audit event and queues an intake job.
3. A Messenger worker performs extraction through the adapter, validates the structured response and records confidence plus source references.
4. The workflow evaluator applies deterministic rules. A clean case advances; a failed rule creates an exception and assigns a human-review task.
5. The Next.js operator view polls or receives a safe update, then calls Symfony APIs to approve, amend, reject or retry.
6. Symfony validates the decision, applies optimistic-locking checks, writes a tamper-evident audit event and resumes or closes the workflow.

Use a modular Symfony structure: `CaseManagement`, `Workflow`, `ExceptionHandling`, `Audit`, `Identity` and `Integration`. Keep controllers thin; application services orchestrate use cases; domain objects and policies hold business rules; infrastructure adapters isolate persistence, queues, storage and AI providers.

## 5. Minimum Viable Demonstration

### Operator experience

- Dashboard with queue totals: awaiting review, SLA risk, resolved today and failed retries.
- Exception queue with filters for workflow, reason, priority, assignee and age.
- Case detail page showing source metadata, extracted fields, confidence, rule outcomes and an ordered audit timeline.
- Review panel with a clear reason for the stop, editable corrections, approve/reject/return-for-information actions and a required rationale where appropriate.
- Rules page containing three editable, versioned example rules: missing policy number, amount above threshold and low extraction confidence.
- Workflow run view displaying each step, status, retry history and a safe manual retry action.

### Quality details that make it memorable

- Explain every AI suggestion: display confidence, source excerpt reference and the specific policy rule that requires review.
- Provide a replayable demonstration dataset with cases already in each state: happy path, missing data, low confidence, provider failure and concurrent-update conflict.
- Respect `prefers-reduced-motion`; never use animation as the only indication of success or failure.
- Add keyboard navigation, visible focus states, semantic error messages and WCAG 2.2 AA-minded colour contrast.

## 6. API Contract

Use REST-style JSON endpoints, documented with OpenAPI and versioned under `/api/v1`.

- `POST /cases` - create a case from validated intake data.
- `GET /cases` and `GET /cases/{id}` - list and retrieve authorised case information.
- `GET /cases/{id}/exceptions` - retrieve active and historic exceptions.
- `POST /exceptions/{id}/decisions` - approve, reject, amend or request information.
- `POST /workflow-runs/{id}/retry` - request a guarded retry with an idempotency key.
- `GET /workflow-runs/{id}` - retrieve workflow state and step history.
- `GET /rules` and `PATCH /rules/{id}` - administer example rules, restricted to an administrator role.

Adopt a consistent problem-details response shape (`application/problem+json`) with a stable machine-readable error code, safe user message, correlation ID and field errors where applicable. Generate TypeScript API types from the OpenAPI contract or validate responses at the client boundary.

## 7. Error Handling and Resilience

### Principles

- Fail closed for permissions, policy controls and uncertain automation. The case remains reviewable instead of progressing silently.
- Separate a helpful, plain-English user message from structured diagnostic information for engineers.
- Return no stack traces, secrets, provider prompts or sensitive document contents to the browser.
- Attach a correlation ID to each HTTP request, queue message, audit event and structured log entry.
- Retry only transient failures. Use exponential back-off, bounded attempts, idempotency keys and a dead-letter queue.
- Preserve the original case and prior workflow state. Human decisions and automated actions are append-only audit events.

### Errors to detect and handle

| Error class | Examples to detect | User outcome | System behaviour |
| --- | --- | --- | --- |
| Input validation | Missing required field, malformed date, unsupported file type, oversized upload | Inline field message and no partial submission | Return `422`; log validation code only, not full sensitive payloads |
| Authentication and authorisation | Expired session, invalid token, role lacks permission | Sign in again or display access-denied message | Return `401` or `403`; audit denied sensitive actions |
| Concurrency | Two reviewers submit a decision for the same exception | Explain that the case changed and refresh current state | Use version/ETag checks; return `409`; retain both attempted events safely |
| Workflow state | Retry requested for a completed case, invalid transition, duplicate request | Show current status and permitted next action | Enforce state machine; return `409`; use idempotency key to prevent duplicates |
| AI/extraction quality | Invalid JSON schema, low confidence, missing source reference, unsafe content | Create or retain an exception for human review | Validate against schema; never auto-approve; record provider/model/version safely |
| Dependency failure | AI timeout, Redis unavailable, storage error, database timeout | State that processing is delayed, not completed | Return or queue `503` where appropriate; retry transient jobs and alert on exhaustion |
| Rate limiting | Repeated retry clicks or API burst | Ask user to wait before trying again | Return `429` with retry guidance; throttle per identity and endpoint |
| Security | CSRF failure, malicious filename, unauthorised object access, injection attempt | Generic safe error | Reject request; sanitise inputs; log security event; alert on threshold breaches |

### Observability and support

- Structured JSON logs include timestamp, correlation ID, actor ID or service identity, case ID, workflow ID, error code and safe context.
- Metrics include exception creation rate, workflow completion rate, queue latency, retry count, provider latency, failed-job count and human-resolution time.
- A concise runbook explains how to trace a correlation ID, replay a safe failed job, inspect the dead-letter queue and determine when to stop retries.
- Add health and readiness endpoints that never expose environment details.

## 8. Security and Privacy

- Use role-based access control: operator, supervisor and administrator; test every protected endpoint.
- Store minimal synthetic data, encrypt secrets through environment or deployment secret management, and redact sensitive fields in logs.
- Validate file content and size server-side, store files outside the web root, and use short-lived signed access URLs.
- Apply rate limiting, secure HTTP headers, input validation, output encoding, CSRF protection where cookie sessions are used, and parameterised database access.
- Record audit events for authentication, authorisation failures, rule changes, manual decisions, retries and document access.
- Include a lightweight threat model covering unauthorised case access, AI prompt/data leakage, unsafe file upload, workflow manipulation and replayed requests.

## 9. Testing Plan

| Layer | Scope | Tools and approach | Required evidence |
| --- | --- | --- | --- |
| Unit | Domain rules, state transitions, confidence thresholds, error mapping | PHPUnit; deterministic fixtures and data providers | Fast suite with branch coverage of workflow decisions |
| Integration | Symfony controllers, Doctrine persistence, Messenger handlers, Redis and storage adapters | PHPUnit with PostgreSQL/Redis service containers or Docker Compose | Contract-compliant responses and real transaction behaviour |
| Contract | OpenAPI request/response schemas and frontend API client | OpenAPI validation; generated TypeScript types or schema checks | Breaking API changes fail CI |
| Frontend unit | Components, forms, accessibility states and error rendering | Bun test runner with Testing Library | User-visible validation and error states covered |
| End-to-end | Create case, produce exception, make decision, retry failure and inspect audit history | Playwright against a seeded environment | Happy path plus each critical failure path passes |
| Accessibility | Keyboard flow, focus management, semantic messages and contrast | Playwright checks plus manual screen-reader spot check | No critical automated accessibility issues |
| Security | Authorisation matrix, input boundaries, dependency and static analysis | Symfony security tests, OWASP ZAP baseline, Dependabot/Snyk or equivalent | Protected routes cannot be accessed by wrong roles |
| Performance | Queue throughput and common list/detail endpoints | k6 or Artillery with synthetic data | Document baseline and agreed limits, not fabricated claims |

Run unit, lint, type, contract and relevant integration tests on every pull request. Run end-to-end, accessibility baseline, dependency scanning and performance smoke checks on the main branch or nightly. Seed test data only; tests must never call a live AI provider.

## 10. Delivery Plan: Six Weeks

### Week 1 - Discovery and foundations

- Write a short problem statement, assumptions, user stories and definition of done.
- Create the Symfony and Next.js applications, Docker Compose setup, Bun scripts, CI skeleton and contribution guide.
- Define API conventions, authentication approach, domain model and initial threat model.
- Open a small foundation pull request with setup, formatting, linting and a passing smoke test.

### Week 2 - Case intake and audit trail

- Implement the case model, intake endpoint, validation, PostgreSQL migrations and append-only audit events.
- Build the case list and basic detail view with accessible empty, loading and error states.
- Add PHPUnit unit/integration tests and OpenAPI documentation.

### Week 3 - Workflow and exception engine

- Implement the workflow state machine, three configurable rules and exception entities.
- Add Symfony Messenger jobs, idempotency handling and retry/dead-letter behaviour.
- Build the exception queue, filters and audit timeline; add Playwright happy-path coverage.

### Week 4 - AI integration and guarded review

- Add the provider adapter, structured schema validation and deterministic fixture provider.
- Implement confidence thresholds, human decision actions and concurrency protection.
- Demonstrate failure fixtures: malformed provider response, low confidence and timeout.

### Week 5 - Operational quality

- Add structured logging, correlation IDs, health checks, metrics and the support runbook.
- Complete authorisation matrix tests, security baseline, accessibility pass and API client validation.
- Add a small analytics view using aggregated, non-sensitive workflow metrics.

### Week 6 - Polish and presentation

- Improve visual hierarchy and restrained Framer Motion transitions, including reduced-motion behaviour.
- Record a three-to-five minute walkthrough: intake, exception, decision, audit trail and a failed dependency retry.
- Deploy a demo with synthetic seed data, finalise documentation and conduct a retrospective.

## 11. Collaboration and Pull-Request Practice

- Work on short-lived feature branches and raise at least one coherent pull request each week. Prefer small, reviewable changes over a weekly bulk drop.
- Each pull request includes the problem addressed, approach, screenshots or a short recording for UI work, test evidence, risk/rollback notes and linked documentation updates.
- Request one code review before merge. For changes to permissions, workflow state or data migrations, request a second reviewer where possible.
- Reviewers check correctness, clarity, security/privacy impact, tests, accessibility and whether observability has been considered.
- Resolve comments with explanation or follow-up commit; do not merge with unresolved blocking feedback.
- Require passing CI, an approved review and a green deployment smoke check before merging to `main`.
- Hold a brief weekly engineering review: demonstrate progress, discuss one technical trade-off, assess the error log/failed-job dashboard, and select the next small milestone.

## 12. Repository Documentation

Write every document in UK English, including spelling such as “authorisation”, “optimisation”, “behaviour” and “prioritise”. Keep it concise and practical.

- `README.md` - problem, architecture diagram, local setup, demo accounts, screenshots, feature list and link to walkthrough.
- `docs/architecture.md` - module boundaries, data flow, key design decisions and trade-offs.
- `docs/api.md` - OpenAPI usage, authentication, endpoint examples and problem-details errors.
- `docs/error-handling.md` - error taxonomy, retries, correlation IDs, dead-letter handling and operator-facing messages.
- `docs/testing.md` - test pyramid, commands, test data policy, CI gates and manual acceptance checks.
- `docs/security.md` - threat model, access control, data handling, secret management and dependency policy.
- `docs/runbook.md` - diagnosing failed jobs, correlation-ID tracing, retry safety and incident communication.
- `CONTRIBUTING.md` - branch, pull-request, review and release expectations.

## 13. Completion Criteria

The project is ready to share when a reviewer can clone it, run it locally with documented commands, and complete the demo journey without external credentials: create a case, see an automation exception, understand why it occurred, make an authorised human decision, inspect the audit trail and observe a failed dependency being retried safely.

The accompanying walkthrough should make three points unmistakable: you can work comfortably in Symfony/PHP, you treat AI as a guarded workflow participant rather than magic, and you ship software with testing, security, observability and collaboration discipline built in.
