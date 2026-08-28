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
