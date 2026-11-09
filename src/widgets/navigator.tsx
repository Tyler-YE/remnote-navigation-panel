import { useEffect, useMemo, useRef, useState } from 'react';
import { renderWidget, usePlugin, useTrackerPlugin, type RNPlugin } from '@remnote/plugin-sdk';
import { filterHeadings, visibleHeadingChildren, countVisibleHeadings, type Heading, type HeadingDepth } from '../model.ts';
import { jumpToHeading, type Pane } from '../document.ts';
import { useDocument, usePane } from '../useDocument.ts';
import { usePanelHeight } from '../usePanelHeight.ts';
import { useHeadingLevel } from '../useHeadingLevel.ts';
import css from '../panel.css';

const paths = {
  outline: 'M4 5h16M4 12h4m4 0h8M4 19h8m3 0h5',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  refresh: 'M20 10a8 8 0 1 0-2 8M20 4v6h-6',
  down: 'm7 10 5 5 5-5', right: 'm10 7 5 5-5 5', clear: 'm6 6 12 12M18 6 6 18',
};

function Icon({name}: {name: keyof typeof paths}) {
  return <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}

function DocumentPanel({plugin, pane, retry, presetLevel, chooseLevel}: {
  plugin: RNPlugin; pane: Pane; retry: () => void;
  presetLevel: HeadingDepth; chooseLevel: (level: HeadingDepth) => void;
}) {
  const {data, error, refresh} = useDocument(plugin, pane.docId);
  const [query, setQuery] = useState('');
  const [expansion, setExpansion] = useState(new Map<string, boolean>());
  const [selected, setSelected] = useState<string>();
  const [jumpError, setJumpError] = useState('');
  const [navigating, setNavigating] = useState(false);
  const alive = useRef(true);
  const jumping = useRef(false);
  const search = useRef<HTMLInputElement>(null);
  const focusId = useTrackerPlugin(async p => (await p.focus.getFocusedRem())?._id, []);
  const section = focusId && data?.sectionOf.get(focusId);
  const hasFocusInDoc = !!focusId && (focusId === pane.docId || !!data?.sectionOf.has(focusId));
  useEffect(() => {
    if (hasFocusInDoc) setSelected(section || undefined);
  }, [focusId, section, hasFocusInDoc]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  // Restoring a saved preset also starts from that preset's default expansion.
  useEffect(() => { setExpansion(new Map()); }, [presetLevel]);
  const {tree, matches} = useMemo(() => filterHeadings(data?.roots ?? [], query), [data, query]);
  const visibleCount = useMemo(() => countVisibleHeadings(data?.roots ?? [], presetLevel, expansion), [data, presetLevel, expansion]);
  const searching = !!query.trim();
  function applyLevel(level: HeadingDepth) {
    setExpansion(new Map());
    chooseLevel(level);
  }
  function toggle(item: Heading) {
    setExpansion(prev => {
      const next = new Map(prev);
      next.set(item.id, visibleHeadingChildren(item, presetLevel, prev).length === 0);
      return next;
    });
  }
  async function jump(id: string) {
    if (jumping.current) return;
    jumping.current = true;
    setNavigating(true);
    setJumpError('');
    try {
      await jumpToHeading(plugin, pane, id);
      if (alive.current) setSelected(id);
    } catch (e) {
      if (alive.current) { setJumpError(e instanceof Error ? e.message : 'Could not jump to this heading. Try again.'); refresh(); }
    } finally {
      jumping.current = false;
      if (alive.current) setNavigating(false);
    }
  }
  function rows(items: Heading[], depth: number) {
    return <ul className="hn-list">{items.map(item => {
      const hasChildren = item.children.length > 0;
      const visibleChildren = searching ? item.children : visibleHeadingChildren(item, presetLevel, expansion);
      const expanded = visibleChildren.length > 0;
      const active = item.id === selected;
      return <li key={item.id}>
        <div className={'hn-row' + (active ? ' active' : '') + (searching && !matches.has(item.id) ? ' context' : '')}
          style={{paddingInlineStart: 4 + depth * 14}}>
          {hasChildren && !searching
            ? <button className="hn-icon hn-fold" aria-label={(expanded ? 'Collapse ' : 'Expand ') + item.label}
                aria-expanded={expanded} onClick={() => toggle(item)}><Icon name={expanded ? 'down' : 'right'}/></button>
            : <span className="hn-spacer" aria-hidden="true">{hasChildren && <Icon name="down"/>}</span>}
          <button className={'hn-heading level-' + item.level} aria-current={active ? 'location' : undefined}
            aria-disabled={navigating || undefined} onClick={() => void jump(item.id)} title={item.label}>
            <span className="hn-label">{item.label}</span><span className="hn-level">{item.level}</span>
          </button>
        </div>
        {hasChildren && expanded && rows(visibleChildren, depth + 1)}
      </li>;
    })}</ul>;
  }
  return <>
    <div className="hn-kicker"><Icon name="outline"/><span>Document Navigator</span>
      <span className="hn-version" aria-label={'Version ' + __NAVIGATOR_VERSION__}>v{__NAVIGATOR_VERSION__}</span>
      <button className="hn-icon hn-refresh" aria-label="Refresh outline" title="Refresh outline"
        onClick={() => {setJumpError(''); retry(); refresh();}}><Icon name="refresh"/></button>
    </div>
    <h2 className="hn-title">{data?.title ?? 'Current document'}</h2>
    <div className="hn-search"><Icon name="search"/>
      <input ref={search} type="text" aria-label="Search headings" placeholder="Search headings" value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape' && query) { e.stopPropagation(); setQuery(''); } }}/>
      {query && <button className="hn-icon" aria-label="Clear search" onClick={() => {setQuery(''); search.current?.focus();}}><Icon name="clear"/></button>}
    </div>
    <div className="hn-caption">
      <div className="hn-level-controls">
        <label className="hn-level-filter">
          <span className="hn-sr-only">Show heading levels</span>
          <select className="hn-level-select" value={presetLevel} title="Set default expansion. Arrows can reveal deeper headings."
            onChange={e => applyLevel(Number(e.target.value) as HeadingDepth)}>
            <option value={5}>All (H1–H5)</option>
            <option value={1}>Show H1</option>
            <option value={2}>Show H2</option>
            <option value={3}>Show H3</option>
            <option value={4}>Show H4</option>
          </select>
        </label>
        <button className="hn-icon hn-apply-level" aria-label="Apply selected heading level"
          title="Reset expansion to the selected heading level" onClick={() => applyLevel(presetLevel)}><Icon name="refresh"/></button>
      </div>
      <span className="hn-count" aria-live="polite" title={searching ? 'Matches across all heading levels' : 'Visible headings / total headings'}>{data ? (searching
        ? matches.size + (matches.size === 1 ? ' match' : ' matches')
        : visibleCount + ' / ' + data.count + (data.count === 1 ? ' heading' : ' headings')) : '…'}</span>
    </div>
    {(error || jumpError) && <p role="alert" className="hn-note">{jumpError || error}</p>}
    {tree.length > 0 ? <nav className="hn-scroll" aria-label="Document headings">{rows(tree, 0)}</nav>
      : !error && <div className="hn-empty" role="status">
        <strong>{!data ? 'Loading headings…' : searching ? 'No matching headings' : 'No headings yet'}</strong>
        <span>{!data ? '' : searching ? 'Try a shorter search term.' : 'Apply a heading style (H1–H5) to a paragraph to add it to the outline.'}</span>
      </div>}
  </>;
}

function Navigator() {
  const plugin = usePlugin();
  usePanelHeight(plugin);
  const [presetLevel, chooseLevel] = useHeadingLevel(plugin);
  const {pane, error, retry} = usePane(plugin);
  return <section className="hn" lang="en"><style>{css}</style>
    {pane ? <DocumentPanel key={pane.paneId + '/' + pane.docId} pane={pane} plugin={plugin} retry={retry}
        presetLevel={presetLevel} chooseLevel={chooseLevel}/>
      : <><div className="hn-kicker"><Icon name="outline"/>Document Navigator
          <span className="hn-version">v{__NAVIGATOR_VERSION__}</span></div>
        <div className="hn-empty" role="status"><strong>{error ? 'Could not read the active pane' : pane === null ? 'Open a document to see its headings' : 'Connecting to the editor…'}</strong>
        {pane === null && <button onClick={retry}>Try again</button>}</div></>}
  </section>;
}
renderWidget(Navigator);
