// /src/screens/board/Board.js
import { useRenderMetric } from '../../diagnostics/useRenderMetric';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ActionMenu, EmptyState, ScreenIntro, Avatar, Bar, Button, Chip, Empty, IconBtn, Input, Page, Sheet, T, useWide } from '../../ui/ui';
import { useScreenActive, useStore, useStoreActions } from '../../store/store';
import { useHeaderActions } from '../../components/shell/HeaderActions';
import '../../components/inline/CompactTools';
import TaskLabels from '../../components/inline/TaskLabels';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../../ui/theme/theme';
import { MAIN, PRIORITIES, fmt } from '../../store/data';
import { AddCard, BoardCreateSheet, BoardsManager } from './BoardManagement';
import { useHoldDrag, cancelPendingBoardHolds } from '../../board/boardGesture';
import { BoardMotion } from '../../board/boardMotion';
import { committedName } from '../../board/boardInteractions.cjs';

const {visibleColumns} = require('../../board/boardColumns.cjs');
const {filterCards, dropBefore} = require('../../board/kanbanUX.cjs');
const DUE_FILTERS = [['all', 'Any date'], ['overdue', 'Overdue'], ['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'Next 7 days'], ['month', 'Next 30 days'], ['none', 'No date']];
const {ageInDays} = require('../../domain/powerUps.cjs');
const {newCtx, refreshMax, slotFor, listScrollAtPointer} = require('../../board/boardDragContext.cjs');
const {INITIAL_CARDS,nextCardCount} = require('../../board/cardMountWindow.cjs');
// Cards beyond the first five mount only in response to scrolling their list.
const EMPTY_FEATURES = Object.freeze([]);
const LIST_LIFT = 0.6;
const COL_WIDE = 320;
const COL_NARROW = 280;
const GAP = 14;
const HEADER_H = 44;
const DOUBLE_MS = 350;
const EDGE_X = 70;       // strip scrolls when the finger is this close to its left or right side
const EDGE_TOP = 120;    // page scrolls when the finger is this close to the top or bottom of the window
const EDGE_BOTTOM = 140;
const SPEED = 14;        // px per auto-scroll tick
const AUTO_MS = 30;
const NOSELECT = Platform.OS === 'web' ? { userSelect: 'none' } : {};
// A card drag only matters to its source and target columns; a list drag moves every column.
const dragFor = (drag, i) => (!drag || drag.kind === 'list' || drag.from === i || drag.to === i ? drag : null);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const liftShadow = (on, amount = 1) => ({
  shadowColor: '#000',
  shadowOpacity: on ? 0.25 : 0,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 * amount },
  elevation: on ? 8 * amount : 0,
});


export default function Board({ openTask }) {
 useRenderMetric('board');
  const { c } = useTheme();
  const wide = useWide();
  const active = useScreenActive();
  const { s, deleteBoard, workspace, togglePowerUp, setBoardView, runCommand } = useStore();
  const project=workspace.projects.find(p=>p.id===workspace.selectedId);
  const [boardId, setBoardId] = useState(MAIN);
  const [q, setQ] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [dueF, setDueF] = useState('all');
  const [prioF, setPrioF] = useState('All');
  const [ownerF, setOwnerF] = useState('All');
  const [labelF, setLabelF] = useState('All');
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);
  const [boardToolsOpen, setBoardToolsOpen] = useState(false);
  const headerControls = useMemo(() => ({ actions: [{ label: 'Tools', icon: 'sliders', variant: 'secondary', onPress: () => setBoardToolsOpen(true) }] }), []);
  useHeaderActions('board', headerControls, active);
  const [drag, setDrag] = useState(null); // { kind: 'card'|'list', id, from, to, before? }
  const [mountedColumns, setMountedColumns] = useState({});
  const [locked, setLocked] = useState(false); // stops scrolling while anything is dragged

  const kRef = useRef(null);
  if (!kRef.current) kRef.current = newCtx();
  const k = kRef.current;
  const stripBoxRef = useRef(null);
  const stripRef = useRef(null);
  const pageRef = useRef(null);

  const boards = s.boards.filter((b) => !b.archived);
  // Falls back to Main if the selected board was archived or deleted.
  const board = boards.find((b) => b.id === boardId) || s.boards.find((b) => b.id === MAIN);
  const lists = board.lists;
  const colW = wide ? COL_WIDE : COL_NARROW;
  const ensureColumns = (x, width) => {
    if (Platform.OS === 'web' || !active) return; // a hidden page mounts nothing; the effect below catches up on show
    const keys = visibleColumns(lists.length, x, width, colW, GAP).filter(i => i >= 2).map(i => `${board.id}:${lists[i].id}`);
    setMountedColumns(prev => {
      if (keys.every(key => prev[key])) return prev;
      return {...prev, ...Object.fromEntries(keys.map(key => [key, true]))};
    });
  };
  useEffect(() => { if (active) ensureColumns(k.scroll.x, k.size.vw); }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  // Retain visited columns so active drags and title editors are never unmounted.
  // Newly reached drop targets must be measured after their native views mount.
  useEffect(() => {
    if (!locked) return;
    const frame = requestAnimationFrame(() => k.measure());
    return () => cancelAnimationFrame(frame);
  }, [mountedColumns, locked]);
  // Grouped once per data change, so a drag step re-renders only the columns it touches.
  const { cards, byList, totals } = useMemo(() => {
    const list = filterCards(s.tasks.filter((t) => t.board === board.id), { text: q, owner: ownerF, label: labelF, priority: prioF, due: dueF })
      .filter((t) => !urgentOnly || PRIORITIES.indexOf(t.priority) >= 2);
    const groups = {}, counts = {};
    for (const l of lists) { groups[l.id] = []; counts[l.id] = 0; }
    for (const t of s.tasks) if (t.board === board.id && counts[t.list] !== undefined) counts[t.list] += 1;
    for (const t of list) if (groups[t.list]) groups[t.list].push(t);
    return { cards: list, byList: groups, totals: counts };
  }, [s.tasks, board, q, urgentOnly, dueF, prioF, ownerF, labelF]);
  // Owners and tags that exist on this board, for the filter chips.
  const { owners, tags } = useMemo(() => {
    const o = new Set(), g = new Set();
    for (const t of s.tasks) if (t.board === board.id) { if (t.owner) o.add(t.owner); for (const l of t.labels || []) g.add(l); }
    return { owners: [...o].sort(), tags: [...g].sort() };
  }, [s.tasks, board]);
  const filtersOn = dueF !== 'all' || prioF !== 'All' || ownerF !== 'All' || labelF !== 'All';
  const clearFilters = () => { setDueF('all'); setPrioF('All'); setOwnerF('All'); setLabelF('All'); };

  // Refresh the display order for this render (used for drop slots and the insertion line).
  k.order = useMemo(() => Object.fromEntries(lists.map((l) => [l.id, byList[l.id].map((t) => t.id)])), [lists, byList]);
  // Where a dropped card goes when a filter hides some cards of the list (see kanbanUX.dropBefore).
  k.dropBefore = (listId, slotIndex, movingId) => dropBefore(s.tasks, cards, listId, slotIndex, movingId);

  // Records where every card and the strip are, at the moment a drag starts.
  k.measure = () => {
    k.win = {};
    Object.keys(k.cards).forEach((id) => {
      const entry = k.cards[id],node = entry.ref.current;
      if (node) node.measure((x, y, w, h, px, py) => { k.win[id] = { y: py, h, sy: k.scroll.y, listId:entry.listId, cy:k.lists[entry.listId]?.scroll?.y||0 }; });
    });
    k.listTop = {};
    Object.keys(k.lists).forEach((id) => {
      const node = k.lists[id].ref.current;
      if (node) node.measure((x, y, w, h, px, py) => { k.listTop[id] = py; });
      const entry=k.lists[id];
      entry.viewportRef?.current?.measure((_x,_y,w,h,px,py)=>{entry.scroll.box={x:px,y:py,w,h,sy:k.scroll.y,sx:k.scroll.x};});
    });
    const strip = stripBoxRef.current;
    if (strip) strip.measure((x, y, w, h, px, py) => { k.stripBox = { x: px, w }; });
  };

  // On web, the browser would otherwise pan the lists natively during a drag and cancel it.
  // While a drag is active, block the browser's own touch-scrolling.
  useEffect(() => {
    if (!locked || Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const block = (e) => {
      if (e.cancelable) e.preventDefault();
    };
    document.addEventListener('touchmove', block, { passive: false });
    return () => document.removeEventListener('touchmove', block);
  }, [locked]);

  // While something is held, scroll the strip near its sides and the page near the window's top or bottom.
  useEffect(() => {
    if (!locked) return undefined;
    const id = setInterval(() => {
      const p = k.pointer;
      if (!p.valid) return;
      if (k.stripBox) {
        const { x, w } = k.stripBox;
        let d = 0;
        if (p.x < x + EDGE_X) d = -SPEED;
        else if (p.x > x + w - EDGE_X) d = SPEED;
        const nx = clamp(k.scroll.x + d, 0, k.max.x);
        if (d && nx !== k.scroll.x && stripRef.current) {
          k.scroll.x = nx;
          stripRef.current.scrollTo({ x: nx, animated: false });
          ensureColumns(nx, k.size.vw);
        }
      }
      const H = Dimensions.get('window').height;
      // Prefer the list beneath the held card; its content moves while the
      // source responder stays mounted and follows its own scroll offset.
      const target=drag?.kind==='card'?listScrollAtPointer(k,p,56,SPEED):null;
      if(target){target.entry.scroll.y=target.y;target.entry.scrollRef.current?.scrollTo({y:target.y,animated:false});return;}
      let dy = 0;
      if (p.y < EDGE_TOP) dy = -SPEED;
      else if (p.y > H - EDGE_BOTTOM) dy = SPEED;
      const ny = clamp(k.scroll.y + dy, 0, k.max.y);
      if (dy && ny !== k.scroll.y && pageRef.current) {
        k.scroll.y = ny;
        pageRef.current.scrollTo({ y: ny, animated: false });
      }
    }, AUTO_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked,drag?.kind]);

  const pageScrollProps = {
    // Let ScrollView retain its normal web responder; pointer-based drag does not claim touches.
    nestedScrollEnabled: true,
    onScrollBeginDrag: cancelPendingBoardHolds,
    onLayout: (e) => { k.size.vh = e.nativeEvent.layout.height; refreshMax(k); },
    onContentSizeChange: (w, h) => { k.size.ch = h; refreshMax(k); },
  };

  return (
    <Page
      title="Board"
      scrollRef={pageRef}
      scrollEnabled={!locked}
      scrollProps={pageScrollProps}
      onScroll={(e) => { k.scroll.y = e.nativeEvent.contentOffset.y; }}
    >
      <ScreenIntro title={board.name} description={`${cards.length} tasks · ${lists.length} lists`}/>
      <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
        <IconBtn icon="plus" label="Create board or list" onPress={() => setCreating(true)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flex:1,flexGrow:1}} contentContainerStyle={{gap:8,alignItems:'center'}}>
          {boards.map((b) => <BoardChip key={b.id} board={b} active={b.id === board.id} onSelect={() => setBoardId(b.id)} onManage={() => setManaging(true)} />)}
        </ScrollView>
      </View>

      {/* Lift above the ribbon without reparenting the held responder or shifting the lists. */}
      <View ref={stripBoxRef} collapsable={false} style={{zIndex:locked?20:0,overflow:'visible'}}>
        <ScrollView
          ref={stripRef}
          horizontal
          removeClippedSubviews={false}
          style={{marginTop:locked?-96:0,...(Platform.OS!=='web'?{overflow:locked?'visible':'hidden'}:{})}}
          scrollEnabled={!locked}
          scrollEventThrottle={16}
          nestedScrollEnabled
          onScrollBeginDrag={cancelPendingBoardHolds}
          directionalLockEnabled={Platform.OS === 'ios'}
          onLayout={(e) => { k.size.vw = e.nativeEvent.layout.width; refreshMax(k); ensureColumns(k.scroll.x, k.size.vw); }}
          onContentSizeChange={(w) => { k.size.cw = w; refreshMax(k); }}
          onScroll={(e) => { k.scroll.x = e.nativeEvent.contentOffset.x; ensureColumns(k.scroll.x, k.size.vw); }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: GAP, paddingTop:locked?96:0, paddingBottom: locked ? 320 : 8, alignItems: 'flex-start' }} // extra room below while dragging, so a card isn't clipped by the strip
        >
          {lists.length === 0 ? <Empty>No lists. Use the plus button to create one.</Empty> : null}
          {lists.map((l, i) => (
            Platform.OS !== 'web' && i >= 2 && !mountedColumns[`${board.id}:${l.id}`] ?
            <View key={l.id} style={{width: colW, minHeight: 240}} /> :
            <ListColumn
              key={l.id}
              board={board}
              list={l}
              index={i}
              total={lists.length}
              step={colW + GAP}
              width={colW}
              cards={byList[l.id]}
              windowKey={JSON.stringify([board.id,q,urgentOnly,dueF,prioF,ownerF,labelF])}
              features={project.powerUps?.[board.id]||EMPTY_FEATURES}
              labelColors={project.labelColors||{}}
              showDescriptions={project.kanbanViews?.[board.id]?.showDescriptions===true}
              totalCards={totals[l.id]}
              openTask={openTask}
              drag={dragFor(drag, i)}
              setDrag={setDrag}
              setLock={setLocked}
              k={k}
            />
          ))}
        </ScrollView>
      </View>

      <Sheet visible={boardToolsOpen} onClose={() => setBoardToolsOpen(false)} title="Board view" showNotice={false}
        footer={<Button label="Done" onPress={() => setBoardToolsOpen(false)} />}>
        <View style={{gap:8}}>
          <T size={14} weight="600">Find cards</T>
          <Input lazy value={q} onChangeText={setQ} placeholder="Search board cards" accessibilityLabel="Search board cards" />
          <Chip label="High and above" active={urgentOnly} onPress={() => setUrgentOnly(!urgentOnly)} />
        </View>
        <View style={{gap:10}}>
          <T size={14} weight="600">Filters</T>
          <T size={12} muted>Due date</T>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{DUE_FILTERS.map(([v,label])=><Chip key={v} label={label} active={dueF===v} onPress={()=>setDueF(v)}/>)}</View>
          <T size={12} muted>Priority</T>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['All',...PRIORITIES].map(v=><Chip key={v} label={v} active={prioF===v} onPress={()=>setPrioF(v)}/>)}</View>
          {owners.length ? <><T size={12} muted>Owner</T><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['All',...owners].map(v=><Chip key={v} label={v} active={ownerF===v} onPress={()=>setOwnerF(v)}/>)}</View></> : null}
          {tags.length ? <><T size={12} muted>Tag</T><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['All',...tags].map(v=><Chip key={v} label={v} active={labelF===v} onPress={()=>setLabelF(v)}/>)}</View></> : null}
          {q || urgentOnly || filtersOn ? <Button label="Clear filters" small variant="secondary" onPress={()=>{setQ('');setUrgentOnly(false);clearFilters();}} /> : null}
        </View>
        <View style={{gap:10}}>
          <T size={14} weight="600">Options</T>
          <Chip label="Descriptions on cards" active={project.kanbanViews?.[board.id]?.showDescriptions===true} onPress={()=>setBoardView(board.id,{showDescriptions:project.kanbanViews?.[board.id]?.showDescriptions!==true})}/>
          <T size={12} muted>Place new tasks</T>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
            <Chip label="Top of list" active={project.kanbanViews?.[board.id]?.newTaskAtTop===true} onPress={()=>setBoardView(board.id,{newTaskAtTop:true})}/>
            <Chip label="Bottom of list" active={project.kanbanViews?.[board.id]?.newTaskAtTop!==true} onPress={()=>setBoardView(board.id,{newTaskAtTop:false})}/>
          </View>
          <T size={12} muted>Power-Ups for this board</T>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{[['github','GitHub references'],['aging','Card age'],['checklist','Acceptance progress']].map(([id,label])=><Chip key={id} label={label} active={(project.powerUps?.[board.id]||[]).includes(id)} onPress={()=>togglePowerUp(board.id,id)}/>)}</View>
          {(project.automationCommands||[]).filter(c=>c.trigger==='boardButton'&&(!c.boardId||c.boardId===board.id)&&c.enabled).map(c=><Button key={c.id} small variant="secondary" label={`Run: ${c.name}`} onPress={()=>runCommand(c.id,'',board.id)}/>) }
          {board.id!==MAIN?<ActionMenu label="Board actions" items={[{label:'Delete board',icon:'trash-2',danger:true,
            confirmation:{title:'Delete board?',description:`Delete “${board.name}” and move its tasks to Main? This cannot be undone here.`,confirmLabel:'Delete board'},
            onPress:()=>{const ok=deleteBoard(board.id);if(ok){setBoardId(MAIN);setBoardToolsOpen(false);}return ok;}}]}/>:null}
        </View>
      </Sheet>
      {creating?<BoardCreateSheet visible onClose={() => setCreating(false)} board={board} onCreated={setBoardId}/>:null}
      <BoardsManager visible={managing} onClose={() => setManaging(false)} />
    </Page>
  );
}

