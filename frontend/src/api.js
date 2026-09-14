export const API_BASE = "http://localhost:8000";

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const errBody = await res.json();
      detail = Array.isArray(errBody.detail)
        ? errBody.detail.map((d) => d.msg).join(", ")
        : errBody.detail || detail;
    } catch (_) {
      /* ignore parse failure, use default detail */
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}
