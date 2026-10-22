/** All internal URLs go through this function, including /repo/ project Pages. */
export function withBase(path = '/', base = import.meta.env?.BASE_URL ?? '/'): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
export function stripBase(path: string, base = import.meta.env?.BASE_URL ?? '/'): string {
  const prefix = base.replace(/\/$/, '');
  return prefix && (path === prefix || path.startsWith(prefix + '/')) ? path.slice(prefix.length) || '/' : path;
}
export const categorySlug = (name: string) => name.split('/').map(part => part.toLowerCase().trim().replace(/\s+/g, '-')).join('/');
