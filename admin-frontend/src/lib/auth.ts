const STORAGE_KEY = "zhaobiao_admin_token";
const USERNAME_KEY = "zhaobiao_admin_username";

export function getAdminToken(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function getAdminUsername(): string | null {
  return window.localStorage.getItem(USERNAME_KEY);
}

export function saveAdminSession(token: string, username: string) {
  window.localStorage.setItem(STORAGE_KEY, token);
  window.localStorage.setItem(USERNAME_KEY, username);
}

export function clearAdminSession() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(USERNAME_KEY);
}
