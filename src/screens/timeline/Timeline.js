// /src/screens/timeline/Timeline.js
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { ActionMenu, Button, Card, Chip, Page, Segmented, Sheet, T, useWide } from '../../ui/ui';
import { useStore, useScreenActive } from '../../store/store';
import { useHeaderActions } from '../../components/shell/HeaderActions';
import { useTheme, STATUS_COLOR, PRIORITY_COLOR } from '../../ui/theme/theme';
import { TODAY, addDays, daysBetween, fmt } from '../../store/data';
import { useHoldDrag } from '../../gestures/gesture';
import { GestureArea } from '../../gestures/gestureSurface';
import TimelineZoomControls from './TimelineZoomControls';
import TimelineScrollView from '../../gestures/TimelineScrollView';
import TimelineGestureHost from '../../gestures/TimelineGestureHost';
import { useTimelinePinch, TimelinePinchArea, TimelinePinchCanvas, TimelinePinchLabel } from '../../gestures/TimelinePinch';
const { createZoomQueue } = require('../../timeline/zoomQueue.cjs');
const timelineZoom = require('../../timeline/timelineZoom.cjs');
const windowing = require('../../timeline/timelineWindow.cjs');
const { clipBar } = windowing;
const display = require('../../timeline/timelineDisplay.cjs');
const viewport = require('../../timeline/timelineViewport.cjs');
const dragFollow = require('../../gestures/dragFollow.cjs');
const timelineEdit = require('../../timeline/timelineEdit.cjs');
const { roundPath, distToPath } = require('../../timeline/timelineGeometry.cjs');
const gantt = require('../../timeline/gantt.cjs');
const planning = require('../../domain/planning.cjs');
const { refreshMax } = require('../../gestures/scrollLimits.cjs');
import { diagnosticMonitor } from '../../diagnostics/monitor';


// NP533_COLORED_DEPENDENCIES: stable, distinct dependency colors; no routing or gesture changes.
const NP533_DEP_COLORS = ['#E0512D', '#3B6FE0', '#2F9E6B', '#D89614', '#8E5CD6', '#14A3B8', '#E6399B'];
function np533DependencyColor(link) {
  const id = String(link.key || String(link.pid) + '>' + String(link.tid));
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (Math.imul(hash, 31) + id.charCodeAt(i)) >>> 0;
  return NP533_DEP_COLORS[hash % NP533_DEP_COLORS.length];
}

const ZOOM = { Days: 34, Weeks: 14, Months: 6 };
// Default minimum coverage; the actual span extends across every scheduled task.
const SPAN = display.BASE_DAYS;
const ROW = 54;
// Rows are continuously scrollable; native SVG/gesture nodes are viewport-virtualized.
const HEAD = 52;
// The taller bar keeps the same row centre, so dependency anchors do not move.
const BAR_TOP = 11;
const BAR_H = 32;
const CHAR = 6.6; // rough width of one 11pt character, used to decide if a title fits
const HOLD_MS = 300;
const HANDLE = 30;     // touch size of the link handle at the end of each bar
const EDGE_X = 60;     // chart scrolls when the finger is this close to its left or right side
const EDGE_TOP = 120;  // page scrolls when a link is dragged this close to the top or bottom of the window
const EDGE_BOTTOM = 140;
const SPEED = 14;
const AUTO_MS = 30;
const BEAT_LIMIT_MS = 1500; // a live drag beats every frame; no beat for this long means the drag is gone
const LINK_COLORS = ['#E0512D', '#3B6FE0', '#2F9E6B', '#D89614', '#8E5CD6', '#14A3B8', '#E6399B'];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// New start/due for a move or an edge resize (a resize is a duration change: see timelineEdit.cjs).
const calc = (mode, base, days) => timelineEdit.apply(mode, base, days, addDays);

// Horizontal space a row's bar takes (grips, link dot and the title when it sits outside), so lines can keep clear of it.
function extent(t, e, w, x) {
  if (t.milestone) {
    const l = x(e.due) + w / 2 - 8;
    return [l - 6, l + 56 + t.title.length * CHAR];
  }
  const l = x(e.start) + 2;
  const width = Math.max(w - 4, (daysBetween(e.start, e.due) + 1) * w - 4);
  return [l - 12, l + width + 36];
}

