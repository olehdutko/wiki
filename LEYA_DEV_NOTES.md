# Wiki Development Notes

## Running the Project

### Recommended: start backend and frontend separately

The root `npm run dev` script (`scripts/dev.cjs`) runs both the server and the Vite client together. It can become unstable because `nodemon` watches `*.*` in the project root and aggressively restarts the server whenever any file there changes (including temporary files, `.server-port`, stray scripts, etc.). If the MySQL connection pool is recreated too often, the TCP stack can end up in an inconsistent state and requests start failing with `EHOSTUNREACH` or `write EPIPE` to `192.168.1.132:3306`.

If `npm run dev` starts misbehaving, kill all Wiki processes and run the two parts manually:

Terminal 1 — backend:
```bash
cd /Users/odutko/projects/wiki
npx ts-node server/src/index.ts
```

Terminal 2 — frontend:
```bash
cd /Users/odutko/projects/wiki/client
VITE_SERVER_PORT=3001 npx vite
```

This bypasses `scripts/dev.cjs` and has been verified to stay stable across page refreshes.

## Common Port/Process Issues

- `.server-port` is a temporary file created by `scripts/start-server-dev.cjs`. It tells the Vite client where to proxy `/api`. It is **not** committed to Git.
- If the client launches on a port other than `3000` (e.g. `3002`, `3003`, `3004`), the server likely failed to claim `3001` or the client could not claim `3000`. Kill stale processes and start fresh.
- Useful kill command:
```bash
pkill -9 -f nodemon; pkill -9 -f ts-node; pkill -9 -f vite; pkill -9 -f esbuild; pkill -9 -f start-server-dev; pkill -9 -f start-client-dev
```

## MySQL Connection Notes

- DB host is configured in `/Users/odutko/projects/wiki/.env` (`DB_HOST=192.168.1.132`).
- If `mysql` CLI connects fine but Node.js requests fail with `EHOSTUNREACH` or `write EPIPE`, the issue is usually the Node connection pool state or too many rapid nodemon restarts, not the network.

## Project Stack

- Backend: Node.js + TypeScript + Express + MySQL2
- Frontend: React + Vite + Material-UI
- Database: MySQL on 192.168.1.132
