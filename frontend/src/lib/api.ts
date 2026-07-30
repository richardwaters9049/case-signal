export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
};

const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://127.0.0.1:8000";

export async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${apiOrigin}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });
}

export async function responseMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { detail?: string } | null;

  return payload?.detail ?? "CaseSignal could not complete that request. Please try again.";
}
