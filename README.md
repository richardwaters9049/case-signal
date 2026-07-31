# CaseSignal

CaseSignal is an exception-control workspace for service operations. It makes workflow failures visible, explains why automation paused, and provides a safe path for a person to decide what happens next.

It is a portfolio project tailored to demonstrate PHP/Symfony, Next.js, workflow automation, auditability, operational resilience and guarded AI integration.

## Technology

- `backend/`: PHP 8.4 and Symfony 8 JSON API.
- `frontend/`: Next.js, TypeScript, Bun, Tailwind CSS and Framer Motion.
- No FastAPI or separate Python service. Symfony owns the application API and workflow logic.

## Run locally

With Docker Desktop running, start the full development environment with one command:

```sh
./start-dev.sh
```

This starts the frontend, Symfony API, PostgreSQL and Redis. Source folders are bind-mounted, so Next.js Fast Refresh and Symfony development mode apply your saved changes without restarting containers. Open `http://localhost:3000` when the services are ready.

## Current slice

The initial vertical slice includes a Symfony session-authentication API, a landing-page login form, and a protected Next.js operations dashboard. Operators can open a case, inspect evidence and AI confidence, add a rationale, approve, reject, request information or queue a safe retry. Every action updates the visible workflow state and appends an audit event in the signed-in operator's server session.

## Demonstration fixtures

The dashboard starts with nine synthetic workflow cases covering awaiting review, pending review, awaiting decision, pending approval, in review, awaiting response, reprocessing, resolved and rejected states. Yellow labels identify any state that is pending, requires a review or is safely waiting; green represents a completed decision and red represents rejection or SLA risk.

Use **Reset demo** in the signed-in operator panel to restore the original fixture set after exercising workflow actions. The reset is authenticated, only resets that operator's server-session data, and is for local demonstration only.

## Demonstration sign in

- Email: `richard@casesignal.local`
- Password: `CaseSignal2026!`

The demonstration account is verified server-side with Argon2id and stored in a server-side Symfony session. It exists only for this portfolio environment; production credentials must be persisted securely and use rate limiting, account recovery and multi-factor authentication as appropriate.

## Testing

CaseSignal employs a comprehensive testing strategy covering unit, integration, API, UI, end-to-end, performance, load, security, regression, MQTT, failure scenarios, observability, and AI evaluation. The testing approach follows a pyramid model with 60% unit tests, 30% integration tests, and 10% E2E tests, ensuring quality at every layer. For detailed testing documentation, methodologies, and examples, see the [testing documentation](docs/testing-documentation).

Read [the product plan](PROJECT_PLAN.md), [frontend guide](frontend/README.md), [local development guide](docs/local-development.md), [API guide](docs/api.md), [error-handling approach](docs/error-handling.md), [testing guide](docs/testing.md), and [contribution expectations](CONTRIBUTING.md).
