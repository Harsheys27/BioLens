FROM python:3.13-slim

WORKDIR /app

# Unbuffered stdout keeps uvicorn/Neo4j driver logs visible in `docker logs`
# in the same order they happen.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
