# CaseSignal Frontend

The frontend is a Next.js 16 application using TypeScript, Bun, Tailwind CSS and Framer Motion. It is a responsive grid-based operator workspace, with a sign-in landing page and a protected workflow dashboard.

## Development

Run the whole stack from the repository root:

```sh
./start-dev.sh
```

For frontend-only commands:

```sh
bun run dev
bun run lint
bun run build
```

The Docker environment bind-mounts this folder and enables Fast Refresh, so saved TypeScript, React and CSS changes appear without restarting containers.

## Behaviour

- The browser calls the Symfony API directly with the authenticated session cookie.
- The theme initially follows the operating-system preference and can be changed with the inline light/dark toggle. The choice is stored in local storage.
- Dashboard layouts use CSS Grid at every breakpoint. The operator panel, metrics, queue, workspace and workflow cards reflow rather than relying on fixed widths.
- Yellow marks pending, review, waiting and safe-retry states; green marks resolved work; red marks rejection and risk.
- **Reset demo** restores the current operator's synthetic fixture set after a manual workflow test.

## Error states

The client redirects unauthenticated users to sign in, renders API problem details as safe operator-facing messages, disables actions while a request is running and leaves the currently loaded case visible when an action or reset fails. It does not render server stack traces or protected case data after an authentication failure.

See the root [testing guide](../docs/testing.md) for manual checks and the API/error-handling documentation for contract details.
