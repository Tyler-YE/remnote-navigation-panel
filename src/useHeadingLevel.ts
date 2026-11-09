import { useCallback, useEffect, useRef, useState } from 'react';
import type { RNPlugin } from '@remnote/plugin-sdk';
import type { HeadingDepth } from './model.ts';

const key = 'outline-max-heading-level-v2';
const legacyKey = 'outline-max-heading-level';

export function useHeadingLevel(plugin: RNPlugin) {
  const [level, setLevel] = useState<HeadingDepth>(5);
  const edited = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let disposed = false;
    void (async () => {
      let saved = await plugin.storage.getLocal(key);
      if (disposed || edited.current) return;
      if (saved === undefined) {
        const legacy = await plugin.storage.getLocal(legacyKey);
        // In 2.2.0, 3 meant "All". Preserve that intent as the supported range
        // expands; explicit H1/H2 choices retain their old limits.
        saved = legacy === 3 ? 5 : legacy;
      }
      // A slow initial read must not replace a choice the user just made.
      if (!disposed && !edited.current && (saved === 1 || saved === 2 || saved === 3 || saved === 4 || saved === 5)) setLevel(saved);
    })().catch(() => {});
    return () => { disposed = true; };
  }, [plugin]);
  const choose = useCallback((next: HeadingDepth) => {
    edited.current = true;
    setLevel(next);
    // Preserve the latest choice even if host storage writes complete slowly.
    // If storage is unavailable, the current session still works normally.
    writes.current = writes.current.catch(() => {}).then(() => plugin.storage.setLocal(key, next)).catch(() => {});
  }, [plugin]);
  return [level, choose] as const;
}
