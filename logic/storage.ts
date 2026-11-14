export interface SaveStorage {
  load(): string | null;
  save(json: string): void;
  clear(): void;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getLocalStorage(): StorageLike | null {
  return (globalThis as { localStorage?: StorageLike }).localStorage ?? null;
}

export function createLocalStorageSaveStorage(
  key = 'crater:save:v3',
): SaveStorage {
  return {
    load() {
      try {
        return getLocalStorage()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    save(json) {
      try {
        getLocalStorage()?.setItem(key, json);
      } catch {
        // Storage can be unavailable or full; saving is best-effort.
      }
    },
    clear() {
      try {
        getLocalStorage()?.removeItem(key);
      } catch {
        // Best-effort clear.
      }
    },
  };
}

export function createMemorySaveStorage(
  initial: string | null = null,
): SaveStorage {
  let value = initial;

  return {
    load() {
      return value;
    },
    save(json) {
      value = json;
    },
    clear() {
      value = null;
    },
  };
}
