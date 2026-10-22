/** Keep existing preferences and local files when upgrading the site's name. */
export const storagePrefix = 'mlii01-';
const legacyPrefix = 'mlii0151-';
type Store = Pick<Storage, 'getItem' | 'setItem'>;

export function migrateShell(value: string): string {
  try {
    const data = JSON.parse(value);
    const oldHome = '/home/mlii0151', newHome = '/home/mlii01';
    const path = (value: string) => value === oldHome || value.startsWith(oldHome + '/') ? newHome + value.slice(oldHome.length) : value;
    if (!data.fs || typeof data.fs !== 'object' || Array.isArray(data.fs)) return value;
    data.fs = Object.fromEntries(Object.entries(data.fs).map(([key, content]) => [path(key), content]));
    if (typeof data.cwd === 'string') data.cwd = path(data.cwd);
    if (data.user === 'mlii0151') data.user = 'mlii01';
    if (data.env?.HOME === oldHome) data.env.HOME = newHome;
    if (data.env?.USER === 'mlii0151') data.env.USER = 'mlii01';
    if (data.env?.SHELL === 'mlii0151-sh') data.env.SHELL = 'mlii01-sh';
    return JSON.stringify(data);
  } catch { return value; }
}

export function readStored(key: string, store?: Store): string | null {
  try {
    store ??= localStorage;
    const current = store.getItem(storagePrefix + key);
    if (current !== null) return current;
    const legacy = store.getItem(legacyPrefix + key);
    if (legacy === null) return null;
    const migrated = key === 'shell' ? migrateShell(legacy) : legacy;
    // Preserve the old copy and still return it if storage is read-only or full.
    try { store.setItem(storagePrefix + key, migrated); } catch {}
    return migrated;
  } catch { return null; }
}

export function writeStored(key: string, value: string) {
  localStorage.setItem(storagePrefix + key, value);
}
