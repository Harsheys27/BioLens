# Run BIOLens

## How to run BIOLens

1. Open Docker Desktop.
2. Open Neo4j Desktop and start the BIOLens Neo4j database.
3. Open Terminal in the BIOLens project folder:

   ```bash
   cd ~/Desktop/BIOLens
   ```

4. Start BIOLens:

   ```bash
   docker compose up --build -d
   ```

5. Verify the backend can reach Neo4j:

   ```bash
   curl http://localhost:8000/test
   ```

   A successful response includes `"status":"connected"`.

Open these URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## How to kill/stop BIOLens

From the BIOLens project folder, stop all BIOLens containers:

```bash
docker compose down
```

This stops and removes the BIOLens containers, but does **not** delete the Docker images or any Neo4j database data.

Start BIOLens again later with:

```bash
docker compose up --build -d
```

## QUICK START

Start:

```bash
cd ~/Desktop/BIOLens
docker compose up --build -d
curl http://localhost:8000/test
```

Open: http://localhost:3000

Stop:

```bash
cd ~/Desktop/BIOLens
docker compose down
```