// One task bar. Hold the body and drag to move it, hold a left or right edge and drag to change the start or
// due date, hold the dot after the bar and drag onto another row to make that task wait for this one.
// A quick tap on the body opens the task; a swipe still scrolls the chart.
const TaskBar = memo(function TaskBar({ pinch, t, start, due, origin, w, span, paintLeft, paintWidth, rowTop, target, critical, dragging, k, onPreview, onCommit, onOpen, onLink }) {
  const { c } = useTheme();
  const color = STATUS_COLOR[t.status];
  const live = useRef({});
  live.current = { t, start, due, w, onPreview, onCommit, onOpen, onLink };
  const baseRef = useRef(null); // start and due when the lift happened (live.current is replaced on every render)
  const pinchBlocked = () => k.pinching || Date.now() < (k.suppressUntil || 0);

  const shape = (mode) => ({
    axis: 'x',
    holdMs: HOLD_MS,
    getScroll: () => k.scroll,
    onBeat: () => { k.beat = Date.now(); },
    onLift: () => {
      if (pinchBlocked()) return;
      const L = live.current;
      baseRef.current = { start: L.start, due: L.due };
      k.beat = Date.now();
      k.measure();
      // Mark the lifted task without changing its dates.
      L.onPreview(L.t.id, L.start, L.due);
    },
    onMove: (cx, cy, px, py) => {
      if (pinchBlocked()) return;
      k.pointer = { x: px, y: py, valid: true };
      const L = live.current;
      const base = baseRef.current;
      if (!base) return;
      const p = calc(mode, base, Math.round(cx / L.w));
      // Every drag previews its dates on every platform, so dependency lines stay attached to the bar while it moves.
      L.onPreview(L.t.id, p.start, p.due);
    },
    onCancel: () => { k.pointer.valid = false; live.current.onPreview(null); },
    onDrop: (cx) => {
      if (pinchBlocked()) return;
      k.pointer = { x: 0, y: 0, valid: false };
      const L = live.current;
      L.onPreview(null);
      const base = baseRef.current;
      if (!base) return;
      const p = calc(mode, base, Math.round(cx / L.w));
      if (p.start !== base.start || p.due !== base.due) L.onCommit(L.t.id, p.start, p.due, mode);
    },
  });

  const mv = useHoldDrag({ ...shape('move'), onTap: () => { if (!pinchBlocked()) live.current.onOpen(live.current.t.id); } });
  const st = useHoldDrag(shape('start'));
  const du = useHoldDrag(shape('due'));
  const ln = useHoldDrag({
    axis: 'xy',
    holdMs: HOLD_MS,
    getScroll: () => k.scroll,
    onBeat: () => { k.beat = Date.now(); },
    onLift: () => {
      if (pinchBlocked()) return;
      k.beat = Date.now();
      k.measure();
      live.current.onLink('move', live.current.t.id, 0, 0);
    },
    onMove: (cx, cy, px, py) => {
      if (pinchBlocked()) return;
      k.pointer = { x: px, y: py, valid: true };
      live.current.onLink('move', live.current.t.id, cx, cy);
    },
    onCancel: () => { k.pointer.valid = false; live.current.onLink('cancel'); },
    onDrop: (cx, cy) => {
      if (pinchBlocked()) return;
      k.pointer = { x: 0, y: 0, valid: false };
      live.current.onLink('drop', live.current.t.id, cx, cy);
    },
  });

  const hot = mv.lifted || st.lifted || du.lifted;
  // The bar being dragged must stay mounted and whole while the chart scrolls away from where it started.
  // Clipping it to the drawing window (or dropping it) used to destroy the gesture mid-drag, so the release
  // was never seen and the auto-scroll ran on forever.
  const whole = dragFollow.keepWhole(dragging, hot || ln.lifted);
  const dot = (
    <TimelinePinchLabel pinch={pinch} center><View
      style={{
        width: ln.lifted ? 18 : 11, height: ln.lifted ? 18 : 11, borderRadius: 9, backgroundColor: ln.lifted ? c.accent : color,
        borderWidth: 2, borderColor: c.surface,
      }}
    /></TimelinePinchLabel>
  );

  if (t.milestone) {
    const left = daysBetween(origin, due) * w + w / 2 - 8;
    // Offscreen milestones must not create native views at enormous coordinates.
    if (!whole && (left < paintLeft - 56 || left > paintLeft + paintWidth + 8)) return null;
    return (
      <>
        <GestureArea drag={mv} accessibilityRole="button" accessibilityLabel={`Open task ${t.title}`} onAccessibilityTap={() => onOpen(t.id)}
          style={{
            position: 'absolute', left, top: rowTop + 19, width: 16, height: 16, zIndex: hot ? 5 : 1,
          }}
        >
          <TimelinePinchLabel pinch={pinch} center><View
            style={{
              width: 16, height: 16, transform: [{ rotate: '45deg' }], backgroundColor: c.accent, borderRadius: 3,
              borderWidth: target || hot ? 2 : 0, borderColor: c.ink,
            }}
          /></TimelinePinchLabel>
        </GestureArea>
        <GestureArea drag={ln}
          style={{ position: 'absolute', left: left + 18, top: rowTop + 27 - HANDLE / 2, width: HANDLE, height: HANDLE, alignItems: 'center', justifyContent: 'center', zIndex: 3 }}
        >
          {dot}
        </GestureArea>
        <TimelinePinchLabel pinch={pinch} style={{ position: 'absolute', left: left + 52, top: rowTop + 16, width: 200 }}><T size={11} weight="600" numberOfLines={1} pointerEvents="none">{t.title}</T></TimelinePinchLabel>
      </>
    );
  }

  // Clip bars to the visible 56-day window, not their entire (possibly multi-year)
  // duration. Move/resize calculations continue using the original ISO dates.
  const actualLeft = daysBetween(origin, start) * w + 2;
  const actualRight = daysBetween(origin, due) * w + w - 2;
  const clipped = clipBar(actualLeft, actualRight, span * w);
  if (!clipped) return null;
  // The bar is rendered only within the horizontal drawing viewport. Original
  // start/due dates remain untouched, including multi-year tasks.
  const left = whole ? clipped.left : Math.max(clipped.left, paintLeft);
  const right = whole ? clipped.left + clipped.width : Math.min(clipped.left + clipped.width, paintLeft + paintWidth);
  const width = right - left;
  if (width <= 0) return null;
  const startVisible = clipped.startVisible && (whole || clipped.left >= paintLeft);
  const dueVisible = clipped.dueVisible && (whole || clipped.left + clipped.width <= paintLeft + paintWidth);
  const done = t.status === 'Done' ? 100 : t.progress;
  const edge = Math.min(24, Math.floor(width / 3));

  return (
    <View style={{ position: 'absolute', left, top: rowTop + BAR_TOP, width, height: BAR_H, zIndex: hot || ln.lifted ? 5 : 1 }}>
      <GestureArea drag={mv} accessibilityRole="button" accessibilityLabel={`Open task ${t.title}`} onAccessibilityTap={() => onOpen(t.id)}
        style={{
          flex: 1, borderRadius: 8, backgroundColor: c.surface, borderWidth: hot || target || critical ? 2 : 0,
          borderLeftWidth: 3, borderColor: target ? c.accent : critical ? PRIORITY_COLOR.Critical : color, overflow: 'hidden', justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: color + '26' }} pointerEvents="none" />
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${done}%`, backgroundColor: color + '45' }} pointerEvents="none" />
        {/* The title always stays inside the pill; when the bar is short it is cut with an ellipsis */}
        <TimelinePinchLabel pinch={pinch} style={{ paddingHorizontal: 14 }}><T size={12} weight="500" numberOfLines={1} pointerEvents="none">{t.title}</T></TimelinePinchLabel>
        {/* Grips show where to hold to resize */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 6, top: 8, width: 3, height: 14, borderRadius: 2, backgroundColor: color, opacity: hot ? 1 : 0.7 }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 6, top: 8, width: 3, height: 14, borderRadius: 2, backgroundColor: color, opacity: hot ? 1 : 0.7 }} />
      </GestureArea>

      {/* Resize zones: hold the left edge to change start, the right edge to change due date */}
      {startVisible ? <GestureArea drag={st} style={{ position: 'absolute', left: -10, top: 0, bottom: 0, width: edge + 10, ...(Platform.OS === 'web' ? { cursor: 'ew-resize' } : {}) }} /> : null}
      {dueVisible ? <GestureArea drag={du} style={{ position: 'absolute', left: width - edge, top: 0, bottom: 0, width: edge + 2, ...(Platform.OS === 'web' ? { cursor: 'ew-resize' } : {}) }} /> : null}

      {/* Link handle: hold and drag onto another row to add a dependency */}
      {dueVisible ? <GestureArea drag={ln}
        style={{ position: 'absolute', left: width + 2, top: (BAR_H - HANDLE) / 2, width: HANDLE, height: HANDLE, alignItems: 'center', justifyContent: 'center' }}
      >
        {dot}
      </GestureArea> : null}

    </View>
  );
});

export default function Timeline({ openTask }) {
  const { c } = useTheme();
  const wide = useWide();
  const screenActive = useScreenActive();
  const { s, updateTask, scheduleAfter, scheduleSample } = useStore();
  const [zoom, setZoom] = useState('Days');
  const [zoomFactor, setZoomFactor] = useState(1);
  const [pinching, setPinching] = useState(false);
  const [pinchWindow, setPinchWindow] = useState(null);
  const [showCritical, setShowCritical] = useState(false);
  const [collapsed, setCollapsed] = useState([]); // parent tasks folded in the hierarchy list
  const [drag, setDrag] = useState(null); // temporary date edits
  const [link, setLink] = useState(null); // temporary dependency gesture
  const [notice, setNotice] = useState('');
  const [taskPanel, setTaskPanel] = useState(null);
  const [showItems, setShowItems] = useState(wide);
  const [pick, setPick] = useState(null);
  const [viewportW, setViewportW] = useState(0);
  const [scrollXPaint, setScrollXPaint] = useState(0);
  const paintOffsetRef = useRef(0);
  paintOffsetRef.current = scrollXPaint;
  const [paint, setPaint] = useState({ first: 0, last: display.INITIAL_ROWS });
  const gridRef = useRef(null);
  const chartRef = useRef(null);
  // One scroll authority: the chart. The pinned calendar follows its offset on the
  // native animation driver instead of a separate, lagging imperative scroll view.
  const horizontalOffset = useRef(new Animated.Value(0)).current;
  const calendarShift = useMemo(() => Animated.multiply(horizontalOffset, -1), [horizontalOffset]);
  const pageRef = useRef(null);
  const allScheduled = useMemo(() => windowing.scheduled(s.tasks), [s.tasks]);
  const unscheduled = useMemo(() => s.tasks.filter((t) => !t.start && !t.due), [s.tasks]);
  const bounds = useMemo(() => display.rangeForTasks(allScheduled, TODAY, addDays, daysBetween), [allScheduled]);
  const START = bounds.start;
  const END = bounds.end;
  const span = bounds.span;
  const w = display.dayWidth(ZOOM[zoom] * zoomFactor, span);
  const zoomMode = zoomFactor === 1 ? zoom : w >= 28 ? 'Days' : w >= 10 ? 'Weeks' : 'Months';
  const labelW = wide ? 264 : 160;
  const rows = allScheduled; // no row pager and no disappearing out-of-window tasks
  const rowIndex = useMemo(() => Object.fromEntries(rows.map((t, i) => [t.id, i])), [rows]);
  const tasksById = useMemo(() => new Map(rows.map((t) => [t.id, t])), [rows]);
  // Schedule analysis (gantt.cjs): critical path, dependencies that start too early, bad date ranges, parent summaries.
  const crit = useMemo(() => { try { return gantt.criticalPath(rows); } catch (e) { return { error: e.message }; } }, [rows]);
  const critIds = useMemo(() => new Set(crit.criticalIds || []), [crit]);
  const critEdges = useMemo(() => new Set(crit.criticalEdges || []), [crit]);
  const conflicts = useMemo(() => gantt.dependencyConflicts(rows), [rows]);
  const invalid = useMemo(() => gantt.invalidSchedules(s.tasks), [s.tasks]);
  const rollups = useMemo(() => { try { return planning.progressRollups(s.tasks); } catch { return null; } }, [s.tasks]);
  const summaries = useMemo(() => gantt.hierarchySummaries(s.tasks, rollups), [s.tasks, rollups]);
  const hierarchy = useMemo(() => gantt.hierarchyRows(s.tasks, collapsed), [s.tasks, collapsed]);
  const hasParents = summaries.size > 0;
  const isSample = s.project && s.project.id === 'sample-workspace';
  const gridW = span * w;
  const gridH = rows.length * ROW;
  const ordinaryViewport = viewport.horizontalWindow(gridW, viewportW || Dimensions.get('window').width, scrollXPaint);
  const drawViewport = pinchWindow ? { left: Math.min(pinchWindow.left, gridW), width: Math.max(0, Math.min(pinchWindow.right, gridW) - Math.min(pinchWindow.left, gridW)) } : ordinaryViewport;
  const paintLeft = drawViewport.left;
  const paintWidth = drawViewport.width;
  const dayTicks = useMemo(() => display.ticks(span, zoomMode, w), [span, zoomMode, w]);
  const calendar = useMemo(() => display.calendarLabels(START, dayTicks), [START, dayTicks]);
  const visibleTicks = dayTicks.filter((i) => viewport.intersects(i * w, i * w + 80, paintLeft, paintWidth));
  // NP533_WEEKENDS: shade only viewport-visible weekend columns in Days zoom. No full-canvas nodes.
  const weekendDays = [];
  if (zoomMode === 'Days' && w > 0) {
    const [year, month, day] = START.split('-').map(Number);
    const startDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const first = Math.max(0, Math.floor(paintLeft / w));
    const last = Math.min(span - 1, Math.ceil((paintLeft + paintWidth) / w));
    for (let i = first; i <= last; i++) if ((startDay + i) % 7 === 0 || (startDay + i) % 7 === 6) weekendDays.push(i);
  }
  const x = (iso) => daysBetween(START, iso) * w;
  const firstPaint = Math.min(rows.length, paint.first);
  const lastPaint = Math.min(rows.length, Math.max(paint.last, firstPaint));
  const paintTop = firstPaint * ROW;
  const paintH = (lastPaint - firstPaint) * ROW;
  const paintedRows = rows.slice(firstPaint, lastPaint);
  const eff = (t) => (drag && drag.id === t.id ? { start: drag.start, due: drag.due } : { start: t.start, due: t.due });
  const active = !!drag || !!link;
  // Pre-filter before TaskBar mounts four native gesture recognizers.
  // Rows remain in the chart; only offscreen *view instances* are omitted.
  const drawnBars = paintedRows.map((t, i) => ({ t, i })).filter(({ t }) => {
    // Keep the active native target alive while viewport offsets rebase.
    // Removing a touched gesture view mid-stream can confuse RN touch tracking.
    if ((drag && drag.id === t.id) || (link && link.from === t.id)) return true;
    const e = eff(t);
    const left = daysBetween(START, e.start) * w;
    const right = daysBetween(START, e.due) * w + w;
    return viewport.intersects(left, right, paintLeft, paintWidth, HANDLE + 20);
  });

  const kRef = useRef(null);
  if (!kRef.current) {
    kRef.current = {
      scroll: { x: 0, y: 0 },               // chart (x) and page (y) scroll, kept by onScroll
      max: { x: 0, y: 0 },
      size: { cw: 0, vw: 0, ch: 0, vh: 0 },
      pointer: { x: 0, y: 0, valid: false },
      beat: 0,                              // last heartbeat of a live drag (ms); stale = the drag is gone
      box: null,                            // { x, w } of the visible chart, measured at the lift
      measure: () => {},
      pinching: false, suppressUntil: 0,
    };
  }
  const k = kRef.current;
  const pendingZoom = useRef(null);
  const zoomQueue = useRef(null);
  const zoomCommit = useRef(null);
  if (!zoomQueue.current) zoomQueue.current = createZoomQueue(fn => requestAnimationFrame(fn), id => cancelAnimationFrame(id), value => zoomCommit.current(value));
  useEffect(() => () => zoomQueue.current.clear(), []);
  const pinch = useTimelinePinch({
    width: w, span, viewportWidth: viewportW, enabled: screenActive && !active && viewportW > 0,
    getScroll: () => k.scroll.x,
    onStart: () => {
      zoomQueue.current.clear();
      diagnosticMonitor.recordAction('timeline pinch started');
      k.pinching = true; k.pointer.valid = false;
      setPinching(true); setPick(null);
      if (Platform.OS === 'web') setPinchWindow(timelineZoom.previewWindow(gridW, k.scroll.x, viewportW));
    },
    onCommit: (width, scroll) => {
      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(scroll)) return;
      diagnosticMonitor.recordAction(`timeline zoom committed: ${width.toFixed(3)}px/day`);
      pendingZoom.current = { scroll, canvasWidth: width * span };
      if (Math.abs(width - w) < 0.000001) settleZoom(true);
      else setZoomFactor(width / ZOOM[zoom]);
    },
    onEnd: () => { k.pinching = false; k.suppressUntil = Date.now() + 350; setPinching(false); setPinchWindow(null); },
  });
  function chooseZoom(value) {
    if (!Object.hasOwn(ZOOM, value)) return;
    zoomQueue.current.clear();
    const width = display.dayWidth(ZOOM[value], span);
    const scroll = timelineZoom.rebaseZoom(w, width, k.scroll.x, span, viewportW);
    pendingZoom.current = { scroll, canvasWidth: width * span };
    // Rebase drawing and calendar immediately; native content-size acknowledgement follows.
    k.scroll.x = scroll;
    horizontalOffset.setValue(scroll);
    setScrollXPaint(scroll); setPinchWindow(null); pinch.reset();
    setZoom(value); setZoomFactor(1);
    if (Math.abs(width - w) < 0.000001) settleZoom(true);
    diagnosticMonitor.recordAction(`timeline preset: ${value}`);
  }
  const zoomHeader = useMemo(() => ({kind:'zoom', value:zoomFactor === 1 ? zoom : 'custom', onChange:chooseZoom}), [zoom, zoomFactor, w, span, viewportW]);
  useHeaderActions('timeline', zoomHeader, screenActive);
  zoomCommit.current = result => {
    pendingZoom.current = { scroll: result.scroll, canvasWidth: result.width * span, started: result.started };
    if (Math.abs(result.width - w) < 0.000001) settleZoom(true);
    else setZoomFactor(result.width / ZOOM[zoom]);
    diagnosticMonitor.recordAction(`timeline zoom handler-to-rAF ${Date.now() - result.started}ms`);
  };
  function zoomBy(factor) {
    const base = zoomQueue.current.pending || { width: w, scroll: k.scroll.x };
    const focal = viewportW / 2;
    const result = timelineZoom.pinchZoom(base.width, factor, focal, focal, base.scroll, span, viewportW);
    const started = Date.now();
    pinch.previewTo?.(result.width, result.scroll);
    zoomQueue.current.push({ ...result, started });
    diagnosticMonitor.recordAction(`timeline zoom input ${factor}`);
  }
  function settleZoom(contentReady = false, contentWidth) {
    const pending = pendingZoom.current;
    if (!pending || Math.abs(pending.canvasWidth - gridW) > 1) return;
    if (Number.isFinite(contentWidth) && Math.abs(contentWidth - pending.canvasWidth) > 1) return;
    const offset = clamp(pending.scroll, 0, Math.max(0, gridW - viewportW));
    k.scroll.x = offset;
    horizontalOffset.setValue(offset);
    chartRef.current?.scrollTo({ x: offset, animated: false });
    setScrollXPaint(offset); setPinchWindow(null); pinch.reset();
    if (pending.started) { diagnosticMonitor.recordAction(`timeline zoom handler-to-layout ${Date.now() - pending.started}ms`); delete pending.started; }
    if (contentReady) pendingZoom.current = null;
  }
  useLayoutEffect(() => { settleZoom(); }, [w, viewportW]);
  // Keep the Animated event mapping attached throughout a pan. Replacing the
  // event handler every time the virtualized drawing window changes can stall
  // the native animation driver during fast Android swipes.
  const horizontalScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { x: horizontalOffset } } }],
    { useNativeDriver: Platform.OS !== 'web', listener: (e) => {
      const next = e.nativeEvent.contentOffset.x;
      k.scroll.x = next;
      // React redraw is only for virtualized bars/paths, not the pinned calendar.
      if (Math.abs(next - paintOffsetRef.current) > 160) setScrollXPaint(next);
    } }
  ), [horizontalOffset, k]);
  const boxRef = useRef(null);
  k.size.cw = gridW;
  refreshMax(k);
  k.measure = () => {
    const n = boxRef.current;
    if (n) n.measure((x0, y0, bw, bh, px) => { k.box = { x: px, w: bw }; });
  };

  // A single vertical scroll contains every row. Only near-viewport rows mount
  // bars and links, preventing the all-at-once gesture/SVG crash on Android.
  const gridOrigin = useRef(null);
  const refreshPaint = () => {
    const apply = () => {
      const next = display.paintedRange(rows.length, gridOrigin.current - k.scroll.y, k.size.vh || Dimensions.get('window').height, ROW);
      setPaint(prev => prev.first === next.first && prev.last === next.last ? prev : next);
    };
    if (gridOrigin.current !== null) { apply(); return; }
    if (!gridRef.current || !pageRef.current) return;
    gridRef.current.measureInWindow((_x, gridY) => {
      pageRef.current?.measureInWindow((_px, pageY) => {
        if (!Number.isFinite(gridY) || !Number.isFinite(pageY)) return;
        gridOrigin.current = gridY - pageY + k.scroll.y;
        apply();
      });
    });
  };
  // Jump to where the schedule begins (gantt.calendarDomain starts a few days before the first scheduled task).
  const goFirst = () => {
    if (!rows.length) return;
    const next = clamp(x(gantt.dateAt(gantt.calendarDomain(rows, TODAY).from)), 0, Math.max(0, gridW - viewportW));
    chartRef.current?.scrollTo({ x: next, animated: true });
    k.scroll.x = next;
    setScrollXPaint((prev) => Math.abs(prev - next) < 1 ? prev : next);
  };
  const goToday = (animated = true) => {
    const center = x(TODAY) + w / 2 - viewportW / 2;
    const next = clamp(center, 0, Math.max(0, gridW - viewportW));
    chartRef.current?.scrollTo({ x: next, animated });
    k.scroll.x = next;
    setScrollXPaint((prev) => Math.abs(prev - next) < 1 ? prev : next);
  };
  // Record non-sensitive native drawing dimensions so unexpected process restarts
  // can be compared against the actual renderer load in Settings diagnostics.
  const loggedViewport = useRef(false);
  useEffect(() => {
    if (!viewportW || loggedViewport.current) return;
    loggedViewport.current = true;
    diagnosticMonitor.recordAction(`timeline canvas ${Math.round(gridW)}px, viewport ${Math.round(viewportW)}px, scheduled ${rows.length}, first render ${drawnBars.length} bars`);
  }, [viewportW, gridW, rows.length, drawnBars.length]);
  // Focus the first task active today once, after the chart has a measured viewport.
  // Never override user scrolling, task drag or a later return to the retained tab.
  const firstFocus = useRef(false);
  useEffect(() => {
    if (!screenActive || !viewportW || !rows.length || firstFocus.current) return undefined;
    const todayTasks = rows.map((task,index)=>({task,index})).filter(({task})=>
      (task.start || task.due) <= TODAY && (task.due || task.start) >= TODAY);
    const upcoming = rows.map((task,index)=>({task,index})).filter(({task})=>(task.start||task.due) >= TODAY);
    const selected = todayTasks[0] || upcoming.sort((a,b)=>(a.task.start||a.task.due).localeCompare(b.task.start||b.task.due))[0] || {task:rows[0],index:0};
    const anchor = (selected.task.start && selected.task.start > TODAY ? selected.task.start : TODAY);
    const xNext = clamp(x(anchor) - viewportW/3, 0, Math.max(0,gridW-viewportW));
    const frame = requestAnimationFrame(()=>{
      firstFocus.current = true;
      chartRef.current?.scrollTo({x:xNext,animated:false});
      k.scroll.x=xNext;
      setScrollXPaint(xNext);
      if(selected.index>0){
        gridRef.current?.measureInWindow((_gx,gy)=>{
          pageRef.current?.measureInWindow((_px,py)=>{
            const yNext=Math.max(0,k.scroll.y + (gy-py) + selected.index*ROW - 120);
            pageRef.current?.scrollTo({y:yNext,animated:false});
            k.scroll.y=yNext;
          });
        });
      }
    });
    return ()=>cancelAnimationFrame(frame);
  },[screenActive,viewportW,rows,gridW,w,START]);


  // While something is held, scroll the chart near its sides, and the page near the window's top or bottom for a link.
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      // Safety net: the dragged bar beats once per frame. If the beats stop (its view was removed or the release
      // was lost) nothing is dragging any more: drop the half-finished drag so the chart stops scrolling.
      if (dragFollow.isStale(Date.now(), k.beat, BEAT_LIMIT_MS)) {
        k.pointer = { x: 0, y: 0, valid: false };
        setDrag(null);
        setLink(null);
        return;
      }
      const p = k.pointer;
      if (!p.valid) return;
      if (k.box) {
        let d = 0;
        if (p.x < k.box.x + EDGE_X) d = -SPEED;
        else if (p.x > k.box.x + k.box.w - EDGE_X) d = SPEED;
        const nx = clamp(k.scroll.x + d, 0, k.max.x);
        if (d && nx !== k.scroll.x && chartRef.current) {
          k.scroll.x = nx;
          setScrollXPaint((prev) => Math.abs(prev - nx) < 64 ? prev : nx);
          chartRef.current.scrollTo({ x: nx, animated: false });
        }
      }
      if (link) {
        const H = Dimensions.get('window').height;
        let dy = 0;
        if (p.y < EDGE_TOP) dy = -SPEED;
        else if (p.y > H - EDGE_BOTTOM) dy = SPEED;
        const ny = clamp(k.scroll.y + dy, 0, k.max.y);
        if (dy && ny !== k.scroll.y && pageRef.current) {
          k.scroll.y = ny;
          pageRef.current.scrollTo({ y: ny, animated: false });
        }
      }
    }, AUTO_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, !!link]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(id);
  }, [notice]);

  const onPreview = (id, start, due) =>
    setDrag((prev) => {
      if (!id) return null;
      return prev && prev.id === id && prev.start === start && prev.due === due ? prev : { id, start, due };
    });
  const onCommit = (id, start, due, mode) => {
    const t = s.tasks.find((x2) => x2.id === id);
    if (!t) return;
    const label = timelineEdit.commitLabel(mode, t.title, { start: t.start, due: t.due }, { start, due }, { fmt, daysBetween });
    updateTask(id, { start, due }, label);
  };

  // The task in the row the finger is over while a link is dragged (never the one it started from).
  const targetAt = (fromId, cy) => {
    const i = rowIndex[fromId];
    if (i === undefined) return null;
    const r = rows[Math.floor((i * ROW + ROW / 2 + cy) / ROW)];
    return r && r.id !== fromId ? r : null;
  };
  // True when `fromId` already waits (directly or through others) for `goalId`; linking then would loop.
  const reaches = (fromId, goalId) => {
    const byId = new Map(s.tasks.map(t => [t.id,t]));
    const seen = new Set(), pending = [fromId];
    while (pending.length) {
      const id = pending.pop();
      if (id === goalId) return true;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const dep of byId.get(id)?.dependsOn || []) pending.push(dep);
    }
    return false;
  };
  const onLink = (kind, id, cx, cy) => {
    if (kind === 'cancel') { setLink(null); return; }
    if (kind === 'drop') {
      const tgt = targetAt(id, cy);
      setLink(null);
      if (!tgt) return;
      const src = s.tasks.find((q) => q.id === id);
      if (!src) return;
      if (tgt.dependsOn.includes(id)) setNotice(`"${tgt.title}" already waits for "${src.title}"`);
      else if (reaches(id, tgt.id)) setNotice(`Can't link: "${src.title}" already depends on "${tgt.title}"`);
      else updateTask(tgt.id, { dependsOn: [...tgt.dependsOn, id] }, `Added dependency: "${tgt.title}" waits for "${src.title}"`);
      return;
    }
    setLink((prev) => (prev && prev.from === id && prev.cx === cx && prev.cy === cy ? prev : { from: id, cx, cy }));
  };
  // TaskBar is memoised, so it gets callbacks whose identity never changes but which always call the latest ones above.
  // Without this every drag step re-rendered every drawn bar (four gesture recognizers each).
  const latest = useRef({});
  latest.current = { onPreview, onCommit, onLink };
  const bar = useMemo(() => ({
    onPreview: (...a) => latest.current.onPreview(...a),
    onCommit: (...a) => latest.current.onCommit(...a),
    onLink: (...a) => latest.current.onLink(...a),
  }), []);

  // Dependency lines run out of the bottom (or top) of the predecessor into the gap between rows, along the gap,
  // down (or up) at a spot where no bar stands, and into the left end of the successor, so they never cross a bar.
  const routedLinks = useMemo(() => {
  // Reuse bar extents during path routing instead of recalculating date math
  // in every candidate lane for every dependency.
  const extents = rows.map((t) => extent(t, eff(t), w, x));
  const lanes = {};
  const found = [];
  rows.forEach((t) => {
    t.dependsOn.forEach((pid) => {
      const p = tasksById.get(pid);
      if (!p || rowIndex[pid] === undefined) return;
      const pe = eff(p);
      const te = eff(t);
      const pr = rowIndex[pid];
      const tr = rowIndex[t.id];
      // Keep links crossing the painted viewport even when their endpoints are
      // outside it. Previous versions required BOTH endpoints to be inside,
      // silently hiding most dependencies on a continuously scrolling chart.

      const down = tr > pr;
      const pRight = p.milestone ? x(pe.due) + w / 2 : x(pe.due) + w - 2;
      const sx = p.milestone ? pRight : Math.max(x(pe.start) + 10, pRight - 10);
      const sy = pr * ROW + (p.milestone ? ROW / 2 + (down ? 11 : -11) : down ? BAR_TOP + BAR_H : BAR_TOP);
      const gutter = (down ? pr + 1 : pr) * ROW;
      lanes[gutter] = (lanes[gutter] === undefined ? -1 : lanes[gutter]) + 1;
      const gy = gutter + ((lanes[gutter] % 5) - 2) * 4;
      const x2 = t.milestone ? x(te.due) + w / 2 - 11 : x(te.start) + 2;
      // Keep out-of-window dependency data intact, but do not draw unbounded
      // native SVG paths with offscreen endpoints.
      if (pRight < 0 || pRight > gridW || x2 < 0 || x2 > gridW) return;
      const y2 = tr * ROW + ROW / 2;
      const lo = Math.min(pr, tr) + 1;
      const hi = Math.max(pr, tr) - 1;
      const xv = viewport.routingLane(extents, lo, hi, x2 - 14);
      const pts = [[sx, sy], [sx, gy], [xv, gy], [xv, y2], [x2 - 2, y2]];
      // A routed dependency can bend through the viewport even when its two
      // endpoints are offscreen horizontally; test the *actual route*.
      if (!pts.every(point => point.every(Number.isFinite))) return;
      const xs = pts.map((point) => point[0]);

      found.push({
        key: `${pid}>${t.id}`,
        pid,
        tid: t.id,
        pts, minX: Math.min(...xs), maxX: Math.max(...xs),
        d: roundPath(pts),
        color: LINK_COLORS[found.length % LINK_COLORS.length],
        x2: x2 - 2,
        y2,
      });
    });
  });
  return found;
  // Only expensive path routing is memoized. Tap/drag callback props remain live.
  }, [rows, tasksById, rowIndex, drag, w, START, gridW]);
  const links = routedLinks.filter(l => viewport.intersectsRows(rowIndex[l.pid], rowIndex[l.tid], firstPaint, lastPaint) && viewport.intersects(l.minX, l.maxX, paintLeft, paintWidth, 10));

  // Distinguish missing render geometry from a project without visible links.
  // Log at most once on initial layout; never store task names or IDs.
  const reportedLinkCount = useRef(false);
  useEffect(() => {
    if (!viewportW || !paintH || reportedLinkCount.current) return;
    reportedLinkCount.current = true;
    diagnosticMonitor.recordAction(`timeline SVG viewport ${Math.round(paintWidth)}x${Math.round(paintH)}px, visible dependency paths ${links.length}`);
  }, [viewportW, paintWidth, paintH, links.length]);

  // A tap on empty chart area: pick the dependency line under the finger, if any.
  const onGridTap = (e) => {
    if (k.pinching || Date.now() < k.suppressUntil) return;
    const n = gridRef.current;
    if (!n) return;
    const { pageX, pageY } = e.nativeEvent;
    n.measure((a, b, c2, d2, px, py) => {
      const lx = pageX - px;
      const ly = pageY - py;
      let best = null;
      let bd = 18;
      links.forEach((l) => {
        const dd = distToPath(l.pts, lx, ly);
        if (dd < bd) {
          bd = dd;
          best = l;
        }
      });
      setPick(best ? { key: best.key, pid: best.pid, tid: best.tid } : null);
    });
  };
  const removePick = () => {
    if (!pick) return;
    const tgt = s.tasks.find((q) => q.id === pick.tid);
    const src = s.tasks.find((q) => q.id === pick.pid);
    setPick(null);
    if (tgt && src) updateTask(tgt.id, { dependsOn: tgt.dependsOn.filter((d) => d !== pick.pid) }, `Removed dependency: "${tgt.title}" no longer waits for "${src.title}"`);
  };
  const pickTgt = pick ? s.tasks.find((q) => q.id === pick.tid) : null;
  const pickSrc = pick ? s.tasks.find((q) => q.id === pick.pid) : null;

  // The curve being drawn: follows the finger, and snaps to the start of the task it would link to.
  let drawing = null;
  if (link) {
    const src = tasksById.get(link.from);
    if (src && rowIndex[src.id] !== undefined) {
      const e = eff(src);
      const x1 = src.milestone ? x(e.due) + w / 2 : x(e.due) + w - 2;
      if (x1 >= 0 && x1 <= gridW) {
      const y1 = rowIndex[src.id] * ROW + ROW / 2;
      const hx = src.milestone ? x(e.due) + w / 2 + 25 : x(e.due) + w + 15;
      const tgt = targetAt(link.from, link.cy);
      let x2 = hx + link.cx;
      let y2 = y1 + link.cy;
      if (tgt) {
        const te = eff(tgt);
        x2 = tgt.milestone ? x(te.due) + w / 2 - 8 : x(te.start) + 2;
        y2 = rowIndex[tgt.id] * ROW + ROW / 2;
      }
      const kk = Math.max(28, Math.abs(x2 - x1) / 2);
      drawing = { d: `M${x1},${y1} C${x1 + kk},${y1} ${x2 - kk},${y2} ${x2},${y2}`, x2, y2, tid: tgt ? tgt.id : null };
      }
    }
  }

  const pageScrollProps = {
    // Native vertical scrolling keeps touch ownership throughout gestures.
    onLayout: (e) => { k.size.vh = e.nativeEvent.layout.height; gridOrigin.current = null; refreshMax(k); refreshPaint(); },
    onContentSizeChange: (cw, ch) => { k.size.ch = ch; refreshMax(k); },
  };

  return (
    <TimelineGestureHost>
    <View style={{ flex: 1 }}>
      {/* The ribbon and calendar are outside Page's vertical ScrollView; neither can scroll away. */}
      <View style={{ marginHorizontal: wide ? 32 : 16, marginTop: 4,
        overflow: 'hidden', backgroundColor: c.bg }}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:8}}>
          <View style={{flex:1,gap:2}}><T size={16} weight="600">Project schedule</T><T size={12} muted>{rows.length} scheduled · {zoomMode.toLowerCase()}</T></View>
          <Chip label="Today" quiet onPress={() => goToday(true)} />
          <ActionMenu label="Timeline options" items={[
            {label:showItems?'Hide task names':'Show task names',icon:'sidebar',onPress:()=>setShowItems(v=>!v)},
            rows.length?{label:'Jump to first task',icon:'skip-back',onPress:goFirst}:null,
            {label:showCritical?'Hide critical path':'Show critical path',icon:'git-branch',onPress:()=>setShowCritical(v=>!v)},
            {label:`Parent tasks · ${summaries.size}`,icon:'layers',onPress:()=>setTaskPanel('parents')},
            {label:`To schedule · ${unscheduled.length}`,icon:'calendar',onPress:()=>setTaskPanel('schedule')},
          ]}/>
        </View>
        <View style={{ flexDirection: 'row', minHeight: HEAD, backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.line }}>
          {showItems ? <View style={{ width: labelW, justifyContent: 'center', paddingHorizontal: 14,
              borderRightWidth: 1, borderRightColor: c.line }}><T size={12} weight="600" muted>Task</T></View> : null}
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <Animated.View pointerEvents="none" style={{ width: gridW, height: HEAD,
              transform: [{ translateX: calendarShift }] }}>
            <TimelinePinchCanvas pinch={pinch} style={{ width: gridW, height: HEAD }}>
              {calendar.filter(label => visibleTicks.includes(label.index)).map((label) => {
                const i = label.index;
                const today = label.iso === TODAY;
                const daily = zoomMode === 'Days' && w >= 28;
                return <TimelinePinchLabel pinch={pinch} center={daily} key={i} style={{ position: 'absolute', left: i * w, top: 0, bottom: 0,
                  width: daily ? w : 72, paddingLeft: daily ? 0 : 6, alignItems: daily ? 'center' : 'flex-start', justifyContent: 'center', gap: 4 }}>
                  <T size={11} muted>{daily && label.day !== 1 ? label.weekday : label.month}</T>
                  <T size={12} weight={today ? '600' : '400'} color={today ? c.accentText : c.muted} style={{ fontVariant: ['tabular-nums'] }}>{label.day}</T>
                </TimelinePinchLabel>;
              })}
            </TimelinePinchCanvas>
            </Animated.View>
          </View>
        </View>
        {pick && pickTgt && pickSrc ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8,
            padding: 8, borderTopWidth: 1, borderTopColor: c.line }}>
            <T size={12} style={{ flex: 1, minWidth: 130 }} numberOfLines={2}>
              Remove link? "{pickTgt.title}" waits for "{pickSrc.title}".
            </T>
            <Button label="Remove" small variant="danger" onPress={removePick} />
            <Button label="Keep" small variant="ghost" onPress={() => setPick(null)} />
          </View>
        ) : null}
      </View>
    <Page
      intro={false}
      title="Timeline"
      scrollRef={pageRef}
      topPadding={0}
      scrollEnabled={Platform.OS === 'web' ? !pinching && !active : true}
      scrollProps={{ ...pageScrollProps, nestedScrollEnabled: true }}
      onScroll={(e) => {
        k.scroll.y = e.nativeEvent.contentOffset.y;
        refreshPaint();
      }}
    >
      <Card pad={0} style={{ overflow: 'hidden', borderTopWidth: 0,
        borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <View style={{ flexDirection: 'row' }}>
          {/* Fixed label column, shown with the Items chip */}
          {showItems ? (
          <View style={{ width: labelW, borderRightWidth: 1, borderColor: c.line, backgroundColor: c.surface, zIndex: 2 }}>
            <View style={{ height: gridH }}>
              {paintedRows.map((t, i) => (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open task ${t.title}`}
                  onPress={() => openTask(t.id)}
                  style={({ pressed }) => ({ position: 'absolute', top: (firstPaint + i) * ROW, left: 0, right: 0, height: ROW, justifyContent: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderColor: c.line, opacity: pressed ? 0.6 : 1 })}
                >
                  <T size={13} weight="500" numberOfLines={1}>{t.title}</T>
                  <T size={11} muted numberOfLines={1}>
                    {t.owner}{t.dependsOn.length ? ` · after ${t.dependsOn.map((d) => d.toUpperCase()).join(', ')}` : ''}
                  </T>
                </Pressable>
              ))}
            </View>
          </View>
          ) : null}

          {/* Native scrolling retains touch ownership during a gesture; web locks only after lift. */}
          <View ref={boxRef} collapsable={false} style={{ flex: 1, minWidth: 0, height: gridH, flexShrink: 0 }}>
            <TimelineZoomControls onZoomIn={() => zoomBy(1.25)} onZoomOut={() => zoomBy(0.8)}
              canZoomIn={timelineZoom.pinchZoom(w, 1.25, 0, 0, 0, span, viewportW).width > w + 0.000001}
              canZoomOut={timelineZoom.pinchZoom(w, 0.8, 0, 0, 0, span, viewportW).width < w - 0.000001} />
            <TimelinePinchArea pinch={pinch}>
            <TimelineScrollView
              simultaneousWith={pinch.gesture}
              ref={chartRef}
              horizontal
              style={{ height: gridH, flexGrow: 0, flexShrink: 0 }}
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator
              scrollEnabled={Platform.OS === 'web' ? !pinching && !active : true}
              scrollEventThrottle={16}
              onLayout={(e) => { k.size.vw = e.nativeEvent.layout.width; setViewportW(e.nativeEvent.layout.width); refreshMax(k); }}
              onScroll={horizontalScroll}
              onContentSizeChange={(width) => settleZoom(true, width)}
            >
              <TimelinePinchCanvas pinch={pinch} style={{ width: gridW }}>
                <View ref={gridRef} collapsable={false} onLayout={refreshPaint} style={{ height: gridH }}>
                  {/* Only an in-viewport Pressable; the former full-canvas responder
                      consumed native scroll gestures and allocated huge hit surfaces. */}
                  {paintWidth > 0 && paintH > 0 && links.length > 0 ? <Pressable onPress={onGridTap} accessible={false}
                    style={{ position: 'absolute', left: paintLeft, top: paintTop, width: paintWidth, height: paintH }}
                  /> : null}
                  {weekendDays.map((i) => (
                    <View key={'we' + i} pointerEvents="none" style={{ position: 'absolute', left: i * w, top: paintTop, height: paintH, width: w, backgroundColor: c.surfaceAlt, opacity: 0.3 }} />
                  ))}
                  {visibleTicks.map((i) => (
                    <View key={'g' + i} style={{ position: 'absolute', left: i * w, top: paintTop, height: paintH, width: 1, backgroundColor: c.line, opacity: 0.6 }} pointerEvents="none" />
                  ))}
                  {paintedRows.map((t, i) => (
                    <View key={'r' + t.id} pointerEvents="none" style={{ position: 'absolute', left: paintLeft, width: paintWidth, top: (firstPaint + i + 1) * ROW - 1, height: 1, backgroundColor: c.line }} />
                  ))}

                  {/* Today marker: dashed and semi-transparent, drawn behind the bars */}
                  <View pointerEvents="none" style={{ position: 'absolute', left: x(TODAY) + w / 2 - 1, top: paintTop, width: 2, height: paintH }}>
                    <Svg width={2} height={paintH}>
                      <Line x1={1} y1={0} x2={1} y2={paintH} stroke={c.accent} strokeWidth={2} strokeOpacity={0.55} strokeDasharray="7 6" />
                    </Svg>
                  </View>

                  {drawnBars.map(({ t, i }) => {
                    const e = eff(t);
                    return (
                      <TaskBar
                        pinch={pinch}
                        key={t.id}
                        t={t}
                        start={e.start}
                        due={e.due}
                        origin={START}
                        w={w}
                        rowTop={(firstPaint + i) * ROW}
                        span={span}
                        paintLeft={paintLeft}
                        paintWidth={paintWidth}
                        target={!!drawing && drawing.tid === t.id}
                        critical={showCritical && critIds.has(t.id)}
                        dragging={(!!drag && drag.id === t.id) || (!!link && link.from === t.id)}
                        k={k}
                        onPreview={bar.onPreview}
                        onCommit={bar.onCommit}
                        onOpen={openTask}
                        onLink={bar.onLink}
                      />
                    );
                  })}

                  {/* Dependency curves, drawn above the bars and ignoring touches */}
                  {paintWidth > 0 && paintH > 0 ? <View pointerEvents="none" style={{ position: 'absolute', left: paintLeft, top: paintTop, width: paintWidth, height: paintH }}>
                    <Svg width={paintWidth} height={paintH} viewBox={viewport.svgViewBox(paintLeft, paintTop, paintWidth, paintH)} preserveAspectRatio="none">
                      {links.map((l) => (
                        <Path
                          key={l.key}
                          d={l.d}
                          stroke={showCritical && critEdges.has(`${l.pid}->${l.tid}`) ? PRIORITY_COLOR.Critical : np533DependencyColor(l)}
                          strokeWidth={pick && pick.key === l.key ? 4 : showCritical && critEdges.has(`${l.pid}->${l.tid}`) ? 3.5 : 2}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}
                      {links.map((l) => (
                        <Circle key={'a' + l.key} cx={l.x2} cy={l.y2} r={3.5} fill={np533DependencyColor(l)} />
                      ))}
                      {drawing ? (
                        <Path
                          d={drawing.d}
                          stroke={c.accent}
                          strokeWidth={2.5}
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={drawing.tid ? undefined : '6 5'}
                        />
                      ) : null}
                      {drawing ? <Circle cx={drawing.x2} cy={drawing.y2} r={5} fill={c.accent} /> : null}
                    </Svg>
                  </View> : null}

                </View>
              </TimelinePinchCanvas>
            </TimelineScrollView>
            </TimelinePinchArea>
          </View>
        </View>
      </Card>

      {notice ? <T size={13} weight="600" color={c.accentText}>{notice}</T> : null}
      {showCritical ? (
        <Card style={{ gap: 6 }}>
          {crit.error ? <T size={13} color={PRIORITY_COLOR.High}>{crit.error}. Remove the circular dependency to see the critical path.</T> : <>
            <T size={13} weight="600">Critical path: {crit.criticalIds.length} of {crit.scheduledCount} scheduled tasks, {crit.totalDays} days end to end</T>
            <T size={12} muted>Red bars and lines cannot slip without moving the finish date. {crit.assumption}.</T>
            {crit.excludedIds.length ? <T size={12} muted>{crit.excludedIds.length} task{crit.excludedIds.length === 1 ? '' : 's'} without dates {crit.excludedIds.length === 1 ? 'is' : 'are'} left out.</T> : null}
          </>}
        </Card>
      ) : null}
      {conflicts.length ? (
        <Card style={{ gap: 8 }}>
          <T size={13} weight="600" color={PRIORITY_COLOR.High}>{conflicts.length} dependenc{conflicts.length === 1 ? 'y starts' : 'ies start'} before the predecessor finishes</T>
          {[...new Map(conflicts.map((x) => [x.taskId, x])).values()].slice(0, 5).map((x) => (
            <View key={x.taskId} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <T size={12} style={{ flex: 1, minWidth: 180 }}>{tasksById.get(x.taskId)?.title || x.taskId} starts before {tasksById.get(x.predecessorId)?.title || x.predecessorId} ends</T>
              <Button label="Move after predecessors" small variant="secondary" onPress={() => scheduleAfter(x.taskId)} />
            </View>
          ))}
        </Card>
      ) : null}
      {invalid.length ? (
        <Card style={{ gap: 8 }}>
          <T size={13} weight="600" color={PRIORITY_COLOR.High}>{invalid.length} task{invalid.length === 1 ? ' has' : 's have'} an unreadable or reversed date range</T>
          {invalid.slice(0, 5).map((id) => <Button key={id} label={s.tasks.find((t) => t.id === id)?.title || id} small variant="ghost" onPress={() => openTask(id)} />)}
        </Card>
      ) : null}
      {isSample && !allScheduled.length ? (
        <Card style={{ gap: 8 }}>
          <T size={13}>The sample project has no dates yet.</T>
          <Button label="Schedule the sample tasks" small onPress={scheduleSample} />
        </Card>
      ) : null}
      {taskPanel === 'parents' ? <Sheet visible onClose={()=>setTaskPanel(null)} title="Parent Tasks" showNotice={false}>
        <T size={12} muted>Parent tasks and subtasks. Select a task to edit it, or expand a parent to explore its children.</T>
        {hasParents ? (
          <View style={{gap:8}}>
          {hierarchy.filter((r) => r.hasChildren || r.depth > 0).slice(0, 60).map((r) => {
            const sum = summaries.get(r.task.id);
            return (
              <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: r.depth * 16 }}>
                {r.hasChildren ? <Chip label={r.collapsed ? '+' : '–'} onPress={() => setCollapsed((cur) => (cur.includes(r.task.id) ? cur.filter((x) => x !== r.task.id) : [...cur, r.task.id]))} /> : <View style={{ width: 34 }} />}
                <Pressable accessibilityRole="button" accessibilityLabel={`Open task ${r.task.title}`} onPress={() => {setTaskPanel(null);openTask(r.task.id);}} style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}>
                  <T size={13} weight={r.hasChildren ? '600' : '400'} numberOfLines={1}>{r.task.title}</T>
                  {sum ? <T size={11} muted numberOfLines={1}>{fmt(gantt.dateAt(sum.start))} to {fmt(gantt.dateAt(sum.end))} · {sum.progress}% · {sum.children} subtask{sum.children === 1 ? '' : 's'}</T> : null}
                </Pressable>
              </View>
            );
          })}
          </View>
        ) : <T muted size={13}>No parent tasks or subtasks in this project.</T>}
      </Sheet> : null}
      {taskPanel === 'schedule' ? <Sheet visible onClose={()=>setTaskPanel(null)} title="To Schedule" showNotice={false}>
        <T size={12} muted>Tasks without start or due dates. Select a task to set its schedule.</T>
        {unscheduled.length ? unscheduled.map(t => (
          <Pressable key={t.id} accessibilityRole="button" accessibilityLabel={`Schedule task ${t.title}`} onPress={()=>{setTaskPanel(null);openTask(t.id);}}
            style={({pressed})=>({paddingVertical:12,paddingHorizontal:14,borderWidth:1,borderColor:c.line,borderRadius:10,backgroundColor:pressed?c.surfaceAlt:c.surface})}>
            <T size={13} numberOfLines={2}>{t.title}</T>
          </Pressable>
        )) : <T muted size={13}>Everything is scheduled.</T>}
      </Sheet> : null}
      <T size={12} muted>
        Pinch the chart to zoom its dates. Hold a bar and drag to move it. Hold its left or right edge and drag to change the start or due date. Hold the dot after a bar and drag onto another row to make that task wait for it. Tap a bar to open the task. Tap a dependency line to remove it. The accent-colored dashed line marks today.
      </T>
    </Page>
    </View>
    </TimelineGestureHost>
  );
}
