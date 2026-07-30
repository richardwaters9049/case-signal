# CaseSignal

CaseSignal is an exception-control workspace for service operations. It makes workflow failures visible, explains why automation paused, and provides a safe path for a person to decide what happens next.

It is a portfolio project tailored to demonstrate PHP/Symfony, Next.js, workflow automation, auditability, operational resilience and guarded AI integration.

## Technology

- `backend/`: PHP 8.4 and Symfony 8 JSON API.
- `frontend/`: Next.js, TypeScript, Bun, Tailwind CSS and Framer Motion.
- No FastAPI or separate Python service. Symfony owns the application API and workflow logic.

## Run locally

Start the API in one terminal:

```sh
cd backend
php -S 127.0.0.1:8000 -t public
```

Start the operator dashboard in another terminal:

```sh
cd frontend
bun run dev
```

Open `http://localhost:3000`. The dashboard calls Symfony directly at `http://127.0.0.1:8000/api/v1/dashboard` by default. Override this with `NEXT_PUBLIC_API_ORIGIN` when required.

## Current slice

The initial vertical slice exposes a Symfony dashboard endpoint and an accessible Next.js dashboard showing exception work, workflow health and an exception queue. It intentionally uses synthetic data while the PostgreSQL persistence and Symfony Messenger work are built next.

Read [the product plan](PROJECT_PLAN.md), [error-handling approach](docs/error-handling.md), and [contribution expectations](CONTRIBUTING.md).
