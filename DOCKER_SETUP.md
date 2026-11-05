# BIOLens Docker Setup

This guide runs the complete BIOLens stack with the frontend and backend in Docker while Neo4j Desktop continues to run on the Mac host.

The production frontend is a TanStack Start/Nitro Node server. It is **not** served as a static SPA by Nginx.

## 1. Prerequisites

### Docker Desktop

Install and start Docker Desktop for Mac.

Verify Docker and Compose:

```bash
docker --version
docker compose version
```

Both commands should print a version. If either command fails, open Docker Desktop and wait until it reports that Docker is running.

### Neo4j Desktop

Install Neo4j Desktop and make sure the BIOLens database is available. Neo4j is intentionally not started by Docker Compose in this project.

### Node and npm

Node/npm are only needed if you want to run the frontend directly on your Mac or inspect a local production build. They are not required to run the Dockerized application.

Optional checks:

```bash
node --version
npm --version
```

The Docker frontend uses Node 22 inside its image.

### Python

Python is only needed for running the FastAPI backend directly on your Mac. It is not required for the Dockerized application.

Optional check:

```bash
python3 --version
```

## 2. Start Neo4j

1. Open Neo4j Desktop.
2. Open the project containing the BIOLens graph.
3. Start the correct database.
4. Confirm that its Bolt endpoint is running on port `7687`.

On macOS, verify that something is listening on the Bolt port:

```bash
lsof -nP -iTCP:7687 -sTCP:LISTEN
```

Successful output includes a process in `LISTEN` state on `*:7687`, `127.0.0.1:7687`, or a similar local address. No output usually means the Neo4j database is not running or Bolt is configured for another port.

## 3. Check Neo4j credentials

The backend reads its credentials from:

```text
biolens-backend/.env
```

The file should contain values for:

```dotenv
NEO4J_URI=bolt://host.docker.internal:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-local-password
```

Never print or commit the real password. `.env` is ignored by Git and is injected into the backend container by `docker-compose.yml`.

If the local file does not exist, create it from the placeholder file:

```bash
cp biolens-backend/.env.example biolens-backend/.env
```

Then replace only the placeholder password with the password for the Neo4j Desktop database. Do not put Neo4j credentials in frontend files or in a `VITE_*` variable.

Docker uses `bolt://host.docker.internal:7687` because Neo4j is running on the Mac host. The browser never connects to Bolt and never needs to know this hostname.

## 4. Start BIOLens

From the repository root:

```bash
cd ~/Desktop/BIOLens
docker compose up --build -d
```

The first build downloads dependencies and can take longer. Later starts can usually use the cached images.

Validate the Compose file without printing the environment values:

```bash
docker compose config -q
```

A successful command prints nothing and exits successfully.

## 5. Check containers

```bash
docker ps
```

You should see these running containers:

```text
biolens-backend    0.0.0.0:8000->8000/tcp
biolens-frontend   0.0.0.0:3000->3000/tcp
```

The exact image IDs and uptime will vary. The names and published ports should match the lines above.

## 6. Check backend

```bash
curl http://localhost:8000/
curl http://localhost:8000/test
```

The root endpoint should return a message similar to:

```json
{"message":"BioLens Backend Running","version":"2.0.0","features":12}
```

The Neo4j check should return a response with connected status, for example:

```json
{"status":"connected","nodes":1190}
```

The node count can change as the graph changes. The important part is `"status":"connected"`.

## 7. Open frontend

Open this URL in a browser:

```text
http://localhost:3000
```

The response should be the BioLens application, including the BioLens title and application markup. It should not be the default Nginx welcome page.

The browser calls the backend at the public host URL `http://localhost:8000`. Do not change the browser API URL to `http://backend:8000`; Docker service names are resolvable between containers, not by a browser on the Mac.

## 8. View logs

Backend logs:

```bash
docker logs -f biolens-backend
```

Frontend logs:

```bash
docker logs -f biolens-frontend
```

Press `Ctrl+C` to stop following logs. This does not stop the container.

## 9. Restart after code changes

