const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type TokenGetter = () => Promise<string | null>;

export async function apiGet<T>(path: string, getToken: TokenGetter): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `GET ${path} failed`);
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown, getToken: TokenGetter): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `PATCH ${path} failed`);
  }
  return res.json() as Promise<T>;
}
