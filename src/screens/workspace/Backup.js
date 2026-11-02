// /src/screens/workspace/Backup.js
import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { loadBackupLevel, saveBackupLevel } from '../../store/backupLevel';
const { DEFAULT_LEVEL } = require('../../store/niyav.cjs');
const {MAX_IMPORT_BYTES,tooBig,parseBackupJson,pickAndroidFileBytes,pickDocumentFileBytes}=require('../../store/importFiles.cjs');
import { niyavCodec } from '../../store/niyavPrimitives';
import { Bar, Button, Card, Chip, Empty, Input, SectionTitle, Segmented, T, downloadBytes, downloadText } from '../../ui/ui';
import { useStore } from '../../store/store';
import {Fold,DangerConfirm,Dropdown} from '../../components/inline/CompactTools';
import { useTheme } from '../../ui/theme/theme';

const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';

// Web only: opens the file picker and hands back the bytes of the chosen .json or .niyav file.
function pickBytesFile(done, fail) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.niyav,application/json,application/gzip,application/octet-stream';
  input.addEventListener('cancel',()=>done(null));
  input.onchange = () => {
    const f = input.files && input.files[0];
    if (!f) return;
    if (f.size > MAX_IMPORT_BYTES) { fail(new Error('Import exceeds 5 MB limit')); return; } // check before reading, so a huge file never loads into memory
    const r = new FileReader();
    r.onload = () => done(new Uint8Array(r.result));
    r.onerror = () => fail(new Error('The file could not be read.'));
    r.readAsArrayBuffer(f);
  };
  input.click();
}

