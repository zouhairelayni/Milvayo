import { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar, Bar, Button, Card, Chip, Empty, IconBtn, Input, Page, Pill, Segmented, Sheet, T, useWide } from '../ui';
import { useStore } from '../store';
import {Fold} from './CompactTools';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../theme';
import { MAIN, PRIORITIES, STATUS, fmt, isOverdue } from '../data';
import { useHoldDrag, cancelPendingBoardHolds } from '../boardGesture';
import { BoardMotion } from '../boardMotion';
import { committedName } from '../boardInteractions.cjs';

const COL_WIDE = 290;
const COL_NARROW = 272;
const GAP = 12;
const HEADER_H = 44;
const DOUBLE_MS = 350;
const EDGE_X = 70;       // strip scrolls when the finger is this close to its left or right side
const EDGE_TOP = 120;    // page scrolls when the finger is this close to the top or bottom of the window
const EDGE_BOTTOM = 140;
const SPEED = 14;        // px per auto-scroll tick
const AUTO_MS = 30;
const NOSELECT = Platform.OS === 'web' ? { userSelect: 'none' } : {};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const liftShadow = (on) => ({
  shadowColor: '#000',
  shadowOpacity: on ? 0.25 : 0,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: on ? 8 : 0,
});

// ---- drag context -------------------------------------------------------------
// Shared, mutable, not rendered. Holds scroll positions, the pointer, and where each card sat
// when the drag began, so a drop can be worked out without re-rendering on every move.
function newCtx() {
  return {
    scroll: { x: 0, y: 0 },              // strip (x) and page (y) scroll, kept by onScroll
    max: { x: 0, y: 0 },                 // furthest each can scroll, so auto-scroll never overshoots
    size: { cw: 0, vw: 0, ch: 0, vh: 0 }, // strip content/visible width, page content/visible height
    pointer: { x: 0, y: 0, valid: false },
    stripBox: null,                       // { x, w } of the visible strip, measured at the lift
    lists: {},                            // listId -> { ref }
    listTop: {},                          // listId -> window y of the list's top at the lift
    cards: {},                            // taskId -> { ref }
    win: {},                              // taskId -> { y, h, sy }: window y at the lift, page scroll then
    local: {},                            // taskId -> { y, h }: position inside its list, from onLayout
    order: {},                            // listId -> [taskId] in display order
    lastKey: null,
    measure: () => {},
  };
}

function refreshMax(k) {
  k.max.x = Math.max(0, k.size.cw - k.size.vw);
  k.max.y = Math.max(0, k.size.ch - k.size.vh);
}

// Which slot a card would take in a list if dropped at window height py.
function slotFor(k, listId, py, excludeId) {
  const ids = (k.order[listId] || []).filter((id) => id !== excludeId);
  for (let i = 0; i < ids.length; i++) {
    const w = k.win[ids[i]];
    if (!w) continue;
    const top = w.y - (k.scroll.y - w.sy); // page scroll since the lift moves everything up
    if (py < top + w.h / 2) return { index: i, before: ids[i] };
  }
  return { index: ids.length, before: null };
}

