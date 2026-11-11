import { useCallback, useMemo, useSyncExternalStore } from "react";

// The shop cart, kept in this browser (localStorage) so it survives a reload. It holds the ids of
// the chosen books and the chosen articles with their variant, size and quantity. Prices, names
// and availability are always read again from the catalogue.
//   stored: ["<livre id>", { "a": "<article id>", "v": "Bleu", "t": "M", "q": 2 }, …]
const KEY = "sysi-panier";
const EVENT = "sysi-panier";
const MAX_ITEMS = 30;
const MAX_QUANTITY = 20;

// When the browser blocks storage (private window…), the cart lives in memory for the visit.
let memory = "[]";

const read = () => {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
};

const write = (entries) => {
  memory = JSON.stringify(entries.slice(0, MAX_ITEMS));
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

const clampQuantity = (value) => Math.min(MAX_QUANTITY, Math.max(1, Math.round(Number(value) || 1)));

// One line of an article: the same article in another variant or size is another line.
export const lineKey = (line) => `${line.id}|${line.variante}|${line.taille}`;

const isLine = (entry) => entry && typeof entry === "object" && typeof entry.a === "string";
const toLine = (entry) => ({
  id: entry.a,
  variante: String(entry.v ?? ""),
  taille: String(entry.t ?? ""),
  quantite: clampQuantity(entry.q),
});
const fromLine = (line) => ({ a: line.id, v: line.variante, t: line.taille, q: line.quantite });

export function useCart() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const entries = useMemo(() => {
    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value.filter((entry) => typeof entry === "string" || isLine(entry)).slice(0, MAX_ITEMS) : [];
    } catch {
      return [];
    }
  }, [raw]);

  const ids = useMemo(() => entries.filter((entry) => typeof entry === "string"), [entries]);
  const lines = useMemo(() => entries.filter(isLine).map(toLine), [entries]);

  const save = useCallback((books, items) => write([...books, ...items.map(fromLine)]), []);

  // Books (one copy each).
  const add = useCallback((id) => (ids.includes(id) ? null : save([...ids, id], lines)), [ids, lines, save]);
  const remove = useCallback((id) => save(ids.filter((item) => item !== id), lines), [ids, lines, save]);
  const has = useCallback((id) => ids.includes(id), [ids]);

  // Articles: adding the same variant and size again raises the quantity.
  const addLine = useCallback(
    (line) => {
      const key = lineKey(line);
      const existing = lines.find((item) => lineKey(item) === key);
      const next = existing
        ? lines.map((item) => (lineKey(item) === key ? { ...item, quantite: clampQuantity(item.quantite + (line.quantite ?? 1)) } : item))
        : [...lines, { ...line, quantite: clampQuantity(line.quantite ?? 1) }];
      save(ids, next);
    },
    [ids, lines, save],
  );
  const setQuantity = useCallback(
    (key, quantite) => save(ids, lines.map((item) => (lineKey(item) === key ? { ...item, quantite: clampQuantity(quantite) } : item))),
    [ids, lines, save],
  );
  const removeLine = useCallback((key) => save(ids, lines.filter((item) => lineKey(item) !== key)), [ids, lines, save]);

  // Keeps only what is still for sale: `bookIds` and `isValidLine(line)`.
  const keepOnly = useCallback(
    (bookIds, isValidLine = () => true) => save(ids.filter((id) => bookIds.includes(id)), lines.filter(isValidLine)),
    [ids, lines, save],
  );
  const clear = useCallback(() => write([]), []);

  const count = ids.length + lines.reduce((sum, line) => sum + line.quantite, 0);

  return { ids, lines, count, add, remove, has, addLine, setQuantity, removeLine, keepOnly, clear };
}