After changing frontend or backend source code, rebuild the affected image:

```bash
docker compose up --build -d
```

A simple restart is enough when only a runtime process needs to be restarted and no source, dependency, Dockerfile, Compose, or build-time environment value changed:

```bash
docker compose restart
```

`VITE_API_BASE_URL` is build-time browser configuration. If you change it, use `docker compose up --build -d` so the browser bundle is rebuilt.

## 10. Full reset

Use this when Docker appears to be using stale output, after changing the production Dockerfile, or when you need to prove a clean build:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

`--no-cache` forces every image layer to rebuild, so it is slower than the normal workflow. It does not delete Neo4j data because Neo4j is outside Docker Compose.

## 11. Stop the project

```bash
docker compose down
```

This stops and removes the BIOLens containers and network. It does not stop Neo4j Desktop and does not delete Neo4j data.

## 12. Common errors

### "failed to read dockerfile"

Check that you are in the repository root and that both Dockerfiles exist:

```bash
pwd
ls Dockerfile docker-compose.yml biolens-backend/Dockerfile
```

The frontend build context is `.` and the backend build context is `./biolens-backend`. Do not run Compose from a different directory unless you provide the correct Compose file path.

### "Welcome to nginx!"

That means an old static Nginx image or configuration is being served instead of the TanStack Start production server. BIOLens now runs the generated Nitro Node entrypoint:

```text
.output/server/index.mjs
```

Rebuild the frontend without cache and check the current container:

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
docker logs biolens-frontend --tail 100
```

A correct response contains BioLens application HTML, not the Nginx welcome text.

### "port 8000 already in use"

Find the process using the port:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

Stop the old backend process or stop the other container using that port, then run Compose again.

On macOS, `localhost` may resolve to the IPv6 loopback `::1` while
`127.0.0.1` stays IPv4. Docker publishes port 8000 on IPv6, and a backend
started with `python3 -m uvicorn main:app --reload` binds the IPv4 loopback, so
`curl http://localhost:8000/stats` and `curl http://127.0.0.1:8000/stats` can
reach two different servers, with different results. Run only one backend on
port 8000:

```bash
# container only
docker compose stop backend && docker compose up -d backend

# or host uvicorn only
pkill -f "uvicorn main:app"
```

When uvicorn runs on the host it reads `biolens-backend/.env` and rewrites
`host.docker.internal` to `127.0.0.1` automatically, because that Docker alias
does not resolve on macOS.

### "port 3000 already in use"

Find the process using the port:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Stop the old frontend process or container, then run Compose again.

### "Neo4j connection refused"

Check all of the following:

- Neo4j Desktop is open.
- The correct database is started.
- Bolt is listening on port `7687`.
- `NEO4J_URI` is `bolt://host.docker.internal:7687` inside `biolens-backend/.env`.
- `NEO4J_USER` is correct.
- `NEO4J_PASSWORD` matches the database password.

Useful check:

```bash
lsof -nP -iTCP:7687 -sTCP:LISTEN
```

Then inspect the backend logs:

```bash
docker logs biolens-backend --tail 100
```

### "The database `biolens` is currently unavailable"

`Neo.TransientError.General.DatabaseUnavailable` means Bolt and authentication
succeeded: the Neo4j server is reachable, but the requested database is not
serving requests. The database is stopped, still starting, or recovering.

Neo4j starts `system` and `neo4j` before user databases. If `biolens` cannot
start, the DBMS still reports RUNNING and the backend still connects, so only
graph queries fail while `/` and `/docs` keep returning 200. The database log
records the reason, for example:

```text
[biolens/4b341359] Exception occurred while starting the database.
Caused by: org.neo4j.io.locker.FileLockException: Lock file has been locked by
another process: .../data/databases/biolens/database_lock
```

Check the real status through the API and, if needed, directly through Bolt:

```bash
curl -s http://localhost:8000/health | python3 -m json.tool
```

