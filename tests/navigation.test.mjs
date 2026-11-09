import test from 'node:test';
import assert from 'node:assert/strict';
import { readingOrder, makeOutline, filterHeadings, visibleHeadingChildren, countVisibleHeadings, parseHeadingLevel } from '../src/model.ts';
import { loadDocument, currentPane, jumpToHeading } from '../src/document.ts';

const rem = (_id, parent, children = []) => ({_id, parent, children});
const root = rem('doc', null, ['intro','a','b','end']);
const descendants = [rem('b','doc'),rem('a2','a'),rem('intro','doc'),rem('a','doc',['a2']),rem('end','doc')];
const records = [
  {id:'intro', label:''}, {id:'a', label:'Section', level:'H1'},
  {id:'a2', label:'MEP coordination', level:'H3'}, {id:'b', label:'Body text'},
  {id:'end', label:'Section', level:'H1'}
];

test('depth-first document order comes from ordered children, including unformatted branches', () => {
  assert.deepEqual(readingOrder(root, descendants).map(r=>r._id), records.map(r=>r.id));
});
test('foreign nodes, a stale child pointer and a duplicate cannot enter the outline', () => {
  const r = rem('doc',null,['a','f','a']);
  assert.deepEqual(readingOrder(r,[rem('a','doc',['doc']),rem('f','another'),rem('abandoned','doc')]).map(x=>x._id), ['a']);
});
test('H1 → H3 skips an absent level, duplicate labels stay separate, ordinary text resolves to its section', () => {
  const out = makeOutline(records);
  assert.equal(out.count,3);
  assert.deepEqual(out.roots.map(x=>x.id), ['a','end']);
  assert.deepEqual(out.roots[0].children.map(x=>x.id), ['a2']);
  assert.equal(out.sectionOf.get('b'),'a2');
  assert.equal(out.sectionOf.get('intro'),undefined);
});
test('search finds a nested heading, preserves its path and handles width and case', () => {
  const {roots} = makeOutline(records);
  const {tree,matches} = filterHeadings(roots,'  ＣＯＯＲＤ  ');
  assert.deepEqual([...matches], ['a2']);
  assert.deepEqual(tree.map(x=>x.id), ['a']);
  assert.deepEqual(tree[0].children.map(x=>x.id), ['a2']);
  assert.equal(filterHeadings(roots,'Section').matches.size,2);
  assert.deepEqual(filterHeadings(roots,'no match').tree, []);
  assert.equal(filterHeadings(roots,'  ').tree,roots);
});
test('empty documents, leading H2, blank titles and a following H1', () => {
  assert.deepEqual(makeOutline([]).roots,[]);
  const {roots} = makeOutline([{id:'x',label:' ',level:'H2'},{id:'y',label:'Z',level:'H1'}]);
  assert.deepEqual(roots.map(x=>x.label),['Untitled heading','Z']);
});

test('Show H1 keeps descendants reachable by progressively expanding arrows through H5', () => {
  const {roots}=makeOutline([
    {id:'a',label:'Chapter',level:'H1'}, {id:'b',label:'Part',level:'H2'},
    {id:'c',label:'Section',level:'H3'}, {id:'d',label:'Detail',level:'H4'},
    {id:'e',label:'Deep target',level:'H5'},
  ]);
  const original=structuredClone(roots), expanded=new Map();
  assert.equal(countVisibleHeadings(roots,1,expanded),1);
  for (const [i,id] of ['a','b','c','d'].entries()) {
    expanded.set(id,true);
    assert.equal(countVisibleHeadings(roots,1,expanded),i+2);
  }
  expanded.set('a',false);assert.equal(countVisibleHeadings(roots,1,expanded),1);
  expanded.set('a',true);assert.equal(countVisibleHeadings(roots,1,expanded),5);
  assert.equal(countVisibleHeadings(roots,1,new Map()),1,'Reapplying H1 resets manual expansion');
  assert.equal(countVisibleHeadings(roots,4,new Map()),4);
  assert.equal(countVisibleHeadings(roots,5,new Map()),5);
  assert.deepEqual(roots,original,'Presets and arrows never prune source headings');
});
test('a direct H4 child retains its arrow route when a document skips heading levels', () => {
  const {roots}=makeOutline([
    {id:'a',label:'Overview',level:'H1'}, {id:'skip',label:'Direct H4',level:'H4'},
    {id:'b',label:'Part',level:'H2'}, {id:'c',label:'Deep child',level:'H5'},
  ]);
  const expanded=new Map();
  assert.deepEqual(visibleHeadingChildren(roots[0],2,expanded).map(x=>x.id),['b']);
  expanded.set('a',true);
  assert.deepEqual(visibleHeadingChildren(roots[0],1,expanded).map(x=>x.id),['skip','b']);
  assert.equal(countVisibleHeadings(roots,1,expanded),3);
  expanded.set('b',true);assert.equal(countVisibleHeadings(roots,1,expanded),4);
});
test('search finds deeper headings while a shallow expansion preset is active', () => {
  const {roots}=makeOutline(records), expanded=new Map();
  assert.equal(countVisibleHeadings(roots,1,expanded),2);
  const result=filterHeadings(roots,'coordination');
  assert.deepEqual([...result.matches],['a2']);
  assert.equal(result.tree[0].children[0].id,'a2');
  assert.equal(countVisibleHeadings(roots,1,expanded),2,'Searching does not alter fold state');
});
test('root headings remain reachable in documents without H1, including an empty outline', () => {
  const {roots}=makeOutline([{id:'a',label:'Detail',level:'H3'},{id:'b',label:'Part',level:'H2'}]);
  assert.equal(countVisibleHeadings(roots,1,new Map()),2);
  assert.equal(countVisibleHeadings([],1,new Map()),0);
});

