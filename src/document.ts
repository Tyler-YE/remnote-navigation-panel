import type { RNPlugin, PluginRem } from '@remnote/plugin-sdk';
import { readingOrder, makeOutline, parseHeadingLevel, type Entry } from './model.ts';

export type Pane = { paneId: string; docId: string };

export async function currentPane(plugin: RNPlugin): Promise<Pane | null> {
  const active = await plugin.window.getFocusedPaneId();
  if (active) {
    const docId = await plugin.window.getOpenPaneRemId(active);
    if (docId) return {paneId: active, docId};
  }
  const last = await plugin.window.getLastFocusedPane();
  if (last && last !== active) {
    const docId = await plugin.window.getOpenPaneRemId(last);
    if (docId) return {paneId: last, docId};
  }
  // A sidebar can have focus before RemNote records a last editor pane.
  for (const paneId of await plugin.window.getOpenPaneIds()) {
    if (paneId === active || paneId === last) continue;
    const docId = await plugin.window.getOpenPaneRemId(paneId);
    if (docId) return {paneId, docId};
  }
  return null;
}

async function labelOf(plugin: RNPlugin, rem: PluginRem): Promise<string> {
  const text = rem.text ?? [];
  if (text.every(part => typeof part === 'string')) return text.join('');
  return plugin.richText.toString(text);
}

export async function loadDocument(plugin: RNPlugin, docId: string, signal: AbortSignal) {
  const root = await plugin.rem.findOne(docId);
  if (!root) throw new Error('Open a document in the editor, then refresh the outline.');
  const [title, descendants] = await Promise.all([labelOf(plugin, root), root.getDescendants()]);
  signal.throwIfAborted();
  const ordered = readingOrder(root, descendants);
  const entries: Entry[] = [];
  // Bound concurrent SDK messages when a long document contains thousands of Rems.
  for (let start = 0; start < ordered.length; start += 24) {
    signal.throwIfAborted();
    const batch = await Promise.all(ordered.slice(start, start + 24).map(async rem => {
      const level = parseHeadingLevel(await rem.getFontSize());
      return {id: rem._id, level, label: level ? await labelOf(plugin, rem) : ''};
    }));
    entries.push(...batch);
  }
  return {title: title.trim() || 'Untitled document', ...makeOutline(entries)};
}

export async function jumpToHeading(plugin: RNPlugin, pane: Pane, headingId: string) {
  const activePane = await currentPane(plugin);
  if (activePane?.paneId !== pane.paneId || activePane.docId !== pane.docId)
    throw new Error('The active document changed. Select a heading in the new outline.');
  const heading = await plugin.rem.findOne(headingId);
  if (!heading) throw new Error('This heading was deleted. Refresh the outline.');
  // Resolve the path again: a heading can move or disappear while the pane is open.
  const seen = new Set([headingId]);
  let parentId = heading.parent;
  while (parentId && parentId !== pane.docId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = await plugin.rem.findOne(parentId);
    if (!parent) break;
    parentId = parent.parent;
  }
  if (parentId !== pane.docId) throw new Error('This heading moved. Refresh the outline.');
  const latest = await currentPane(plugin);
  if (latest?.docId !== pane.docId || latest.paneId !== pane.paneId)
    throw new Error('The active document changed. Select a heading in the new outline.');
  await plugin.window.setFocusedPaneId(pane.paneId);
  await heading.openRemInContext(pane.docId);
}
