const DEFAULT_API_BASE_URL = "http://localhost:8000";

// This value is public configuration, not a secret. It is baked into the
// browser bundle at build time so browser requests reach the host-published
// backend port rather than the Docker-only service name.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

/** Error carrying the backend status plus its human readable ``detail``. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function readError(res: Response): Promise<ApiError> {
  let detail = `Request failed with HTTP ${res.status}`;
  let code: string | undefined;

  try {
    const body = await res.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (typeof body?.error === "string") detail = body.error;
    if (typeof body?.error === "string") code = body.error;
  } catch {
    // Non-JSON error body: keep the status based message.
  }

  return new ApiError(detail, res.status, code);
}

/**
 * Fetch JSON from the BioLens API, surfacing the backend's own error message.
 * When Neo4j is down the API answers 503 with a ``detail`` explaining whether
 * the server is unreachable or the database is offline.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), init);
  if (!res.ok) throw await readError(res);
  return (await res.json()) as T;
}

export type BackendHealth = {
  status: "ok" | "degraded";
  backend: string;
  neo4j: {
    uri: string;
    connected: boolean;
    database: string;
    database_status: string;
    database_available: boolean;
    server: string | null;
    latency_ms: number | null;
    error: string | null;
  };
  checked_at: string;
};

/** Real connectivity check: returns the body even when the API reports 503. */
export async function fetchBackendHealth(): Promise<BackendHealth> {
  const res = await fetch(apiUrl("health"));
  return (await res.json()) as BackendHealth;
}