const MIN_PASSWORD = 12;
const LEVEL_TEXT = {
  low: 'Low · 200,000 rounds. Fastest to create and open. Fine for everyday backups with a strong password.',
  medium: 'Medium · 400,000 rounds. Balanced. Recommended.',
  high: 'High · 600,000 rounds. Slowest on a phone, hardest for someone to guess the password.',
};
const paint = () => new Promise((resolve) => setTimeout(resolve, 40)); // let the "working" message appear before heavy work starts
const kb = (n) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export default function Backup() {
  const { c } = useTheme();
  const { s, projects, backupText, importProject, restoreWorkspace, createSnapshot, recoverProject, switchProject, workspace, restoreSnapshot, workspaceId } = useStore();
  const [notice, setNotice] = useState(null); // { ok, text }
  const [wholeFile,setWholeFile]=useState(null); // selected full-workspace JSON, not yet applied
  const [fmt, setFmt] = useState('json'); // export format: 'json' | 'niyav'
  const [protect, setProtect] = useState(false); // password-protect a .niyav export
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [level, setLevel] = useState(DEFAULT_LEVEL); // remembered protection level: 'low' | 'medium' | 'high'
  const [withSnapshots, setWithSnapshots] = useState(false);
  const [busy, setBusy] = useState(null); // message while compressing / deriving a key
  const [progress, setProgress] = useState(null); // 0..1 while a password key is derived, else null
  const [scope, setScope] = useState('project'); // what to back up: 'project' | 'workspace'
  const [pickedId, setPickedId] = useState(null);
  const abortRef = useRef(null);
  const projectId = projects.some((p) => p.id === pickedId) ? pickedId : s.project.id;
  const chosen = projects.find((p) => p.id === projectId) || s.project;
  // The key derivation can be stopped from the screen, and leaving the screen stops it too.
  const begin = (message) => { const ac = new AbortController(); abortRef.current = ac; setBusy(message); setProgress(0); return { signal: ac.signal, onProgress: (v) => setProgress(Math.round(v * 100) / 100) }; };
  const end = () => { abortRef.current = null; setBusy(null); setProgress(null); };
  const cancel = () => abortRef.current && abortRef.current.abort();
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);
  useEffect(() => { let live = true; loadBackupLevel().then((v) => { if (live) setLevel(v); }); return () => { live = false; }; }, []);
  const pickLevel = (v) => { setLevel(v); saveBackupLevel(v); };
  const [locked, setLocked] = useState(null); // { bytes, purpose } protected file waiting for its password
  const [unlockPw, setUnlockPw] = useState('');
  const archived = projects.filter((p) => p.archived);

  const say = (ok, text) => setNotice({ ok, text });
  const runImport = (text) => {
    if(tooBig(text)){say(false,'Import exceeds 5 MB limit');return;}
    const r = importProject(text, workspaceId); // the file may take seconds to open; refuse if another workspace is open by now
    if (r.ok) {
      say(true, r.names.length === 1 ? `Imported "${r.names[0]}" and opened it.` : `Imported ${r.names.length} projects. "${r.names[r.names.length - 1]}" is open.`);
    } else say(false, r.error);
  };

  const pickBytes = async () => {
    if(Platform.OS==='web')return new Promise((resolve,reject)=>pickBytesFile(resolve,reject));
    // Android: the system picker hands back a File the app is allowed to read. Reading the copy that
    // expo-document-picker puts in the cache failed with permission errors in Expo Go (v0.3.2 HOTFIX2), and
    // the picker offers every file type because exported backups are often labelled text/plain or octet-stream.
    if(Platform.OS==='android')return pickAndroidFileBytes(File);
    return pickDocumentFileBytes(await DocumentPicker.getDocumentAsync({type:'*/*',copyToCacheDirectory:true,multiple:false}),File);
  };
  const stageWorkspace=(text)=>{if(tooBig(text))throw Error('Import exceeds 5 MB limit');const payload=parseBackupJson(text);if(payload.format!=='niyarvo.workspace.v1'||!payload.workspace||!Array.isArray(payload.workspace.projects))throw Error('Select a complete Niyarvo workspace backup.');setWholeFile({text,name:'Selected workspace',projects:payload.workspace.projects.length})};
  const route=(text,purpose)=>{if(purpose==='project')runImport(text);else stageWorkspace(text)};
  // .json, gzip .niyav and protected .niyav all arrive here as bytes. A protected file waits for its password.
  const readPicked=async(purpose)=>{
    try{
      const bytes=await pickBytes();
      if(bytes===null){say(true,'No file selected.');return}
      if(niyavCodec.sniff(bytes)==='encrypted'){setLocked({bytes,purpose});setUnlockPw('');say(true,'This backup is password protected. Enter its password below.');return}
      setBusy('Opening backup…');await paint();
      route(await niyavCodec.decode(bytes),purpose);
    }catch(e){say(false,e.message)}finally{setBusy(null)}
  };
  const chooseProject=()=>readPicked('project');
  const chooseWorkspace=()=>readPicked('workspace');
  const unlock=async()=>{
    if(!locked||busy)return;
    const job=begin('Unlocking… leaving this screen cancels it.');
    try{
      await paint();
      const text=await niyavCodec.decode(locked.bytes,{password:unlockPw,...job});
      const purpose=locked.purpose;setLocked(null);setUnlockPw('');
      route(text,purpose);
    }catch(e){say(e.code==='NIYAV_CANCELLED',e.code==='NIYAV_CANCELLED'?'Cancelled. The backup was not opened.':e.message)}finally{end()}
  };

  const exportBackup=async(all)=>{
    if(busy)return;
    const base=all?'niyarvo-all-projects-backup':`${slug(chosen.name)}-backup`;
    let text;try{text=backupText(all,{snapshots:withSnapshots,projectId})}catch(e){say(false,e.message);return}
    const what=all?`Workspace backup includes ${projects.length} projects, programs and portfolios${withSnapshots?' and recovery snapshots':''}.`:'Backup of this project is ready.';
    if(fmt==='json'){if(await downloadText(`${base}.json`,text,'application/json'))say(true,what);return}
    if(protect){
      if(Array.from(pw).length<MIN_PASSWORD){say(false,`Use a password of at least ${MIN_PASSWORD} characters.`);return}
      if(pw!==pw2){say(false,'The two passwords do not match.');return}
    }
    const job=begin(protect?'Protecting your backup… leaving this screen cancels it.':'Compressing…');
    try{
      await paint();
      const bytes=await niyavCodec.encode(text,{password:protect?pw:undefined,level,...job});
      if(await downloadBytes(`${base}.niyav`,bytes,'application/octet-stream')){
        say(true,`${protect?'Password-protected':'Compressed'} backup is ready (${kb(bytes.length)}). ${what}`);
        if(protect){setPw('');setPw2('')}
      }
    }catch(e){say(e.code==='NIYAV_CANCELLED',e.code==='NIYAV_CANCELLED'?'Cancelled. No backup file was created.':e.message)}finally{end()}
  };

  return (
    <>
      {busy ? (
        <Card style={{ gap: 10 }}>
          <T size={13} weight="600">{busy}</T>
          {abortRef.current ? <><Bar value={progress || 0} /><T size={12} muted>{Math.round((progress || 0) * 100)}%</T></> : null}
          {abortRef.current ? <Button label="Cancel" small variant="secondary" onPress={cancel} /> : null}
        </Card>
      ) : null}
      {notice ? <T size={13} weight="600" color={notice.ok ? c.ink : c.accent}>{notice.text}</T> : null}

      {locked ? (
        <Card style={{ gap: 10 }}>
          <SectionTitle>Password required</SectionTitle>
          <T size={12} muted>This backup is password protected. The password is not stored anywhere.</T>
          <Input secure value={unlockPw} onChangeText={setUnlockPw} placeholder="Backup password" autoFocus onSubmitEditing={unlock} />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button label="Unlock" small variant="secondary" onPress={unlock} disabled={!!busy || !unlockPw} />
            <Button label="Cancel" small variant="ghost" onPress={() => { setLocked(null); setUnlockPw(''); }} />
          </View>
        </Card>
      ) : null}

      <Card style={{ gap: 12 }}>
        <SectionTitle>Back up</SectionTitle>
        <T size={12} muted>Saves a file you can import again later, here or on another device. .niyav is compressed and much smaller; add a password to protect sensitive data.</T>
        <Segmented options={[{ value: 'project', label: 'Project' }, { value: 'workspace', label: 'Workspace' }]} value={scope} onChange={setScope} />
        {scope === 'project'
          ? <Dropdown options={projects.map((p) => ({ value: p.id, label: p.archived ? `${p.name} (archived)` : p.name }))} value={projectId} onChange={setPickedId} />
          : <Dropdown options={[{ value: 'workspace', label: `This workspace · ${projects.length} project${projects.length === 1 ? '' : 's'}` }]} value="workspace" onChange={() => {}} />}
        <Segmented
          options={[{ value: 'json', label: '.json (readable)' }, { value: 'niyav', label: '.niyav (compressed)' }]}
          value={fmt}
          onChange={(v) => { setFmt(v); if (v === 'json') { setProtect(false); setPw(''); setPw2(''); } }}
        />
        {fmt === 'niyav' ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row' }}>
              <Chip label={protect ? 'Password protected' : 'Add a password'} active={protect} onPress={() => { setProtect(!protect); setPw(''); setPw2(''); }} />
            </View>
            {protect ? (
              <View style={{ gap: 8 }}>
                <Input secure value={pw} onChangeText={setPw} placeholder={`Password (${MIN_PASSWORD}+ characters)`} />
                <Input secure value={pw2} onChangeText={setPw2} placeholder="Repeat password" />
                <Segmented options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} value={level} onChange={pickLevel} />
                <T size={11} muted>{LEVEL_TEXT[level]} All three use AES-256 encryption; the level only sets how slow it is to guess the password. The level is saved in the file, so opening it never asks for it.</T>
                <T size={11} muted>The password is never stored or sent anywhere. If it is forgotten, this backup cannot be opened by anyone, including Niyarvo. Keep it somewhere safe.</T>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row' }}>
          <Chip label="Include recovery snapshots (larger file)" active={withSnapshots} onPress={() => setWithSnapshots(!withSnapshots)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Button label={scope === 'project' ? `Back up "${chosen.name}"` : 'Back up entire workspace'} icon="download" small disabled={!!busy} onPress={() => exportBackup(scope === 'workspace')} />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionTitle>Import project</SectionTitle>
        <T size={12} muted>Opens a .json or .niyav backup as a new project. Your current projects are not changed.</T>
        <Button label="Import .json or .niyav file" icon="upload" small variant="secondary" onPress={chooseProject} disabled={!!busy} />
      </Card>

      <Fold title="Full workspace recovery" subtitle="Restores projects, programs, portfolios and local history together. Explicit confirmation required.">
        <T size={12} muted>Only use a complete Niyarvo workspace backup (.json or .niyav). An automatic snapshot of the current workspace is created before replacement. To add projects without replacing your workspace, use Import project above.</T>
        <Button label="Choose workspace file" icon="upload" small variant="secondary" onPress={chooseWorkspace} disabled={!!busy}/>
        {wholeFile?<View style={{gap:8}}><T size={12} muted>{wholeFile.projects} project(s) in selected workspace. This replaces current workspace data after confirmation.</T><DangerConfirm label="Restore entire workspace" onConfirm={()=>{const r=restoreWorkspace(wholeFile.text);say(r.ok,r.ok?'Whole workspace restored; prior snapshot retained.':r.error);if(r.ok)setWholeFile(null)}}/><Button label="Cancel selection" small variant="ghost" onPress={()=>setWholeFile(null)}/></View>:null}
        <Button label="Create recovery snapshot" small variant="secondary" onPress={()=>{if(createSnapshot())say(true,'Local recovery snapshot created')}}/>
      </Fold>
      <Fold title="Recovery snapshots" subtitle={`${(workspace.backups||[]).length} saved recovery points`}>
        {(workspace.backups||[]).slice(0,12).map(sn=><View key={sn.id} style={{gap:8}}><T size={13} weight="600">{sn.label}</T><T muted size={11}>{sn.at}</T><DangerConfirm label="Restore snapshot" onConfirm={()=>{const ok=restoreSnapshot(sn.id);say(ok,ok?'Recovery snapshot restored.':'Restore failed')}}/></View>)}
      </Fold>
      <Card style={{ gap: 12 }}>
        <SectionTitle>Recover archived projects</SectionTitle>
        {archived.length === 0 ? (
          <Empty>No archived projects.</Empty>
        ) : (
          archived.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderColor: c.line }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={14} weight="600" numberOfLines={1}>{p.name}</T>
                <T size={11} muted>Release {p.release} · {p.tasks} task{p.tasks === 1 ? '' : 's'}</T>
              </View>
              <Button label="Recover" small variant="secondary" onPress={() => { recoverProject(p.id); say(true, `Recovered "${p.name}".`); }} />
              <Button label="Open" small variant="ghost" onPress={() => { recoverProject(p.id); switchProject(p.id); say(true, `Recovered and opened "${p.name}".`); }} />
            </View>
          ))
        )}
      </Card>
    </>
  );
}
