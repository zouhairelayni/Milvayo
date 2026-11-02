// /src/components/shell/Menus.js
import { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DrawerMotion from './DrawerMotion';
import { radius, useTheme } from '../../ui/theme/theme';
import { useStore } from '../../store/store';
import { Button, IconBtn, Input, T } from '../../ui/ui';
import { DangerConfirm } from '../inline/CompactTools';

// Side navigation shared by the wide layout (Sidebar) and the phone layout (SideMenu).
function Brand() {
  const { mode } = useTheme();
  return (
    <Image source={mode==='dark'?require('../../../assets/niyarvo-projects-white.png'):require('../../../assets/niyarvo-projects-dark.png')}
      style={{width:205,height:56}} resizeMode="contain" accessibilityLabel="Niyarvo Projects" />
  );
}

function NavItem({ k, label, icon, current, go }) {
  const { c } = useTheme();
  const on = current === k;
  return (
    <Pressable
      onPress={() => go(k)}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10,
        borderRadius: radius.sm, backgroundColor: on ? c.bg : 'transparent', borderWidth: on ? 1 : 0, borderColor: c.line,
      }}
    >
      <View style={k === 'timeline' ? { transform: [{ rotate: '90deg' }] } : undefined}><Feather name={icon} size={16} color={on ? c.ink : c.muted} /></View>
      <T size={14} weight={on ? '600' : '500'} color={on ? c.ink : c.muted}>{label}</T>
    </Pressable>
  );
}

// The grouped list of screens, shared by the wide-screen sidebar and the phone side menu.
function NavGroups({ nav, current, go }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {nav.map((g) => (
        <View key={g.group} style={{ marginBottom: 14, gap: 2 }}>
          <T upper size={10} weight="600" muted style={{ paddingHorizontal: 10, marginBottom: 6 }}>{g.group}</T>
          {g.items.map(([k, l, i]) => (
            <NavItem key={k} k={k} label={l} icon={i} current={current} go={go} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

// Project switcher: slides in over the menu, lists the open projects and ends with a + Create new row.
function ProjectDrawer({ onClose, onPick }) {
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
function WorkspaceDrawer({ onClose }) {
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

export function Sidebar({ nav, current, go, onPickProject }) {
  const { c } = useTheme();
  const [drawer, setDrawer] = useState(false);
  const [spaces, setSpaces] = useState(false);
  return (
    <View style={{ width: 248, borderRightWidth: 1, borderRightColor: c.line, backgroundColor: c.surface, paddingVertical: 22, paddingHorizontal: 14, overflow: 'hidden' }}>
      <View style={{ paddingHorizontal: 8, marginBottom: 22 }}>
        <Brand />
      </View>
      <WorkspaceRow onPress={() => setSpaces(true)} />
      <ProjectCard onPress={() => setDrawer(true)} />
      <NavGroups nav={nav} current={current} go={go} />
      {spaces ? <WorkspaceDrawer onClose={() => setSpaces(false)} /> : null}
      {drawer ? <ProjectDrawer onClose={() => setDrawer(false)} onPick={(id, isNew) => { setDrawer(false); onPickProject(id, isNew); }} /> : null}
    </View>
  );
}

// Phone side menu: slides in from the left, opened by the menu button in the header.
export function SideMenu({ nav, visible, current, go, onClose, onPickProject }) {
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
          {spaces ? <WorkspaceDrawer onClose={() => setSpaces(false)} /> : null}
          {drawer ? <ProjectDrawer onClose={() => setDrawer(false)} onPick={(id, isNew) => { setDrawer(false); onPickProject(id, isNew); }} /> : null}
        </View>
        <Pressable onPress={onClose} style={{ flex: 1 }} accessibilityLabel="Dismiss menu" />
      </View>
    </Modal>
  );
}
