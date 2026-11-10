import { useCallback, useMemo, useSyncExternalStore } from "react";

// The shop cart: the ids of the chosen books, kept in this browser (localStorage) so it
// survives a reload. Prices and titles are always read again from the catalogue.
const KEY = "sysi-panier";
const EVENT = "sysi-panier";
const MAX_ITEMS = 50;

// When the browser blocks storage (private window…), the cart lives in memory for the visit.
let memory = "[]";

const read = () => {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
};

const write = (ids) => {
  memory = JSON.stringify(ids.slice(0, MAX_ITEMS));
  try {
    window.localStorage.setItem(KEY, memory);
  } catch {
    // Storage blocked: the in-memory copy is enough for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
};

const subscribe = (callback) => {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

export function useCart() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const ids = useMemo(() => {
    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value.filter((id) => typeof id === "string").slice(0, MAX_ITEMS) : [];
    } catch {
      return [];
    }
  }, [raw]);

  const add = useCallback((id) => (ids.includes(id) ? null : write([...ids, id])), [ids]);
  const remove = useCallback((id) => write(ids.filter((item) => item !== id)), [ids]);
  const keepOnly = useCallback((allowed) => write(ids.filter((item) => allowed.includes(item))), [ids]);
  const clear = useCallback(() => write([]), []);
  const has = useCallback((id) => ids.includes(id), [ids]);

  return { ids, count: ids.length, add, remove, keepOnly, clear, has };
}