export default function Board({ openTask }) {
  const { c } = useTheme();
  const wide = useWide();
  const { s, addBoard, workspace, togglePowerUp, setBoardView, runCommand } = useStore();
  const project=workspace.projects.find(p=>p.id===workspace.selectedId);
  const [boardId, setBoardId] = useState(MAIN);
  const [q, setQ] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [managing, setManaging] = useState(false);
  const [addingList, setAddingList] = useState(false);
  const [drag, setDrag] = useState(null); // { kind: 'card'|'list', id, from, to, before? }
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
  const needle = q.trim().toLowerCase();
  const cards = s.tasks.filter(
    (t) =>
      t.board === board.id &&
      (!needle || t.title.toLowerCase().includes(needle)) &&
      (!urgentOnly || PRIORITIES.indexOf(t.priority) >= 2)
  );

  // Refresh the display order for this render (used for drop slots and the insertion line).
  k.order = Object.fromEntries(lists.map((l) => [l.id, cards.filter((t) => t.list === l.id).map((t) => t.id)]));

  // Records where every card and the strip are, at the moment a drag starts.
  k.measure = () => {
    k.win = {};
    Object.keys(k.cards).forEach((id) => {
      const node = k.cards[id].ref.current;
      if (node) node.measure((x, y, w, h, px, py) => { k.win[id] = { y: py, h, sy: k.scroll.y }; });
    });
    k.listTop = {};
    Object.keys(k.lists).forEach((id) => {
      const node = k.lists[id].ref.current;
      if (node) node.measure((x, y, w, h, px, py) => { k.listTop[id] = py; });
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
        }
      }
      const H = Dimensions.get('window').height;
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
  }, [locked]);

  const submitBoard = () => {
    if (!newName.trim()) return;
    const id = addBoard(newName.trim());
    if (!id) return; // keep the form open if validation/persistence rejects the name
    setBoardId(id);
    setNewName('');
    setCreating(false);
  };

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
      subtitle={`${s.project.name} · ${board.name} · ${cards.length} cards · hold or double-tap a board to manage it`}
      scrollRef={pageRef}
      scrollEnabled={!locked}
      scrollProps={pageScrollProps}
      onScroll={(e) => { k.scroll.y = e.nativeEvent.contentOffset.y; }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {boards.map((b) => (
          <BoardChip key={b.id} board={b} active={b.id === board.id} onSelect={() => setBoardId(b.id)} onManage={() => setManaging(true)} />
        ))}
        <IconBtn icon={creating ? 'x' : 'plus'} label={creating ? 'Cancel new board' : 'New board'} onPress={() => setCreating(!creating)} />
        <View style={{ flex: 1, minWidth: 180, maxWidth: 320 }}>
          <Input value={q} onChangeText={setQ} placeholder="Filter cards" />
        </View>
        <Chip label="High and above" active={urgentOnly} onPress={() => setUrgentOnly(!urgentOnly)} />
      </View>

      <Fold title="Board tools" subtitle="Power-Ups, card previews and local board commands">
        <T muted size={12}>Optional features for this board only. GitHub references are links, not authenticated synchronization.</T>
        {[["github","GitHub references"],["calendar","Upcoming dates"],["aging","Card age"],["checklist","Acceptance progress"]].map(([id,label])=><Chip key={id} label={label} active={(project.powerUps?.[board.id]||[]).includes(id)} onPress={()=>togglePowerUp(board.id,id)}/>) }
        <Chip label="Show descriptions on cards" active={project.kanbanViews?.[board.id]?.showDescriptions===true} onPress={()=>setBoardView(board.id,{showDescriptions:project.kanbanViews?.[board.id]?.showDescriptions!==true})}/>
        {(project.automationCommands||[]).filter(c=>c.trigger==='boardButton'&&(!c.boardId||c.boardId===board.id)&&c.enabled).map(c=><Button key={c.id} small variant="secondary" label={`Run: ${c.name}`} onPress={()=>runCommand(c.id,'',board.id)}/>)}
      </Fold>
      {creating ? (
        <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Input value={newName} onChangeText={setNewName} placeholder="Board name, e.g. Design" onSubmitEditing={submitBoard} />
          </View>
          <Button label="Create board" small disabled={!newName.trim()} onPress={submitBoard} />
        </Card>
      ) : null}

      <View ref={stripBoxRef}>
        <ScrollView
          ref={stripRef}
          horizontal
          scrollEnabled={!locked}
          scrollEventThrottle={16}
          nestedScrollEnabled
          onScrollBeginDrag={cancelPendingBoardHolds}
          directionalLockEnabled={Platform.OS === 'ios'}
          onLayout={(e) => { k.size.vw = e.nativeEvent.layout.width; refreshMax(k); }}
          onContentSizeChange={(w) => { k.size.cw = w; refreshMax(k); }}
          onScroll={(e) => { k.scroll.x = e.nativeEvent.contentOffset.x; }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: GAP, paddingBottom: locked ? 320 : 8, alignItems: 'flex-start' }} // extra room below while dragging, so a card isn't clipped by the strip
        >
          <Pressable
            onPress={() => setAddingList(true)}
            accessibilityLabel="Add list to the left"
            style={({ pressed }) => ({
              width: 52, minHeight: 240, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.faint,
              alignItems: 'center', justifyContent: 'center', gap: 10, opacity: pressed ? 0.6 : 1,
            })}
          >
            <Feather name="plus" size={20} color={c.muted} />
            <T size={11} weight="600" muted style={{ transform: [{ rotate: '-90deg' }], width: 80, textAlign: 'center' }}>Add list</T>
          </Pressable>

          {lists.length === 0 ? <Empty>No lists. Use the + on the left to add one.</Empty> : null}
          {lists.map((l, i) => (
            <ListColumn
              key={l.id}
              board={board}
              list={l}
              index={i}
              total={lists.length}
              step={colW + GAP}
              width={colW}
              cards={cards.filter((t) => t.list === l.id)}
              features={project.powerUps?.[board.id]||[]}
              showDescriptions={project.kanbanViews?.[board.id]?.showDescriptions===true}
              totalCards={s.tasks.filter((t) => t.board === board.id && t.list === l.id).length}
              openTask={openTask}
              drag={drag}
              setDrag={setDrag}
              setLock={setLocked}
              k={k}
            />
          ))}
        </ScrollView>
      </View>

      <NewListSheet visible={addingList} onClose={() => setAddingList(false)} boardId={board.id} />
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

