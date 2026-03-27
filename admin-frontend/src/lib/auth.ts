const STORAGE_KEY = "zhaobiao_admin_token";
const USERNAME_KEY = "zhaobiao_admin_username";
const ADMIN_ID_KEY = "zhaobiao_admin_id";
const ROLE_KEY = "zhaobiao_admin_role";

export function getAdminToken(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function getAdminUsername(): string | null {
  return window.localStorage.getItem(USERNAME_KEY);
}

export function getAdminId(): string | null {
  return window.localStorage.getItem(ADMIN_ID_KEY);
}

export function getAdminRole(): string | null {
  return window.localStorage.getItem(ROLE_KEY);
}

export function isSuperAdmin(): boolean {
  return getAdminRole() === "super_admin";
}

export function saveAdminSession(token: string, username: string, role: string, adminId: string) {
  window.localStorage.setItem(STORAGE_KEY, token);
  window.localStorage.setItem(USERNAME_KEY, username);
  window.localStorage.setItem(ROLE_KEY, role);
  window.localStorage.setItem(ADMIN_ID_KEY, adminId);
}

export function clearAdminSession() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(USERNAME_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(ADMIN_ID_KEY);
}
