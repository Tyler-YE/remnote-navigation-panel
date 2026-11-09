import { useEffect } from 'react';
import type { RNPlugin } from '@remnote/plugin-sdk';

/** Size the OUTER iframe in the host, not against its own initial viewport.
 *  The SDK only accepts pixel heights, so 600px remains a usable fallback if
 *  the host cannot apply the scoped CSS. No other plugin iframe is selected.
 */
export function usePanelHeight(plugin: RNPlugin) {
  useEffect(() => {
    if (!plugin.rootURL) return;
    const root = new URL(plugin.rootURL);
    root.hash = '';
    root.search = '';
    const selector = `iframe[src^=${JSON.stringify(root.href)}][src*="widgetName=navigator"]`;
    let disposed = false;
    let busy = false;
    let instanceId: number | undefined;
    let previousTop: number | undefined;

    const sync = async () => {
      if (disposed || busy || document.visibilityState === 'hidden') return;
      busy = true;
      try {
        if (instanceId === undefined) {
          const context = await plugin.widget.getWidgetContext();
          const value = context?.widgetInstanceId;
          if (value === undefined || value === null || value === '') return;
          const id = Number(value);
          if (!Number.isFinite(id)) return;
          instanceId = id;
        }
        const rect = await plugin.widget.getDimensions(instanceId);
        // Ignore hidden/unmounted frames and positions outside the visible host.
        if (disposed || !rect || !Number.isFinite(rect.top) || rect.top < 0 || rect.width <= 0) return;
        const top = Math.ceil(rect.top);
        if (top === previousTop) return;
        await plugin.app.registerCSS('document-navigator-panel-height', `
          ${selector} {
            height: max(300px, calc(100vh - ${top + 8}px)) !important;
            height: max(300px, calc(100dvh - ${top + 8}px)) !important;
            max-height: none !important;
          }
        `);
        if (!disposed) previousTop = top;
      } catch {
        // Keep the explicit 600px registration instead of collapsing the list.
        // A later resize or poll can recover a temporarily unavailable host API.
      } finally {
        busy = false;
      }
    };
    const resize = () => { void sync(); };
    void sync();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', resize);
    // Toolbars can move the sidebar without resizing the iframe itself.
    const timer = setInterval(resize, 2000);
    return () => {
      disposed = true;
      clearInterval(timer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', resize);
    };
  }, [plugin]);
}
