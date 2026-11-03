// /src/components/shell/Menus.js
import { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DrawerMotion from './DrawerMotion';
import { radius, useTheme } from '../../ui/theme/theme';
import { useStore } from '../../store/store';
import { Button, IconBtn, Input, T } from '../../ui/ui';
import { DangerConfirm } from '../inline/CompactTools';
import InlineNotice from '../notice/InlineNotice';

// Side navigation shared by the wide layout (Sidebar) and the phone layout (SideMenu).
function Brand({ narrow = false }) {
  const { mode } = useTheme();
  return (
    <Image source={mode==='dark'?require('../../../assets/niyarvo-projects-white.png'):require('../../../assets/niyarvo-projects-dark.png')}
      style={{width:narrow ? 160 : 205,height:52}} resizeMode="contain" accessibilityLabel="Niyarvo Projects" />
  );
}

function NavItem({ k, label, icon, current, go, collapsed = false }) {
  const { c } = useTheme();
  const on = current === k;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={() => go(k)}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 12, minHeight: 40, marginVertical: 2,
        paddingHorizontal: collapsed ? 8 : 12, borderRadius: radius.sm,
        backgroundColor: on ? c.surfaceAlt : pressed ? c.surfaceAlt : 'transparent',
        borderLeftWidth: on && !collapsed ? 3 : 0, borderLeftColor: c.accent,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View style={k === 'timeline' ? { transform: [{ rotate: '90deg' }] } : undefined}>
        <Feather name={icon} size={18} color={on ? c.accent : c.muted} />
      </View>
      {!collapsed ? <T size={13} weight={on ? '600' : '500'} color={on ? c.ink : c.muted} numberOfLines={1}>{label}</T> : null}
    </Pressable>
  );
}

function NavGroups({ nav, current, go, collapsed = false }) {
  const { c } = useTheme();
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      {nav.map((g, index) => (
        <View key={g.group} style={{ marginTop: index ? 20 : 8, gap: 1 }}>
          {collapsed
            ? <View style={{ height: 1, backgroundColor: c.line, marginHorizontal: 12, marginBottom: 10 }} />
            : <T size={11} weight="500" muted style={{ paddingHorizontal: 12, marginBottom: 8 }}>{g.group}</T>}
          {g.items.map(([k, l, i]) => (
            <NavItem key={k} k={k} label={l} icon={i} current={current} go={go} collapsed={collapsed} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

// Project switcher: slides in over the menu, lists the open projects and ends with a + Create new row.
function ProjectDrawer({ onClose, onPick, inModal }) {
  const { c } = useTheme();
  const { projects, createProject } = useStore();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const create = () => {
    const id = createProject(name);
    setName('');
    setNaming(false);
    if (id) onPick(id, true);
  };

  return (
    <DrawerMotion
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, backgroundColor: c.surface,
        paddingTop: Platform.OS === 'ios' ? 64 : 52, paddingHorizontal: 14, paddingBottom: 24,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 16 }}>
        <T serifFace size={20} weight="600">Projects</T>
        <IconBtn icon="x" label="Close projects" onPress={onClose} />
      </View>
      {inModal ? <InlineNotice /> : null}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {projects.filter((p) => !p.archived).map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onPick(p.id, false)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md,
              backgroundColor: p.current ? c.surfaceAlt : 'transparent', borderWidth: 1, borderColor: p.current ? c.line : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <T weight="600" numberOfLines={1}>{p.name}</T>
              <T size={12} muted>Release {p.release} · {p.tasks} task{p.tasks === 1 ? '' : 's'}</T>
            </View>
            {p.current ? <Feather name="check" size={16} color={c.ink} /> : null}
          </Pressable>
        ))}

        {naming ? (
          <View style={{ gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: c.line }}>
            <Input value={name} onChangeText={setName} placeholder="Project name" autoFocus onSubmitEditing={create} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button label="Create" small onPress={create} disabled={!name.trim()} />
              <Button label="Cancel" small variant="ghost" onPress={() => { setNaming(false); setName(''); }} />
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setNaming(true)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md,
              borderWidth: 1, borderStyle: 'dashed', borderColor: c.faint, opacity: pressed ? 0.7 : 1,
            })}
          >
            <Feather name="plus" size={16} color={c.ink} />
            <T weight="600">Create new</T>
          </Pressable>
        )}
      </ScrollView>
    </DrawerMotion>
  );
}