```bash
docker exec -i biolens-backend python - <<'PY'
import os
from neo4j import GraphDatabase

driver = GraphDatabase.driver(
    os.environ["NEO4J_URI"],
    auth=(os.environ["NEO4J_USER"], os.environ["NEO4J_PASSWORD"]),
)
with driver.session(database="system") as session:
    print(
        session.run(
            "SHOW DATABASES YIELD name, currentStatus RETURN name, currentStatus"
        ).data()
    )
driver.close()
PY
```

If `biolens` reports `offline`, stop and start the DBMS in Neo4j Desktop and
wait for the database to reach `online`. Restarting the DBMS releases the stale
lock; do not delete `data/databases/biolens` to clear a lock, because that
removes the graph.

`/health` returns 200 when the configured database answers a query and 503 with
`database_status` plus the driver error when it does not. The backend stays
running in that state deliberately so the outage is reported instead of hidden.

### "container restarting"

Inspect the failing container:

```bash
docker logs biolens-backend --tail 100
docker logs biolens-frontend --tail 100
```

Common causes are a missing backend `.env`, invalid Neo4j credentials, a failed frontend build, or an incorrect runtime entrypoint.

### `docker compose config` YAML errors

Compose YAML depends on indentation. Each property must be nested under the correct service. The active structure is:

```yaml
services:
  backend:
    build:
      context: ./biolens-backend
    env_file:
      - ./biolens-backend/.env
    ports:
      - "8000:8000"
  frontend:
    build:
      context: .
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

Run `docker compose config -q` from the repository root to validate the complete file.

### Frontend cannot reach backend

There are two different networking locations:

- Browser to backend: use `http://localhost:8000`, because the browser runs on the Mac host.
- Container to container: use Docker service names such as `backend:8000`, but only for code that truly runs inside a container.

The current BIOLens feature requests run in browser effects and event handlers, so the frontend bundle uses `http://localhost:8000`. FastAPI allows the exact frontend origin `http://localhost:3000` through CORS. The browser must not use `host.docker.internal` for Neo4j.

## 13. Useful commands cheat sheet

```bash
# Show running containers
docker ps

# Show Compose service status
docker compose ps

# Follow logs for all Compose services
docker compose logs -f

# Follow one container's logs
docker logs -f biolens-backend
docker logs -f biolens-frontend

# Start/rebuild in the background
docker compose up --build -d

# Stop and remove Compose containers
docker compose down

# Build images
docker compose build

# Restart existing containers
docker compose restart

# Open a shell or run a command inside a running container
docker exec -it biolens-backend sh
docker exec -it biolens-frontend sh

# Test HTTP endpoints
curl http://localhost:8000/
curl http://localhost:8000/test
curl -I http://localhost:3000
```

## 14. Architecture diagram

```text
Browser
   |
   | http://localhost:3000
   v
BIOLens Frontend (TanStack Start/Nitro Node server)
   |
   | HTTP API: http://localhost:8000
   v
BIOLens Backend (FastAPI/Uvicorn)
   |
   | bolt://host.docker.internal:7687
   v
Neo4j Desktop (Mac host)
   |
   v
Neo4j Database
```

Nginx is not part of the active architecture. The frontend container runs `.output/server/index.mjs` directly so SSR and the generated TanStack Start server are preserved.

## 15. If I forget everything

1. Start Docker Desktop.
2. Start Neo4j Desktop and the BIOLens database.
3. Open Terminal.
4. Go to the project:

   ```bash
   cd ~/Desktop/BIOLens
   ```

5. If needed, create `biolens-backend/.env` from `.env.example` and set the local password.
6. Start BIOLens:

   ```bash
   docker compose up --build -d
   ```

7. Check the containers:

   ```bash
   docker ps
   ```

8. Check Neo4j connectivity:

   ```bash
   curl http://localhost:8000/test
   ```

9. Open [http://localhost:3000](http://localhost:3000).

## Final runtime notes

- Neo4j Desktop must be started manually before the backend can pass `/test`.
- The backend password stays in `biolens-backend/.env` and is never bundled into the frontend.
- The frontend image contains the Nitro Node server and generated assets under `.output`; it does not depend on Nginx or a static `index.html` fallback.