function ListColumn({ board, list, index, total, step, width, cards, features, showDescriptions, totalCards, openTask, drag, setDrag, setLock, k }) {
  const { c } = useTheme();
  const { addTask, renameList, moveListTo, deleteList } = useStore();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [nameDraft, setNameDraft] = useState(list.name);
  const nameDraftRef = useRef(list.name);
  const editingRef = useRef(false);
  const titleRef = useRef(null);
  const colRef = useRef(null);
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
    k.lists[list.id] = { ref: colRef };
    return () => {
      delete k.lists[list.id];
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
        if (w) lineY = w.y - top - 6;
      } else if (ids.length) {
        const w = k.win[ids[ids.length - 1]];
        if (w) lineY = w.y + w.h - top + 6;
      } else {
        lineY = HEADER_H;
      }
    }
  }

  return (
    <BoardMotion
      ref={colRef}
      offset={offset}
      shift={drag ? shiftTo : 0}
      style={{
        width,
        backgroundColor: c.surfaceAlt,
        borderRadius: 18,
        padding: 10,
        gap: 10,
        zIndex: lifted || listDragging || cardFromHere ? 6 : 0,
        opacity: lifted ? 0.94 : 1,
        ...liftShadow(lifted),
      }}
    >
      <View
        {...(editing ? {} : panHandlers)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 4, ...NOSELECT }}
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
        <T size={12} muted>{cards.length}</T>
      </View>

      {cards.map((t) => (
        <TaskCard
          key={t.id}
          t={t}
          board={board}
          features={features}
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

      {cards.length === 0 ? <T size={12} muted style={{ textAlign: 'center', padding: 8 }}>No cards</T> : null}

      {cardHere && lineY !== null ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 4, right: 4, top: lineY, height: 3, borderRadius: 2, backgroundColor: c.accent, zIndex: 5 }}
        />
      ) : null}

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
          onPress={() => setConfirmDel(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingVertical: 4, opacity: total <= 1 ? 0.3 : 1 }}
        >
          <Feather name="trash-2" size={13} color={c.muted} />
          <T size={12} muted>Delete list</T>
        </Pressable>
      )}
    </BoardMotion>
  );
}

// ---- task card -----------------------------------------------------------------
// One tap opens the task. Hold and drag moves it, to any list and any position.
// Double-tap the title to edit it in place.

function TaskCard({ t, board, features=[], showDescriptions=false, fromIndex, total, step, openTask, setDrag, setLock, k }) {
  const { c } = useTheme();
  const { updateTask, placeTask } = useStore();
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
    k.cards[t.id] = { ref: cardRef };
    return () => {
      delete k.cards[t.id];
    };
  }, [t.id, k]);

  const { panHandlers, lifted, offset } = useHoldDrag({
    titleRef,
    getScroll: () => k.scroll,
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
      placeTask(t.id, lists[to].id, slot.before);
    },
    onCancel: () => { k.pointer.valid = false; k.lastKey = null; setLock(false); setDrag(null); },
  });

  return (
    <BoardMotion
      offset={offset}
      ref={cardRef}
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
      <Card pad={12} style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: PRIORITY_COLOR[t.priority] }} />
          <View style={{ flex: 1, gap: 4 }}>
            <View ref={titleRef} collapsable={false}>
              {editing ? (
                <Input
                  value={titleDraft}
                  autoFocus
                  onChangeText={(v) => { titleDraftRef.current = v; setTitleDraft(v); }}
                  onSubmitEditing={endTitleEdit}
                  onBlur={endTitleEdit}
                  style={{ backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 2, fontWeight: '600', fontSize: 14 }}
                />
              ) : (
                <T size={14} weight="600" numberOfLines={2}>{t.title}</T>
              )}
            </View>
            <T size={11} muted>{t.id.toUpperCase()} · {t.type} · {t.priority}</T>
          </View>
        </View>
        {showDescriptions && t.description ? <T muted size={12} numberOfLines={3}>{t.description}</T> : null}
        {features.includes('aging')&&t.status!=='Done' ? <T muted size={11}>Updated {Math.max(0,Math.floor((Date.now()-new Date(t.updatedAt||t.createdAt||Date.now()).getTime())/86400000))}d ago</T> : null}
        {features.includes('checklist')&&t.tests?.length ? <T muted size={11}>{t.tests.filter(x=>x.result==='passed').length}/{t.tests.length} checks passed</T> : null}
        {features.includes('github')&&t.githubLinks?.length ? <T muted size={11}>{t.githubLinks.length} GitHub reference{t.githubLinks.length===1?'':'s'}</T> : null}
        {t.labels.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {t.labels.map((l) => (
              <View key={l} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: c.surfaceAlt }}>
                <T size={11} muted>{l}</T>
              </View>
            ))}
          </View>
        ) : null}
        {t.progress > 0 && !t.milestone ? <Bar value={t.progress / 100} height={4} color={STATUS_COLOR.Done} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Avatar name={t.owner} size={22} />
          <T size={12} muted style={{ flex: 1 }} numberOfLines={1}>
            {isOverdue(t) ? 'Overdue · ' : ''}{fmt(t.due)}
          </T>
        </View>
      </Card>
    </BoardMotion>
  );
}

