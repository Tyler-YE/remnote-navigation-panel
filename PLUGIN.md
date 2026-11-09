# Document Navigator

A compact document outline for RemNote's right sidebar, with Word-style heading expansion presets.

## Features

- Lists native H1–H5 headings in document order.
- Show H1 initially collapses descendants; arrows can still reveal H2, H3, H4 and H5 without changing the selected preset.
- Show H2–H4 set the initial expansion depth. All (H1–H5) expands the complete outline.
- The small reset button beside the dropdown reapplies the selected preset.
- Search finds matches across all levels, temporarily reveals their ancestor paths, and restores folding when cleared.
- Click a heading to jump to it in its original document context.
- Compact rows and a scrollable panel that fits the available sidebar height.
- Remembers the selected preset on this device. Manual branch expansion is kept for the current document view.

## Usage

After installation, open a document and select Document Navigator in the right sidebar. Alternatively use Ctrl+K and search for Open Document Navigator. Apply native heading styles to your notes; indentation or bold text alone does not create a heading level. H4/H5 require a RemNote client that exposes those native styles through its plugin API.

The count shows visible headings / total headings, or the number of search matches. The top refresh button reloads the outline. The smaller button beside the level selector resets expansion.

## Installation and distribution

The publisher uploads the compiled plugin ZIP through RemNote's Plugins > Build > Upload plugin. JavaScript plugins require review and approval, including unlisted plugins. After approval, install from the plugin's RemNote page. The repository contains the build instructions and source used for review. Merely publishing a GitHub release does not register a plugin with RemNote.

## Permissions and privacy

This plugin requests read access to the knowledge base to scan the active document's descendants and locate headings. It does not edit note content or send notes to third-party services. It stores the selected heading preset locally through RemNote's plugin storage API. All runtime scripts are bundled in the upload package; there is no analytics integration or external script CDN.

## Scope and validation

Desktop and computer web clients are supported. Mobile is disabled because the plugin uses the right sidebar. Portal-linked external documents and PDF bookmarks are not included. The layout uses a 600-pixel initial frame and scoped host CSS to fit the available height; the initial height remains if host integration is unavailable.

Navigation and release configuration have automated tests. The compiled plugin has also been exercised through a simulated RemNote SDK host. Marketplace acceptance and the live Windows client require validation after submission.
