# Run BioLens

BioLens runs as **three Docker containers**:

```
  Docker Desktop
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │   biolens-frontend  :3000   (React / TanStack Nitro) │
  │            │  http://localhost:8000 from the browser │
  │            ▼                                         │
  │   biolens-backend   :8000   (FastAPI + Uvicorn)      │
  │            │  bolt://neo4j:7687 (internal only)      │
  │            ▼                                         │
  │   biolens-neo4j             (Neo4j 2026.05 database) │
  │            └── data kept in the named volume          │
  │                biolens_biolens-neo4j-data            │
  └──────────────────────────────────────────────────────┘
```

Neo4j is **not** published to your Mac. Only the backend talks to it, so it
cannot clash with a Neo4j Desktop instance.

---

## 1. What you need to open first

| Application | Needed? | Why |
| --- | --- | --- |
| **Docker Desktop** | **Yes, always** | Runs all three containers. Nothing starts without it. |
| Neo4j Desktop | **No** | The database now runs in Docker. Desktop is only the rollback path (section 10). |
| Terminal | Yes | One command starts everything. |
| Browser | Yes | To open the app. |
| Node / Python | No | Only for the optional non-Docker development path (section 11). |

> Wait until Docker Desktop reports **"Engine running"** in its window before
> running any command.

---

## 2. First-time setup (only once)

The stack needs a password file at the repository root. It already exists in
this checkout; if you ever clone the project fresh:

```bash
cd ~/Desktop/BIOLens
cp .env.example .env
# then edit .env and set NEO4J_PASSWORD to your real Neo4j password
```

`.env` is read by Docker Compose only. `biolens-backend/.env` is used only when
you run the backend directly on the Mac. Both should contain the same password.
Never commit either file.

Expected result: `ls -la .env` shows the file with permissions `-rw-------`.

---

## 3. Start everything (the one command)

```bash
cd ~/Desktop/BIOLens
docker compose up -d
```

What each flag does:

- `up` — create and start the three services.
- `-d` — run in the background so your terminal stays free.

Expected output (first run pulls images, later runs are faster):

```text
 Container biolens-neo4j     Started
 Container biolens-backend   Started
 Container biolens-frontend  Started
```

Startup takes about **20–30 seconds** because the backend waits for Neo4j to
pass its healthcheck before it starts, and the frontend waits for the backend.

Which service is which:
- **database** → `neo4j`
- **backend**  → `backend`
- **frontend** → `frontend`

To start them one at a time (rarely needed):

```bash
docker compose up -d neo4j
docker compose up -d backend
docker compose up -d frontend
```

---

## 4. Open the app

| URL | What it is |
| --- | --- |
| **http://localhost:3000** | The BioLens application |
| http://localhost:8000/docs | FastAPI interactive API documentation |
| http://localhost:8000/health | Backend + database readiness report |

There is no Neo4j Browser URL: the database is private to the Docker network by
design. To run a Cypher query anyway, see section 9.

---

## 5. Verify that everything works

Run these three checks after starting. Each has an expected result.

**Check 1 — containers are healthy**

```bash
docker compose ps
```

Expected: all three rows show `Up ... (healthy)`.

**Check 2 — backend and database agree**

```bash
curl -s http://localhost:8000/health | python3 -m json.tool
```

Expected (values vary slightly):

```json
{
  "status": "ok",
  "backend": "running",
  "neo4j": {
    "uri": "bolt://neo4j:7687",
    "connected": true,
    "database": "biolens",
    "database_status": "online",
    "database_available": true,
    "server": "Neo4j/2026.05.0"
  }
}
```

If you see HTTP **503** with `"status": "degraded"`, the backend is fine but the
database is not ready — see section 9.

**Check 2b — graph counts**

```bash
curl -s http://localhost:8000/stats
```

Expected for this dataset:

```json
{"diseases":897,"genes":251,"drugs":42,"relationships":11708}
```

**Check 3 — the app loads**

Open <http://localhost:3000>. Expected: the BioLens title and a live line reading
"knowledge graph with 897 diseases, 251 genes, 42 drugs and 11708 relationships."
That line comes from the API, so seeing it proves frontend → backend → database
works.

