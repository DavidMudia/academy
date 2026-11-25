type ApiErrorPayload = { error?: unknown };

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (payload as ApiErrorPayload | null)?.error;
    throw new Error(typeof message === "string" ? message : `Request failed (${response.status}).`);
  }
  return payload as T;
}
