export type Level = 'H1' | 'H2' | 'H3' | 'H4' | 'H5';
export type HeadingDepth = 1 | 2 | 3 | 4 | 5;
export type Entry = { id: string; level?: Level; label: string };
export type Heading = { id: string; label: string; level: Level; children: Heading[] };
export type Outline = ReturnType<typeof makeOutline>;

// SDK 0.0.46's type declaration stops at H3, but its runtime forwards the
// host's value unchanged. Validate newer native heading values at this boundary.
export function parseHeadingLevel(value: unknown): Level | undefined {
  return typeof value === 'string' && /^H[1-5]$/.test(value) ? value as Level : undefined;
}

// A Rem tree determines reading order. Word-style heading levels determine sections.
export function readingOrder<T extends { _id: string; children?: string[]; parent: string | null }>(
  root: T, descendants: T[],
): T[] {
  const byId = new Map(descendants.map(item => [item._id, item]));
  const pending = [...(root.children ?? [])].reverse().map(id => ({ id, parent: root._id }));
  const ordered: T[] = [];
  const seen = new Set([root._id]);
  while (pending.length) {
    const {id, parent} = pending.pop()!;
    const item = byId.get(id);
    if (!item || item.parent !== parent || seen.has(id)) continue;
    seen.add(id);
    ordered.push(item);
    const children = item.children ?? [];
    for (let i = children.length - 1; i >= 0; i--) pending.push({id: children[i], parent: id});
  }
  return ordered;
}

export function makeOutline(entries: Entry[]) {
  const roots: Heading[] = [];
  const stack: Heading[] = [];
  const sectionOf = new Map<string, string | undefined>();
  let count = 0;
  for (const {id, level, label} of entries) {
    if (level) {
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      const heading: Heading = {id, label: label.trim() || 'Untitled heading', level, children: []};
      (stack.length ? stack[stack.length - 1].children : roots).push(heading);
      stack.push(heading);
      count++;
    }
    sectionOf.set(id, stack.at(-1)?.id);
  }
  return {roots, count, sectionOf};
}

// The selected level is an expansion preset, never a hard filter. Keep every
// child in the source tree so its parent's arrow can reveal it at any preset.
export function visibleHeadingChildren(item: Heading, preset: HeadingDepth, overrides: ReadonlyMap<string, boolean>): Heading[] {
  const manual = overrides.get(item.id);
  if (manual === false) return [];
  if (manual === true) return item.children;
  // Use actual heading styles, including documents that skip H2 or H3.
  return item.children.filter(child => Number(child.level.slice(1)) <= preset);
}

export function countVisibleHeadings(roots: Heading[], preset: HeadingDepth, overrides: ReadonlyMap<string, boolean>): number {
  // Root headings remain reachable even when a document begins at H2 or H3.
  return roots.reduce((count, item) => count + 1 + countVisibleHeadings(visibleHeadingChildren(item, preset, overrides), preset, overrides), 0);
}

export function filterHeadings(roots: Heading[], query: string) {
  const term = query.trim().normalize('NFKC').toLocaleLowerCase();
  const matches = new Set<string>();
  if (!term) return {tree: roots, matches};
  function filter(items: Heading[]): Heading[] {
    const result: Heading[] = [];
    for (const item of items) {
      const children = filter(item.children);
      const hit = item.label.normalize('NFKC').toLocaleLowerCase().includes(term);
      if (hit) matches.add(item.id);
      if (hit || children.length) result.push({...item, children});
    }
    return result;
  }
  return {tree: filter(roots), matches};
}