---

## 6. Stop everything safely

```bash
cd ~/Desktop/BIOLens
docker compose stop
```

- `stop` keeps the containers so the next start is fast.
- Your graph data is **never** deleted by `stop`.

To remove the containers (and their network) but **keep the database data**:

```bash
docker compose down
```

Both commands leave the named volume `biolens_biolens-neo4j-data` untouched.

> **Never** run `docker compose down -v`. The `-v` flag deletes the volume and
> with it your entire graph.

---

## 7. Restart the project the next day

1. Open **Docker Desktop** and wait for "Engine running".
2. Open a terminal:

```bash
cd ~/Desktop/BIOLens
docker compose up -d
```

3. Open <http://localhost:3000>.

Neo4j Desktop does **not** need to be opened. Your data is still there because it
lives in the Docker volume, which survives reboots.

If you changed frontend or backend **source code**, rebuild the images:

```bash
docker compose up -d --build
```

Without `--build`, Docker reuses the existing images and your code changes will
not appear. This is the single most common source of "my change did nothing".

---

## 8. Common errors and their solutions

### "Cannot connect to the Docker daemon"

Docker Desktop is not running. Open it and wait for "Engine running".

### "Bind for 0.0.0.0:8000 failed: port is already allocated"

Something else owns port 8000, usually an old local backend:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
pkill -f "uvicorn main:app"     # only if that is the old local backend
docker compose up -d
```

Same idea for port 3000 (`npm run dev` or an old frontend).

### "NEO4J_PASSWORD is not set" or "set NEO4J_PASSWORD in ./.env"

The root `.env` file is missing or incomplete:

```bash
cp .env.example .env    # then edit it and set the password
docker compose up -d
```

### "Unrecognized setting. No declared setting with name: PASSWORD"

Someone added `NEO4J_PASSWORD` to the **neo4j** service environment. The Neo4j
image converts every `NEO4J_*` variable into a server setting, so that variable is
invalid there. Only `NEO4J_AUTH` belongs on the neo4j service; the healthcheck
derives the password from it.

### Backend `/health` returns 503 with `"database_status": "offline"`

The backend is healthy; the database is not. Look at it:

```bash
docker compose ps
docker logs --tail 50 biolens-neo4j
```

Most common causes: not enough memory allocated to Docker Desktop (give it at
least 4 GB), or the container is still starting (wait 30 seconds and retry).

### "graph reference not found ... `biolens`"

The `biolens` database was never created or its data was not restored. Follow
section 12 (restore), or:

```bash
docker compose exec neo4j sh -c \
  'cypher-shell -a bolt://localhost:7687 -u "${NEO4J_AUTH%%/*}" -p "${NEO4J_AUTH#*/}" "CREATE DATABASE biolens WAIT;"'
```

(Quoting it this way lets the container expand the credentials itself, so the
password never appears in your shell history or in `ps`.)

Expected: `biolens` becomes `online`, but empty until a dump is loaded.

### "Block format detected ... unavailable in this edition"

The database dump was created by Neo4j **Enterprise** (Neo4j Desktop bundles
Enterprise). `docker-compose.yml` therefore pins
`neo4j:2026.05.0-enterprise`, which requires
`NEO4J_ACCEPT_LICENSE_AGREEMENT: "yes"` (free for development). Do not switch the
image to `-community` while using this dump.

### The UI shows old code

Rebuild instead of restarting:

```bash
docker compose up -d --build frontend    # or backend
```

### "no matching manifest" / image pull fails

Check your internet connection, then `docker compose pull` and retry.

---

## 9. Inspecting the database by hand

The database has no published ports. Use a shell inside the container:

```bash
# interactive Cypher shell against biolens
docker compose exec neo4j sh -c \
  'cypher-shell -a bolt://localhost:7687 -u "${NEO4J_AUTH%%/*}" -p "${NEO4J_AUTH#*/}" -d biolens'

