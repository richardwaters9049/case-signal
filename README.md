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

The initial vertical slice exposes a Symfony dashboard endpoint and an accessible Next.js dashboard showing exception work, workflow health and an exception queue. It intentionally uses synthetic data while the PostgreSQL persistence and Symfony Messenger work are built next.

Read [the product plan](PROJECT_PLAN.md), [local development guide](docs/local-development.md), [error-handling approach](docs/error-handling.md), and [contribution expectations](CONTRIBUTING.md).
