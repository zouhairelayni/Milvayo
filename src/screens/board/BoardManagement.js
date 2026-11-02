// /src/screens/board/BoardManagement.js
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Input, Pill, Segmented, Sheet, T } from '../../ui/ui';
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

export function NewListSheet({ visible, onClose, boardId }) {
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

export function BoardsManager({ visible, onClose }) {
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
