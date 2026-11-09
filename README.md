# Document Navigator

**Version 1.0.0**

Document Navigator adds a compact outline to RemNote's right sidebar, helping you browse long documents, find sections, and jump directly to headings. Its heading controls follow the familiar behavior of Microsoft Word's navigation pane.

## Features

- **H1–H5 outline:** View native headings in document order with a clear nested structure.
- **Flexible expansion:** Choose a default heading level, then expand individual branches further using their arrows.
- **Search all headings:** Find headings at any level, including those inside collapsed sections.
- **Click to navigate:** Jump to a heading in its original document.
- **Compact layout:** Browse closely spaced rows in a scrollable panel that fits the available sidebar height.
- **Saved preference:** Keep your selected heading level when reopening the panel or switching documents.

## Getting Started

1. Open a document in RemNote.
2. Select **Document Navigator** in the right sidebar, or press **Ctrl+K** and search for **Open Document Navigator**.
3. Click a heading to jump to it. Use the arrow beside a heading to expand or collapse its section.
4. Enter text in **Search headings** to find a section.

## Heading Levels

The dropdown sets the initial expansion of the outline.

| Option | Initial view |
| --- | --- |
| Show H1 | Show root headings and collapse their descendants |
| Show H2 | Expand through H2 |
| Show H3 | Expand through H3 |
| Show H4 | Expand through H4 |
| All (H1–H5) | Expand all supported heading levels |

For example, after selecting **Show H1**, you can still expand the arrows to reveal H2, H3, H4, and H5. The dropdown remains on Show H1.

Selecting another level resets manual expansion. The small reset button beside the dropdown reapplies the currently selected level. Collapsing and reopening a parent preserves the manual expansion within that branch while the document view remains open.

## Search and Navigation

Search checks the entire outline and temporarily reveals the paths to matching headings. Clearing the search restores the previous expansion state.

The heading count shows **visible headings / total headings**, or the number of matches while searching. The top refresh button reloads the outline, and the active section follows the editing cursor.

## Supported Content

Document Navigator reads native H1–H5 heading styles. Bold text and indentation alone do not create headings. H4 and H5 require a RemNote client that exposes those styles to plugins. Documents that begin at a deeper heading level keep their root headings accessible.

The plugin is designed for desktop and computer web clients. Mobile, PDF bookmarks, and headings inside portal-linked external documents are outside its scope.

## Privacy

Document Navigator uses read access to locate headings in the active document. It does not edit your notes or send their content to third-party services. The selected heading level is stored locally through RemNote's plugin storage.
