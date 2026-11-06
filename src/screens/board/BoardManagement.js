// /src/screens/board/BoardManagement.js
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ActionMenu, FormSection, Button, Card, Input, Pill, Segmented, Sheet, T } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useTheme } from '../../ui/theme/theme';
import { MAIN, STATUS } from '../../store/data';
import { committedName } from '../../board/boardInteractions.cjs';

export function AddCard({ onAdd }) {
  const [text, setText] = useState('');
  const submit = () => {
    if (!text.trim()) return;
    if (onAdd(text.trim())) setText('');
  };
  return <Input value={text} onChangeText={setText} placeholder="Add a card" onSubmitEditing={submit} />;
}

// ---- add list -----------------------------------------------------------------

export function BoardCreateSheet({ visible, onClose, board, onCreated }) {
  const { addList, addBoard } = useStore();
  const [kind, setKind] = useState('board');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Backlog');
  const submit = () => {
    if (!name.trim()) return;
    const result = kind === 'board' ? addBoard(name.trim()) : addList(board.id, name.trim(), status);
    if (result) {
      setName('');
      if (kind === 'board') onCreated(result);
      onClose();
    }
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Create on Board"
      footer={<Button label={kind === 'board' ? 'Create board' : 'Create list'} icon="plus" disabled={!name.trim()} onPress={submit} />}
    >
      <Segmented fill options={[{value:'board',label:'New board'},{value:'list',label:'New list'}]} value={kind} onChange={setKind}/>
      {kind==='list'?<T muted size={13}>Add a list to {board.name}</T>:null}
      <View style={{ gap: 8 }}>
        <T size={12} weight="500" muted>{kind==='board'?'Board name':'List name'}</T>
        <Input accessibilityLabel={kind==='board'?'Board name':'List name'} value={name} onChangeText={setName} placeholder={kind==='board'?'e.g. Design':'e.g. Blocked'} onSubmitEditing={submit} />
      </View>
      {kind==='list'?<FormSection title="Progress mapping" description="Choose the status applied to cards in this list.">
        <Segmented fill options={STATUS} value={status} onChange={setStatus} />
      </FormSection>:null}
    </Sheet>
  );
}

// Rename without re-normalizing the field on every keystroke (the store trims names).
// Keep edits local until the existing blur/submit boundary commits the normalized name.
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

export function BoardsManager({ visible, onClose }) {
  const { c } = useTheme();
  const { s, renameBoard, archiveBoard, deleteBoard } = useStore();

  const close = () => {
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

            {isMain ? <T size={12} muted>Main keeps every project task reachable.</T> : <ActionMenu label={`Manage ${b.name}`} items={[
              {label:b.archived?'Restore board':'Archive board',icon:b.archived?'rotate-ccw':'archive',onPress:()=>archiveBoard(b.id,!b.archived)},
              {label:'Delete board',icon:'trash-2',danger:true,confirmation:{title:'Delete board?',description:`Delete “${b.name}” and move its ${count} tasks to Main?`,confirmLabel:'Delete board'},onPress:()=>deleteBoard(b.id)},
            ]}/>}

          </Card>
        );
      })}
    </Sheet>
  );
}