// ---- board chip: tap selects, hold or double-tap opens the boards manager ---

function BoardChip({ board, active, onSelect, onManage }) {
  const { c } = useTheme();
  const lastTap = useRef(0);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open board ${board.name}`}
      accessibilityHint="Long press to manage boards"
      accessibilityState={{selected:!!active}}
      onPress={() => {
        const now = Date.now();
        if (now - lastTap.current < DOUBLE_MS) {
          lastTap.current = 0;
          onManage();
        } else {
          lastTap.current = now;
          onSelect();
        }
      }}
      onLongPress={onManage}
      delayLongPress={450}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? c.ink : c.line,
        backgroundColor: active ? c.ink : 'transparent',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <T size={13} weight="600" color={active ? c.bg : c.ink}>{board.name}</T>
    </Pressable>
  );
}

// ---- one list (column) ------------------------------------------------------
// Hold the header and drag to reorder lists. Double-tap the title to rename.
// While a card is held over this list, a line shows where it will land.

const ListColumn = memo(function ListColumn({ board, list, index, total, step, width, cards: allCards, windowKey, features, labelColors, showDescriptions, totalCards, openTask, drag, setDrag, setLock, k }) {
  const { c } = useTheme();
  const { addTask, renameList, moveListTo, deleteList } = useStoreActions();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [nameDraft, setNameDraft] = useState(list.name);
  const nameDraftRef = useRef(list.name);
  const editingRef = useRef(false);
  const titleRef = useRef(null);
  const colRef = useRef(null);
  const scrollRef=useRef(null),viewportRef=useRef(null);
  const scroll=useRef({y:0,max:0,h:0,content:0,box:null}).current;
  const userScroll=useRef(false),lastLoad=useRef(-1);
  const active = useScreenActive();
  const [mount,setMount]=useState({key:windowKey,shown:INITIAL_CARDS});
  const shown=mount.key===windowKey?mount.shown:INITIAL_CARDS;
  const setShown=count=>setMount(previous=>previous.key===windowKey&&previous.shown===count?previous:{key:windowKey,shown:count});
  const cardTotal = allCards.length;
  const cards = allCards.slice(0, shown);
  useEffect(()=>{setShown(INITIAL_CARDS);userScroll.current=false;lastLoad.current=-1;scroll.y=0;scrollRef.current?.scrollTo({y:0,animated:false});},[windowKey]);
  useEffect(()=>{if(!k.pointer.valid)return;const frame=requestAnimationFrame(()=>k.measure());return()=>cancelAnimationFrame(frame);},[shown,k]);
  const scrollCards=e=>{
    const {contentOffset,layoutMeasurement,contentSize}=e.nativeEvent;
    scroll.y=contentOffset.y;
    if(scroll.y<=lastLoad.current)return;
    const next=nextCardCount(shown,cardTotal,{active,userScroll:userScroll.current||k.pointer.valid,offset:scroll.y,viewport:layoutMeasurement.height,content:contentSize.height});
    if(next>shown){lastLoad.current=scroll.y;setShown(next);}
  };
  useEffect(() => {
    if (!editingRef.current) { nameDraftRef.current = list.name; setNameDraft(list.name); }
  }, [list.name]);
  const beginRename = () => {
    nameDraftRef.current = list.name;
    setNameDraft(list.name);
    editingRef.current = true;
    setEditing(true);
  };
  const endRename = () => {
    if (!editingRef.current) return; // submit and blur can happen on the same keystroke
    editingRef.current = false;
    setEditing(false);
    const next = committedName(nameDraftRef.current, list.name, 80);
    if (next !== list.name) renameList(board.id, list.id, next);
  };

  useEffect(() => {
    k.lists[list.id] = { ref: colRef, scrollRef, viewportRef, scroll };
    return () => {
      delete k.lists[list.id];
      delete k.listTop[list.id];
    };
  }, [list.id, k]);

  const { panHandlers, lifted, offset } = useHoldDrag({
    axis: 'x',
    titleRef,
    getScroll: () => k.scroll,
    onTitleDoubleTap: beginRename,
    onLift: () => {
      k.lastKey = null;
      setLock(true);
      k.measure();
      setDrag({ kind: 'list', id: list.id, from: index, to: index });
    },
    onMove: (cx, cy, px, py) => {
      k.pointer = { x: px, y: py, valid: true };
      const to = clamp(index + Math.round(cx / step), 0, total - 1);
      const key = `L${to}`;
      if (key === k.lastKey) return;
      k.lastKey = key;
      setDrag({ kind: 'list', id: list.id, from: index, to });
    },
    onDrop: (cx, cy, px, py) => {
      k.pointer = { x: px, y: py, valid: false };
      k.lastKey = null;
      setLock(false);
      setDrag(null);
      const to = clamp(index + Math.round(cx / step), 0, total - 1);
      if (to !== index) moveListTo(board.id, list.id, to);
    },
    onCancel: () => { k.pointer.valid = false; k.lastKey = null; setLock(false); setDrag(null); },
  });

  const listDragging = drag && drag.kind === 'list' && drag.id === list.id;
  const cardHere = drag && drag.kind === 'card' && drag.to === index;
  const cardFromHere = drag && drag.kind === 'card' && drag.from === index; // keeps the source list above its neighbours

  // While a list is held, the lists between its old and new slot slide one step aside, opening the gap where it will land.
  let shiftTo = 0;
  if (drag && drag.kind === 'list' && !listDragging) {
    if (drag.from < drag.to && index > drag.from && index <= drag.to) shiftTo = -step;
    else if (drag.from > drag.to && index >= drag.to && index < drag.from) shiftTo = step;
  }

  // Insertion line: above the card the pointer is over, or below the last card.
  // Positions come from what was measured at the lift, because onLayout doesn't report a card that only moved.
  let lineY = null;
  if (cardHere) {
    const ids = (k.order[list.id] || []).filter((id) => id !== drag.id);
    const top = k.listTop[list.id];
    if (top !== undefined) {
      if (drag.before) {
        const w = k.win[drag.before];
        if (w) lineY = w.y - top - (scroll.y-(w.cy||0)) - 6;
        else {const previous=ids.slice(0,ids.indexOf(drag.before)).reverse().map(id=>k.win[id]).find(Boolean);if(previous)lineY=previous.y+previous.h-top-(scroll.y-(previous.cy||0))+6;}
      } else if (ids.length) {
        const w = ids.slice().reverse().map(id=>k.win[id]).find(Boolean);
        if (w) lineY = w.y + w.h - top - (scroll.y-(w.cy||0)) + 6;
      } else {
        lineY = HEADER_H;
      }
    }
  }

  return (
    <BoardMotion
      ref={colRef}
      offset={offset}
      lifted={lifted}
      liftAmount={LIST_LIFT}
      shift={drag ? shiftTo : 0}
      style={{
        width,
        backgroundColor: c.surfaceAlt,
        borderRadius: 16,
        borderWidth: 0, borderColor: c.line,
        padding: 12,
        gap: 10,
        zIndex: lifted || listDragging || cardFromHere ? 6 : 0,
        opacity: lifted ? 0.94 : 1,
        ...liftShadow(lifted, LIST_LIFT),
      }}
    >
      <View
        {...(editing ? {} : panHandlers)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 4, ...NOSELECT }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, marginLeft: 4, backgroundColor: STATUS_COLOR[list.status] }} />
        {editing ? (
          <Input
            value={nameDraft}
            autoFocus
            onChangeText={(v) => { nameDraftRef.current = v; setNameDraft(v); }}
            onSubmitEditing={endRename}
            onBlur={endRename}
            style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 4, fontWeight: '600', fontSize: 14 }}
          />
        ) : (
          <View ref={titleRef} collapsable={false} style={{ flex: 1 }}>
            <T size={14} weight="600" numberOfLines={1}>{list.name}</T>
          </View>
        )}
        <View style={{ minWidth: 26, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: c.surface, borderRadius: 7, alignItems: 'center' }}><T size={12} weight="600" muted>{cardTotal}</T></View>
      </View>

      <View ref={viewportRef} collapsable={false} style={{maxHeight:Math.min(640,Math.max(240,Dimensions.get('window').height*.6)),overflow:drag?'visible':'hidden'}}>
      <ScrollView ref={scrollRef} accessibilityLabel={`${list.name} cards`} accessibilityHint="Scroll to load more cards"
        nestedScrollEnabled removeClippedSubviews={false} scrollEnabled={!drag} scrollEventThrottle={32}
        accessibilityActions={[{name:'increment',label:'Scroll to more cards'},{name:'decrement',label:'Scroll to previous cards'}]}
        onAccessibilityAction={e=>{
          if(!active||drag||!['increment','decrement'].includes(e.nativeEvent.actionName))return;userScroll.current=true;
          const forward=e.nativeEvent.actionName==='increment';
          const y=clamp(scroll.y+(forward?1:-1)*Math.max(120,scroll.h*.8),0,scroll.max);
          if(forward&&y===scroll.y&&shown<cardTotal)setShown(Math.min(cardTotal,shown+INITIAL_CARDS));
          else scrollRef.current?.scrollTo({y,animated:false});
        }}
        onScrollBeginDrag={()=>{userScroll.current=true;cancelPendingBoardHolds();}}
        {...(Platform.OS==='web'?{tabIndex:0,onWheel:()=>{userScroll.current=true;},onTouchMove:()=>{userScroll.current=true;},onKeyDown:()=>{userScroll.current=true;}}:{})}
        onScroll={scrollCards} onLayout={e=>{scroll.h=e.nativeEvent.layout.height;scroll.max=Math.max(0,scroll.content-scroll.h);}}
        onContentSizeChange={(_w,h)=>{scroll.content=h;scroll.max=Math.max(0,h-scroll.h);}}
        style={{maxHeight:Math.min(640,Math.max(240,Dimensions.get('window').height*.6)),overflow:drag?'visible':undefined}}
        contentContainerStyle={{gap:10,paddingBottom:4}}>
      {cards.map((t) => (
        <TaskCard
          key={t.id}
          t={t}
          previewY={cardHere&&drag.id!==t.id&&drag.before===t.id?14:0}
          board={board}
          features={features}
          labelColors={labelColors}
          showDescriptions={showDescriptions}
          fromIndex={index}
          total={total}
          step={step}
          openTask={openTask}
          setDrag={setDrag}
          setLock={setLock}
          k={k}
        />
      ))}

      {shown < cardTotal ? <View style={{minHeight:80,justifyContent:'center',paddingHorizontal:8}}><T size={12} muted>Scroll for {cardTotal-shown} more cards</T></View> : null}
      {cardTotal === 0 ? <EmptyState compact title="Space for the next step" description="Add a card below, or move work here."/> : null}
      </ScrollView>
      </View>

      {cardHere && lineY !== null ? <View pointerEvents="none" style={{position:'absolute',left:12,right:12,top:clamp(lineY-8,54,Math.max(54,scroll.h+42)),height:22,borderRadius:11,backgroundColor:c.accent,zIndex:5,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6}}>
        <Feather name="corner-down-right" size={12} color={c.accentInk}/><T size={10} weight="600" color={c.accentInk}>Place task here</T>
      </View>:null}

      <AddCard onAdd={(title) => addTask(title, list.status, board.id, { list: list.id })} />

      {confirmDel ? (
        <View style={{ gap: 10, padding: 12, borderRadius: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
          <T size={13} weight="500">
            Delete "{list.name}"?{' '}
            {totalCards
              ? `Its ${totalCards} card${totalCards === 1 ? '' : 's'} will move to "${(index > 0 ? board.lists[index - 1] : board.lists[1]).name}".`
              : 'It has no cards.'}
          </T>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button label="Delete list" small variant="danger" onPress={() => { setConfirmDel(false); deleteList(board.id, list.id); }} />
            <Button label="Cancel" small variant="ghost" onPress={() => setConfirmDel(false)} />
          </View>
        </View>
      ) : (
        <Pressable
          disabled={total <= 1}
          accessibilityRole="button" accessibilityLabel={`Delete list ${list.name}`}
          accessibilityState={{disabled:total<=1}}
          onPress={() => setConfirmDel(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingVertical: 4, opacity: total <= 1 ? 0.3 : 1 }}
        >
          <Feather name="trash-2" size={13} color={c.muted} />
          <T size={12} muted>Delete list</T>
        </Pressable>
      )}
    </BoardMotion>
  );
});

// ---- task card -----------------------------------------------------------------
// One tap opens the task. Hold and drag moves it, to any list and any position.
// Double-tap the title to edit it in place.

const TaskCard = memo(function TaskCard({ t, previewY=0, board, features=[], labelColors={}, showDescriptions=false, fromIndex, total, step, openTask, setDrag, setLock, k }) {
  const { c } = useTheme();
  const { updateTask, placeTask } = useStoreActions();
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(t.title);
  const titleDraftRef = useRef(t.title);
  const editingRef = useRef(false);
  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const { lists } = board;
  useEffect(() => {
    if (!editingRef.current) { titleDraftRef.current = t.title; setTitleDraft(t.title); }
  }, [t.title]);
  const beginTitleEdit = () => {
    titleDraftRef.current = t.title;
    setTitleDraft(t.title);
    editingRef.current = true;
    setEditing(true);
  };
  const endTitleEdit = () => {
    if (!editingRef.current) return; // commit only once on submit/blur
    editingRef.current = false;
    setEditing(false);
    const next = committedName(titleDraftRef.current, t.title, 240);
    if (next !== t.title) updateTask(t.id, { title: next }, `Renamed task ${t.id}`);
  };

  // Register this card so the board can measure it when a drag starts.
  useEffect(() => {
    k.cards[t.id] = { ref: cardRef, listId:t.list };
    return () => {
      delete k.cards[t.id];
      delete k.win[t.id];
      delete k.local[t.id];
    };
  }, [t.id, k]);

  const { panHandlers, lifted, offset } = useHoldDrag({
    titleRef,
    getScroll: () => ({x:k.scroll.x,y:k.scroll.y+(k.lists[t.list]?.scroll?.y||0)}),
    onTap: () => openTask(t.id),
    onTitleDoubleTap: beginTitleEdit,
    onLift: () => {
      k.lastKey = null;
      setLock(true);
      k.measure();
      setDrag({ kind: 'card', id: t.id, from: fromIndex, to: fromIndex, before: null });
    },
    onMove: (cx, cy, px, py) => {
      k.pointer = { x: px, y: py, valid: true };
      const to = clamp(fromIndex + Math.round(cx / step), 0, total - 1);
      const slot = slotFor(k, lists[to].id, py, t.id);
      const key = `C${to}:${slot.before}`;
      if (key === k.lastKey) return;
      k.lastKey = key;
      setDrag({ kind: 'card', id: t.id, from: fromIndex, to, before: slot.before });
    },
    onDrop: (cx, cy, px, py) => {
      k.pointer = { x: px, y: py, valid: false };
      k.lastKey = null;
      setLock(false);
      setDrag(null);
      const to = clamp(fromIndex + Math.round(cx / step), 0, total - 1);
      const slot = slotFor(k, lists[to].id, py, t.id);
      placeTask(t.id, lists[to].id, k.dropBefore ? k.dropBefore(lists[to].id, slot.index, t.id) : slot.before);
    },
    onCancel: () => { k.pointer.valid = false; k.lastKey = null; setLock(false); setDrag(null); },
  });

  return (
    <BoardMotion
      offset={offset}
      ref={cardRef}
      lifted={lifted}
      previewY={previewY}
      layoutKey={`${t.list}:${t.position}`}
      accessibilityRole="button"
      accessibilityLabel={`${t.title}, ${t.status}, ${t.priority} priority`}
      onAccessibilityTap={() => openTask(t.id)}
      {...(editing ? {} : panHandlers)}
      onLayout={(e) => {
        const { y, height } = e.nativeEvent.layout;
        k.local[t.id] = { y, h: height };
      }}
      style={{
        ...NOSELECT, // a long press must not select text; scrolling still works until the card lifts
        zIndex: lifted ? 10 : 0,
        opacity: lifted ? 0.94 : 1,
        ...liftShadow(lifted),
      }}
    >
      <View style={{padding:18,gap:18,borderRadius:16,backgroundColor:lifted?c.elevated:c.surface,borderWidth:1,borderColor:lifted?c.accent:c.line}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><T size={10} muted>{t.id.toUpperCase()}</T><Feather name="file-text" size={14} color={c.faint}/></View>
        <TaskLabels labels={t.labels} colors={labelColors} compact />
        <View ref={titleRef} collapsable={false}>
          {editing?<Input value={titleDraft} autoFocus onChangeText={v=>{titleDraftRef.current=v;setTitleDraft(v);}} onSubmitEditing={endTitleEdit} onBlur={endTitleEdit} style={{backgroundColor:'transparent',paddingHorizontal:0,paddingVertical:2,fontWeight:'600',fontSize:14}}/>:
            <T size={16} weight="500" numberOfLines={3} style={{lineHeight:23}}>{t.title}</T>}
        </View>
        {showDescriptions&&t.description?<T muted size={12} numberOfLines={2}>{t.description.replace(/[#*`_~]/g,'')}</T>:null}
        {features.includes('aging')&&t.status!=='Done'?<T muted size={11}>Updated {ageInDays(t)}d ago</T>:null}
        {t.progress>0&&!t.milestone?<Bar value={t.progress/100} height={4} color={STATUS_COLOR.Done}/>:null}
        <View style={{flexDirection:'row',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <View accessible accessibilityLabel={`Priority ${t.priority}`} style={{width:7,height:7,borderRadius:4,backgroundColor:PRIORITY_COLOR[t.priority]}}/>
          {t.due?<T size={11} muted>{fmt(t.due)}</T>:null}
          {t.tests?.length?<View style={{flexDirection:'row',alignItems:'center',gap:4}}><Feather name="check-square" size={12} color={c.muted}/><T size={11} muted>{t.tests.filter(x=>x.result==='passed').length}/{t.tests.length}</T></View>:null}
          {t.attachments?.length?<View style={{flexDirection:'row',alignItems:'center',gap:4}}><Feather name="paperclip" size={12} color={c.muted}/><T size={11} muted>{t.attachments.length}</T></View>:null}
          {t.comments?.length?<View style={{flexDirection:'row',alignItems:'center',gap:4}}><Feather name="message-square" size={12} color={c.muted}/><T size={11} muted>{t.comments.length}</T></View>:null}
          {features.includes('github')&&t.githubLinks?.length?<T size={11} muted>GitHub {t.githubLinks.length}</T>:null}
          <View style={{flex:1}}/>
          {t.owner?<Avatar name={t.owner} size={20}/>:null}
        </View>
      </View>
    </BoardMotion>
  );
});