function AddCard({ onAdd }) {
  const [text, setText] = useState('');
  const submit = () => {
    if (!text.trim()) return;
    if (onAdd(text.trim())) setText('');
  };
  return <Input value={text} onChangeText={setText} placeholder="Add a card" onSubmitEditing={submit} />;
}

// ---- add list -----------------------------------------------------------------

function NewListSheet({ visible, onClose, boardId }) {
  const { addList } = useStore();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Backlog');
  const submit = () => {
    if (!name.trim()) return;
    if (addList(boardId, name.trim(), status)) {
      setName('');
      onClose();
    }
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="New list"
      footer={<Button label="Add list to the left" icon="plus" disabled={!name.trim()} onPress={submit} />}
    >
      <View style={{ gap: 8 }}>
        <T size={11} weight="600" muted upper>List name</T>
        <Input value={name} onChangeText={setName} placeholder="e.g. Blocked" onSubmitEditing={submit} />
      </View>
      <View style={{ gap: 8 }}>
        <T size={11} weight="600" muted upper>Counts as</T>
        <Segmented fill options={STATUS} value={status} onChange={setStatus} />
        <T size={12} muted>The status decides how cards in this list count in progress, overview and reports.</T>
      </View>
    </Sheet>
  );
}

// Rename without re-normalizing the field on every keystroke (the store trims names).
// The original manager row and its spacing are otherwise unchanged.
function BoardNameEditor({ board, onRename }) {
  const [draft, setDraft] = useState(board.name);
  const draftRef = useRef(board.name);
  const committedRef = useRef(false);
  useEffect(() => { draftRef.current = board.name; setDraft(board.name); }, [board.name]);
  const commit = () => {
    if (board.id === MAIN || committedRef.current) return;
    committedRef.current = true;
    const name = committedName(draftRef.current, board.name, 80);
    if (name !== board.name) onRename(board.id, name);
  };
  return <Input
    value={draft}
    editable={board.id !== MAIN}
    onChangeText={(value) => { committedRef.current = false; draftRef.current = value; setDraft(value); }}
    onSubmitEditing={commit}
    onBlur={commit}
    style={{ flex: 1, fontWeight: '600', fontSize: 15 }}
  />;
}

// ---- boards manager -----------------------------------------------------------

function BoardsManager({ visible, onClose }) {
  const { c } = useTheme();
  const { s, renameBoard, archiveBoard, deleteBoard } = useStore();
  const [pending, setPending] = useState(null);

  const close = () => {
    setPending(null);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={close} title="Boards">
      <T size={13} muted>
        Boards group the tasks in this project. Archive hides a board from the switcher but keeps its work. Delete moves its tasks to Main. Main is protected.
      </T>
      {s.boards.map((b) => {
        const count = s.tasks.filter((t) => t.board === b.id).length;
        const isMain = b.id === MAIN;
        return (
          <Card key={b.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BoardNameEditor board={b} onRename={renameBoard} />
              {b.archived ? <Pill label="Archived" color={c.muted} /> : null}
            </View>
            <T size={12} muted>{count} task{count === 1 ? '' : 's'} · {b.lists.length} list{b.lists.length === 1 ? '' : 's'}</T>

            {isMain ? (
              <T size={12} muted>Protected: Main can't be archived or deleted.</T>
            ) : pending === b.id ? (
              <View style={{ gap: 10 }}>
                <T size={13} weight="500">Delete "{b.name}" and move its {count} task{count === 1 ? '' : 's'} to Main?</T>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Button label="Delete board" small variant="danger" onPress={() => { deleteBoard(b.id); setPending(null); }} />
                  <Button label="Cancel" small variant="ghost" onPress={() => setPending(null)} />
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Button label={b.archived ? 'Restore' : 'Archive'} small variant="secondary" onPress={() => archiveBoard(b.id, !b.archived)} />
                <Button label="Delete" small variant="ghost" onPress={() => setPending(b.id)} />
              </View>
            )}
          </Card>
        );
      })}
    </Sheet>
  );
}
