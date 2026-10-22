export interface SearchEntry {
  title: string;
  description: string;
  url: string;
  type: 'page' | 'post' | 'project';
  tags: string[];
  body?: string;
}
export function searchEntries(entries: SearchEntry[], query: string): SearchEntry[] {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return entries;
  return entries.map(entry => {
    const title = entry.title.toLocaleLowerCase();
    const tags = entry.tags.join(' ').toLocaleLowerCase();
    const all = `${title} ${tags} ${entry.description} ${entry.body ?? ''}`.toLocaleLowerCase();
    return { entry, score: words.every(w => all.includes(w)) ? words.reduce((n, w) => n + (title.includes(w) ? 8 : tags.includes(w) ? 4 : 1), 0) : 0 };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.entry);
}
