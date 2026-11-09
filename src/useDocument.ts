import { useCallback, useEffect, useRef, useState } from 'react';
import { AppEvents, type RNPlugin } from '@remnote/plugin-sdk';
import { currentPane, loadDocument, type Pane } from './document.ts';

type Data = Awaited<ReturnType<typeof loadDocument>>;
const contextEvents = [AppEvents.FocusedPaneChange, AppEvents.CurrentWindowTreeChange,
  AppEvents.GlobalOpenRem, AppEvents.URLChange, AppEvents.FocusedRemChange];
const editEvents = [AppEvents.GlobalRemChanged, AppEvents.EditorTextEdited];

export function usePane(plugin: RNPlugin) {
  const [pane, setPane] = useState<Pane | null | undefined>();
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    let generation = 0;
    let busy = false;
    let queued = false;
    let disposed = false;
    const sync = async () => {
      if (disposed) return;
      const request = ++generation;
      if (busy) { queued = true; return; }
      busy = true;
      try {
        const next = await currentPane(plugin);
        if (generation !== request) return;
        setError(false);
        setPane(prev => prev?.paneId === next?.paneId && prev?.docId === next?.docId && prev !== undefined ? prev : next);
      } catch {
        if (generation === request) { setError(true); setPane(null); }
      } finally {
        busy = false;
        if (queued && !disposed) { queued = false; void sync(); }
      }
    };
    for (const event of contextEvents) plugin.event.addListener(event, undefined, sync);
    void sync();
    // Some client versions omit context events when tabs or sidebars receive focus.
    const poll = setInterval(() => {
      if (!busy && document.visibilityState !== 'hidden') void sync();
    }, 2000);
    return () => {
      disposed = true;
      clearInterval(poll);
      generation++;
      for (const event of contextEvents) plugin.event.removeListener(event, undefined, sync);
    };
  }, [plugin, revision]);
  return {pane, error, retry};
}

export function useDocument(plugin: RNPlugin, docId: string) {
  const [data, setData] = useState<Data>();
  const [error, setError] = useState('');
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let busy = false;
    let queued = false;
    const read = async () => {
      if (controller.signal.aborted) return;
      if (busy) { queued = true; return; }
      busy = true;
      try {
        const next = await loadDocument(plugin, docId, controller.signal);
        if (!controller.signal.aborted) { setData(next); setError(''); }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'The document could not be read. Refresh to try again.');
      } finally {
        busy = false;
        if (queued && !controller.signal.aborted) { queued = false; schedule(); }
      }
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(read, 650); };
    refresh.current = () => { clearTimeout(timer); void read(); };
    for (const event of editEvents) plugin.event.addListener(event, undefined, schedule);
    void read();
    return () => {
      controller.abort();
      clearTimeout(timer);
      for (const event of editEvents) plugin.event.removeListener(event, undefined, schedule);
    };
  }, [plugin, docId]);
  return {data, error, refresh: () => refresh.current()};
}
