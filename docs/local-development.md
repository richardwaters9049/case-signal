# Local Docker Development

## Start everything

With Docker Desktop running, execute one command from the repository root:

```sh
./start-dev.sh
```

The command builds the PHP development image, installs Composer and Bun dependencies, then starts the frontend, Symfony API, PostgreSQL and Redis. It stays attached to the logs; press `Ctrl+C` to stop the containers without deleting data.

Open the services at:

- Frontend: `http://localhost:3000`
- Symfony API: `http://localhost:8000/api/v1/dashboard`
- Health check: `http://localhost:8000/health`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Hot reloading

The frontend and backend folders are bind-mounted into their development containers. Saving a TypeScript, React or CSS file is picked up by Next.js Fast Refresh; changes appear in the browser without restarting containers. Polling is enabled so this remains reliable when Docker Desktop file events are delayed.

Symfony runs in the development environment through PHP's built-in server. It loads changed PHP source on the next request, so controller and service edits also do not require a container restart.

## Useful commands

```sh
docker compose ps
docker compose logs -f frontend backend
docker compose down
docker compose down --volumes
```

The final command removes local PostgreSQL, Redis, Composer and Bun volumes. Use it only when a complete local reset is intended.