// Workspace switcher: same slide-over as the project drawer. Tap a row to open it; the pencil opens rename and delete.
function WorkspaceDrawer({ onClose, inModal }) {
  const { c } = useTheme();
  const { workspaceList, workspace, switchWorkspace, createWorkspace, renameWorkspace, deleteWorkspace } = useStore();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState('');
  const [rename, setRename] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (job) => { setBusy(true); try { return await job(); } finally { setBusy(false); } };
  const only = workspaceList.items.length < 2;
  const open = (id) => run(async () => { if (await switchWorkspace(id)) onClose(); });
  const create = () => run(async () => { if (await createWorkspace(name)) onClose(); });
  const save = () => run(async () => { if (await renameWorkspace(editId, rename)) setEditId(''); });
  const remove = (id) => run(async () => { if (await deleteWorkspace(id)) setEditId(''); });
  const when = (iso) => (iso ? `Created ${iso.slice(0, 10)}` : 'Recovered from saved data');

  return (
    <DrawerMotion
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, backgroundColor: c.surface,
        paddingTop: Platform.OS === 'ios' ? 64 : 52, paddingHorizontal: 14, paddingBottom: 24,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 16 }}>
        <T serifFace size={20} weight="600">Workspaces</T>
        <IconBtn icon="x" label="Close workspaces" onPress={onClose} />
      </View>
      {inModal ? <InlineNotice /> : null}
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6 }}>
        {workspaceList.items.map((w) => {
          const on = w.id === workspaceList.activeId;
          return (
            <View key={w.id} style={{ borderRadius: radius.md, borderWidth: 1, borderColor: on ? c.line : 'transparent', backgroundColor: on ? c.surfaceAlt : 'transparent' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                  disabled={busy}
                  onPress={() => (on ? onClose() : open(w.id))}
                  accessibilityLabel={on ? `${w.name}, open now` : `Open workspace ${w.name}`}
                  style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <T weight="600" numberOfLines={1}>{w.name}</T>
                    <T size={12} muted>{on ? `Open now · ${workspace.projects.length} project${workspace.projects.length === 1 ? '' : 's'}` : when(w.createdAt)}</T>
                  </View>
                  {on ? <Feather name="check" size={16} color={c.ink} /> : null}
                </Pressable>
                <IconBtn icon="edit-2" label={`Edit workspace ${w.name}`} onPress={() => { setEditId(editId === w.id ? '' : w.id); setRename(w.name); }} />
              </View>
              {editId === w.id ? (
                <View style={{ gap: 10, padding: 12, paddingTop: 0 }}>
                  <Input value={rename} onChangeText={setRename} placeholder="Workspace name" onSubmitEditing={save} />
                  <Button label="Save name" small onPress={save} disabled={busy || !rename.trim() || rename.trim() === w.name} />
                  {only
                    ? <T size={12} muted>This is the only workspace, so it cannot be deleted.</T>
                    : <>
                        <T size={12} muted>Deleting removes this workspace with all of its projects, tasks and recovery snapshots. Export a backup first if you may need them.</T>
                        <DangerConfirm label="Delete workspace" onConfirm={() => remove(w.id)} />
                      </>}
                </View>
              ) : null}
            </View>
          );
        })}
        {naming ? (
          <View style={{ gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: c.line }}>
            <Input value={name} onChangeText={setName} placeholder="Workspace name" autoFocus onSubmitEditing={create} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button label="Create" small onPress={create} disabled={busy || !name.trim()} />
              <Button label="Cancel" small variant="ghost" onPress={() => { setNaming(false); setName(''); }} />
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setNaming(true)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: c.faint, opacity: pressed ? 0.7 : 1 })}
          >
            <Feather name="plus" size={16} color={c.ink} />
            <T weight="600">Create new</T>
          </Pressable>
        )}
      </ScrollView>
    </DrawerMotion>
  );
}

