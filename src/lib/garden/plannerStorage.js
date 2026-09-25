// Resolve storage inside the guard: browsers can throw on the getter itself.
export function persistPlannerState(key, payload, getStorage = () => window.localStorage) {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.setItem !== "function") return false;
    storage.setItem(key, JSON.stringify(payload));
    globalThis.dispatchEvent?.(new Event("garden-records-changed"));
    return true;
  } catch {
    return false;
  }
}
