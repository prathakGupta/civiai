const ROLE_KEY = "civiai_user_role";
const ADMIN_PASSWORD_KEY = "civiai_admin_password";
const WORKER_NAME_KEY = "civiai_worker_name";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readStorage(key) {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(key) || "";
}

function writeStorage(key, value) {
  if (!canUseStorage()) return;
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
}

export function getUserRole() {
  const persisted = readStorage(ROLE_KEY);
  const fallback = import.meta.env.VITE_USER_ROLE || "CITIZEN";
  return (persisted || fallback).toUpperCase();
}

export function setUserRole(role) {
  const normalized = String(role || "CITIZEN").trim().toUpperCase();
  writeStorage(ROLE_KEY, normalized);
}

export function getAdminPassword() {
  const persisted = readStorage(ADMIN_PASSWORD_KEY);
  return (
    persisted ||
    import.meta.env.VITE_ADMIN_PASSWORD ||
    import.meta.env.VITE_APP_API_KEY ||
    ""
  );
}

export function setAdminPassword(value) {
  writeStorage(ADMIN_PASSWORD_KEY, String(value || "").trim());
}

export function getWorkerName() {
  const persisted = readStorage(WORKER_NAME_KEY);
  return persisted || import.meta.env.VITE_WORKER_NAME || "";
}

export function setWorkerName(value) {
  writeStorage(WORKER_NAME_KEY, String(value || "").trim());
}

// Backward-compatible aliases while older imports are being phased out.
export function getApiKey() {
  return getAdminPassword();
}

export function setApiKey(value) {
  setAdminPassword(value);
}
