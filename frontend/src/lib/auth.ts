export interface AuthUser {
  id: number;
  email: string;
  role: "artist" | "admin";
  artist_id: number | null;
  name: string;
}

const USER_KEY = "kamik_user";
const TOKEN_KEY = "access_token";

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getArtistId(user: AuthUser | null): number {
  return user?.artist_id ?? 1;
}