// One quiet line above the project card: which workspace is open. Tap it to switch.
function WorkspaceRow({ onPress }) {
  const { c } = useTheme();
  const { workspaceList } = useStore();
  const name = workspaceList.items.find((w) => w.id === workspaceList.activeId)?.name || 'Workspace';
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Workspace ${name}. Switch workspace`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 8, opacity: pressed ? 0.7 : 1 })}
    >
      <Feather name="layers" size={15} color={c.muted} />
      <T size={13} weight="500" muted numberOfLines={1} style={{ flex: 1 }}>{name}</T>
      <Feather name="chevron-down" size={15} color={c.muted} />
    </Pressable>
  );
}

// The project card at the top of the menu: tap it to open the project drawer.
function ProjectCard({ onPress }) {
  const { c } = useTheme();
  const { s } = useStore();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Switch project"
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md,
        backgroundColor: c.surfaceAlt, marginBottom: 18, opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <T weight="600" numberOfLines={1}>{s.project.name}</T>
        <T size={12} muted>Release {s.project.release} · {s.tasks.length} tasks</T>
      </View>
      <Feather name="chevrons-right" size={16} color={c.muted} />
    </Pressable>
  );
}

// Persistent desktop rail; compact automatically on small laptop widths and manually toggleable.
export function Sidebar({ nav, current, go, onPickProject, onAutoLayout }) {
  const { c, mode } = useTheme();
  const { width } = useWindowDimensions();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [spaces, setSpaces] = useState(false);
  const compact = collapsed || width < 1120;
  return (
    <View style={{ width: compact ? 72 : 264, borderRightWidth: 1, borderRightColor: c.line, backgroundColor: c.surface, paddingTop: 20, paddingBottom: 12, paddingHorizontal: compact ? 8 : 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginBottom: 12, paddingHorizontal: compact ? 4 : 6 }}>
        {compact
          ? <Image source={require('../../../assets/brand-symbol.png')} resizeMode="contain" style={{ width: 28, height: 28 }} accessibilityLabel="Niyarvo Projects" />
          : <Brand narrow />}
        {width >= 1120 ? <IconBtn icon={compact ? 'chevrons-right' : 'chevrons-left'} label={compact ? 'Expand sidebar' : 'Collapse sidebar'} onPress={() => setCollapsed(v => !v)} /> : null}
      </View>
      {compact ? <View style={{ gap: 6, marginBottom: 12, alignItems: 'center' }}>
        <IconBtn icon="layers" label="Switch workspace" onPress={() => setSpaces(true)} />
        <IconBtn icon="folder" label="Switch project" onPress={() => setDrawer(true)} />
      </View> : <>
        <WorkspaceRow onPress={() => setSpaces(true)} />
        <ProjectCard onPress={() => setDrawer(true)} />
      </>}
      <NavGroups nav={nav} current={current} go={go} collapsed={compact} />
      <View style={{ borderTopWidth: 1, borderColor: c.line, paddingTop: 10, paddingHorizontal: 6 }}>
        {onAutoLayout ? <Pressable accessibilityRole="button" accessibilityLabel="Return to automatic layout" onPress={onAutoLayout}
          style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: compact ? 'center' : 'flex-start', gap: 10 }}>
          <Feather name="smartphone" size={17} color={c.muted} />
          {!compact ? <T size={12} muted>Automatic layout</T> : null}
        </Pressable> : !compact ? <T size={11} muted>Niyarvo Projects</T> : <Feather name="command" size={16} color={c.faint} />}
      </View>
      <Modal visible={drawer || spaces} transparent animationType="fade" onRequestClose={() => { setDrawer(false); setSpaces(false); }}>
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: mode === 'dark' ? 'rgba(0,0,0,.66)' : 'rgba(21,20,18,.33)' }}>
          <View style={{ width: 360, maxWidth: '90%', backgroundColor: c.surface, overflow: 'hidden' }}>
            {drawer ? <ProjectDrawer inModal onClose={() => setDrawer(false)} onPick={(id, isNew) => { setDrawer(false); onPickProject(id, isNew); }} /> : null}
            {spaces ? <WorkspaceDrawer inModal onClose={() => setSpaces(false)} /> : null}
          </View>
          <Pressable accessibilityLabel="Close switcher" onPress={() => { setDrawer(false); setSpaces(false); }} style={{ flex: 1 }} />
        </View>
      </Modal>
    </View>
  );
}

// The same project selection flow is available from the desktop toolbar.
export function ProjectSwitcher({ onPickProject, compact = false }) {
  const { c, mode } = useTheme();
  const { s } = useStore();
  const [visible, setVisible] = useState(false);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Switch project" onPress={() => setVisible(true)}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: compact ? 190 : 250, flexShrink: 1, minWidth: 0, minHeight: 38,
        paddingHorizontal: 12, backgroundColor: pressed ? c.surfaceAlt : c.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: c.line })}>
      <Feather name="folder" size={16} color={c.muted} />
      <T weight="600" size={13} numberOfLines={1} style={{ flexShrink: 1 }}>{s.project.name}</T>
      <Feather name="chevron-down" size={14} color={c.muted} />
    </Pressable>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: mode === 'dark' ? 'rgba(0,0,0,.66)' : 'rgba(21,20,18,.33)' }}>
        <View style={{ width: 360, maxWidth: '90%', backgroundColor: c.surface, overflow: 'hidden' }}>
          <ProjectDrawer inModal onClose={() => setVisible(false)} onPick={(id, isNew) => { setVisible(false); onPickProject(id, isNew); }} />
        </View>
        <Pressable accessibilityLabel="Close projects" onPress={() => setVisible(false)} style={{ flex: 1 }} />
      </View>
    </Modal>
  </>;
}

// Phone side menu: slides in from the left, opened by the menu button in the header.
export function SideMenu({ nav, visible, current, go, onClose, onPickProject, onDesktopLayout }) {
  const { c, mode } = useTheme();
  const [drawer, setDrawer] = useState(false);
  const [spaces, setSpaces] = useState(false);
  useEffect(() => {
    if (!visible) { setDrawer(false); setSpaces(false); }
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
        <View
          style={{
            width: 300,
            maxWidth: '85%',
            backgroundColor: c.surface,
            borderRightWidth: 1,
            borderColor: c.line,
            paddingTop: Platform.OS === 'ios' ? 64 : 52,
            paddingHorizontal: 14,
            paddingBottom: 24,
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 20 }}>
            <Brand />
            <IconBtn icon="x" label="Close menu" onPress={onClose} />
          </View>
          <WorkspaceRow onPress={() => setSpaces(true)} />
          <ProjectCard onPress={() => setDrawer(true)} />
          <NavGroups nav={nav} current={current} go={go} />
          {Platform.OS === 'web' && onDesktopLayout ? <Pressable accessibilityRole="button" accessibilityLabel="Use desktop layout"
            onPress={onDesktopLayout} style={{ minHeight: 48, borderTopWidth: 1, borderTopColor: c.line, paddingHorizontal: 12,
              flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Feather name="monitor" size={18} color={c.muted} />
            <T size={13} weight="500">Desktop layout</T>
          </Pressable> : null}
          {spaces ? <WorkspaceDrawer inModal onClose={() => setSpaces(false)} /> : null}
          {drawer ? <ProjectDrawer inModal onClose={() => setDrawer(false)} onPick={(id, isNew) => { setDrawer(false); onPickProject(id, isNew); }} /> : null}
        </View>
        <Pressable onPress={onClose} style={{ flex: 1 }} accessibilityLabel="Dismiss menu" />
      </View>
    </Modal>
  );
}