# or a single query
docker compose exec neo4j sh -c \
  'cypher-shell -a bolt://localhost:7687 -u "${NEO4J_AUTH%%/*}" -p "${NEO4J_AUTH#*/}" -d biolens "MATCH (n) RETURN count(n);"'
```

Expected: `1190`.

---

## 10. Rollback to the old Neo4j Desktop setup

Your previous two-container configuration is preserved unchanged in
[docker-compose.neo4j-desktop.yml](./docker-compose.neo4j-desktop.yml), and the
original database in Neo4j Desktop was left intact and online.

```bash
cd ~/Desktop/BIOLens
docker compose down
docker compose -f docker-compose.neo4j-desktop.yml up -d
```

Then start the **BioLens** database in Neo4j Desktop, and check:

```bash
curl -s http://localhost:8000/health | python3 -m json.tool
```

Expected: `"uri": "bolt://host.docker.internal:7687"`.

Rollback does not touch the Docker volume, so you can switch back at any time.

---

## 11. Optional: run without Docker (development mode)

Only for editing code with hot reload. Requires Node and Python on the Mac.

Database: leave the Docker Neo4j running so you have data:

```bash
docker compose up -d neo4j
```

Backend (terminal 1):

```bash
cd ~/Desktop/BIOLens/biolens-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# biolens-backend/.env must contain NEO4J_URI=bolt://localhost:7687
python3 -m uvicorn main:app --reload --port 8000
```

Frontend (terminal 2):

```bash
cd ~/Desktop/BIOLens
npm install
npm run dev
```

`main.py` rewrites `host.docker.internal` to `127.0.0.1` automatically when it is
not running in a container, so the `.env` copied from the example also works.

Do not run a local backend on port 8000 **and** the backend container at the same
time: on macOS `localhost` resolves to IPv6 and `127.0.0.1` to IPv4, so the two
can answer on "the same" port and give different results.

---

## 12. Backup and restore the graph

Backups are written to `./neo4j/backups`, which is mounted into the container as
`/backups`. A known-good dump already exists there: `biolens.dump`.

**Take a backup**

```bash
cd ~/Desktop/BIOLens
docker compose stop neo4j
docker compose run --rm --no-deps neo4j \
  neo4j-admin database dump biolens --to-path=/backups --verbose
docker compose up -d neo4j
ls -lh neo4j/backups
```

Expected: a file named `biolens.dump` and the line `Dump completed successfully`.

**Restore a backup**

```bash
cd ~/Desktop/BIOLens

# 1. the database must exist and be stopped
docker compose exec neo4j sh -c \
  'cypher-shell -a bolt://localhost:7687 -u "${NEO4J_AUTH%%/*}" -p "${NEO4J_AUTH#*/}" "CREATE DATABASE biolens WAIT;"'

# 2. stop neo4j and load over the top
docker compose stop neo4j
docker compose run --rm --no-deps neo4j \
  neo4j-admin database load biolens --from-path=/backups --overwrite-destination=true --verbose

# 3. start and verify
docker compose up -d neo4j
curl -s http://localhost:8000/stats
```

Expected: the counts from section 5 (`897 / 251 / 42 / 11708`).

---

## 13. Command cheat sheet

```bash
# start everything (Docker Desktop must be running)
docker compose up -d

# start after a code change
docker compose up -d --build

# status of the three services
docker compose ps

# follow logs
docker compose logs -f
docker compose logs -f biolens-backend

# health of the whole chain
curl -s http://localhost:8000/health | python3 -m json.tool
curl -s http://localhost:8000/stats

# stop / remove containers (data is kept)
docker compose stop
docker compose down

# rollback to Neo4j Desktop
docker compose -f docker-compose.neo4j-desktop.yml up -d
```

---

## 14. If you forget everything

1. Open **Docker Desktop**, wait for "Engine running".
2. `cd ~/Desktop/BIOLens`
3. `docker compose up -d`
4. Open <http://localhost:3000>
5. To stop: `docker compose stop`

Neo4j Desktop is not part of this workflow. The graph lives in the Docker volume
`biolens_biolens-neo4j-data` and survives reboots, `stop`, and `down`.