test('native H4/H5 values are recognized without treating body styles or unsupported values as headings', () => {
  for (const value of ['H1','H2','H3','H4','H5']) assert.equal(parseHeadingLevel(value),value);
  for (const value of [undefined,null,'Normal','H0','H6','h4',4,true,{level:'H4'}]) assert.equal(parseHeadingLevel(value),undefined);
});

function host() {
  const callLog = [];
  const items = new Map([root,...descendants].map(r=>[r._id,{...r,text:[r._id]}]));
  for (const [id,r] of items) {
    const row = records.find(x=>x.id === id);
    r.getFontSize = async()=>row?.level;
    r.openRemInContext = async docId=>callLog.push(['jump',id,docId]);
  }
  items.get('doc').getDescendants = async()=>[...descendants].map(r=>items.get(r._id));
  let active = 'p';
  const docs = new Map([['p','doc'],['q','other']]);
  const plugin = {rem: {findOne: async id=>items.get(id)}, richText:{toString: async x=>x.map(v=>v.i ?? v).join('')},
    window: {getFocusedPaneId:async()=>active,getLastFocusedPane:async()=>'p',getOpenPaneIds:async()=>[...docs.keys()],getOpenPaneRemId:async p=>docs.get(p),
      setFocusedPaneId:async p=>callLog.push(['focus',p])}};
  return {items,plugin,callLog,docs,setActive:p=>active=p};
}
test('loads nested rich-text headings without turning body text into headings',async()=>{
  const {plugin,items} = host();
  items.get('a2').text = [{i:'Referenced heading'}];
  const out=await loadDocument(plugin,'doc',new AbortController().signal);
  assert.equal(out.roots[0].children[0].label,'Referenced heading');
  assert.equal(out.count,3);
});
test('document scanning retains host-provided H4 and H5 despite the older SDK declaration',async()=>{
  const h=host();
  h.items.get('a2').getFontSize=async()=>'H4';
  h.items.get('b').getFontSize=async()=>'H5';
  h.items.get('intro').getFontSize=async()=>'Normal';
  const out=await loadDocument(h.plugin,'doc',new AbortController().signal);
  assert.equal(out.count,4);
  const h4=out.roots[0].children[0];
  assert.equal(h4.level,'H4');assert.equal(h4.id,'a2');
  assert.equal(h4.children[0].level,'H5');assert.equal(h4.children[0].id,'b');
  await jumpToHeading(h.plugin,{paneId:'p',docId:'doc'},'b');
  assert.deepEqual(h.callLog,[['focus','p'],['jump','b','doc']]);
});
test('selecting the side panel can recover the last document pane',async()=>{
  const h=host(); h.setActive('sidebar');
  assert.deepEqual(await currentPane(h.plugin),{paneId:'p',docId:'doc'});
});
test('jump uses the stable heading ID and original document context',async()=>{
  const h=host();
  await jumpToHeading(h.plugin,{paneId:'p',docId:'doc'},'a2');
  assert.deepEqual(h.callLog,[['focus','p'],['jump','a2','doc']]);
});
test('stale navigation after a pane switch, deletion or move never opens a different heading',async()=>{
  const h=host(), p={paneId:'p',docId:'doc'};
  h.setActive('q'); await assert.rejects(jumpToHeading(h.plugin,p,'a2'),/changed/);
  h.setActive('p'); h.items.get('a2').parent='other';
  await assert.rejects(jumpToHeading(h.plugin,p,'a2'),/moved/);
  h.items.delete('a2'); await assert.rejects(jumpToHeading(h.plugin,p,'a2'),/deleted/);
  assert.deepEqual(h.callLog,[]);
});
test('an obsolete document scan stops before issuing heading requests',async()=>{
  const h=host(), abort=new AbortController(); let n=0;
  for(const item of h.items.values()) item.getFontSize=async()=>{n++;};
  abort.abort();
  await assert.rejects(loadDocument(h.plugin,'doc',abort.signal),{name:'AbortError'});
  assert.equal(n,0);
});

test('a document can be found before the editor records a last focused pane', async () => {
  const h = host();
  h.setActive('sidebar');
  h.plugin.window.getLastFocusedPane = async () => undefined;
  assert.deepEqual(await currentPane(h.plugin), {paneId:'p',docId:'doc'});
});
test('closing every document clears the selected pane', async () => {
  const h = host();
  h.setActive('sidebar');
  h.docs.clear();
  assert.equal(await currentPane(h.plugin),null);
});
