import { declareIndexPlugin, WidgetLocation } from '@remnote/plugin-sdk';

declareIndexPlugin(async plugin => {
  try {
    await plugin.app.registerWidget('navigator', WidgetLocation.RightSidebar, {
      widgetTabTitle: 'Document Navigator',
      widgetTabIcon: plugin.rootURL + 'logo.svg',
      // A content-sized iframe and a 100%-height child form a circular size
      // dependency. Give the iframe a usable initial size; the panel then fits
      // its outer iframe to the available host viewport through scoped CSS.
      dimensions: { height: 600, width: '100%' },
      dontOpenByDefaultInTabLocation: false,
    });
    await plugin.app.registerCommand({
      id: 'open-document-navigator',
      name: 'Open Document Navigator',
      keywords: 'word document navigation headings outline sidebar',
      action: async () => { await plugin.window.openWidgetInRightSidebar('navigator'); },
    });
    await plugin.app.toast('Document Navigator is ready. Open its tab in the right sidebar.');
  } catch (error) {
    await plugin.app.toast('Document Navigator could not start. ' +
      (error instanceof Error ? error.message : 'Reload the plugin to try again.'));
  }
}, async () => {});
