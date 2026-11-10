// /src/screens/workspace/Backup.js
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { loadBackupLevel, saveBackupLevel } from '../../store/backupLevel';
const { DEFAULT_LEVEL } = require('../../store/niyav.cjs');
const {MAX_IMPORT_BYTES,tooBig,parseBackupJson,pickAndroidFileBytes,pickDocumentFileBytes}=require('../../store/importFiles.cjs');
import { niyavCodec } from '../../store/niyavPrimitives';
import { backupJobs } from '../../store/backupJobs';
import { Feedback, EmptyState, Bar, Button, Card, Chip, Input, SectionTitle, Segmented, T, downloadBytes, downloadText } from '../../ui/ui';
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
    if (f.size > MAX_IMPORT_BYTES) { fail(new Error('This backup exceeds the 5 MB import limit. Choose a smaller file.')); return; } // check before reading, so a huge file never loads into memory
    const r = new FileReader();
    r.onload = () => done(new Uint8Array(r.result));
    r.onerror = () => fail(new Error('The selected file could not be read. Check its access permissions and try again.'));
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
  const [section,setSection]=useState('export');
  const [scope, setScope] = useState('project'); // what to back up: 'project' | 'workspace'
  const [pickedId, setPickedId] = useState(null);
  const [jobState, setJobState] = useState(() => backupJobs.getState());
  useEffect(() => { const unsubscribe = backupJobs.subscribe(setJobState); backupJobs.hydrate(); return unsubscribe; }, []);
  const projectId = projects.some((p) => p.id === pickedId) ? pickedId : s.project.id;
  const chosen = projects.find((p) => p.id === projectId) || s.project;
  useEffect(() => { let live = true; loadBackupLevel().then((v) => { if (live) setLevel(v); }); return () => { live = false; }; }, []);
  const pickLevel = (v) => { setLevel(v); saveBackupLevel(v); };
  const [locked, setLocked] = useState(null); // { bytes, purpose } protected file waiting for its password
  const [unlockPw, setUnlockPw] = useState('');
  const archived = projects.filter((p) => p.archived);
  useEffect(() => { if (jobState.decrypted) setLocked(null); }, [jobState.decrypted]);

  const say = (ok, text) => setNotice({ ok, text });
  const runImport = (text, originWorkspaceId = workspaceId) => {
    if(tooBig(text)){say(false,'Import exceeds 5 MB limit');return;}
    const r = importProject(text, originWorkspaceId); // the file may take seconds to open; refuse if another workspace is open by now
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
  const stageWorkspace=(text)=>{if(tooBig(text))throw Error('This backup exceeds the 5 MB import limit. Choose a smaller file.');const payload=parseBackupJson(text);if(payload.format!=='niyarvo.workspace.v1'||payload.workspace?.schemaVersion!==1||!Array.isArray(payload.workspace?.projects)||!payload.workspace.projects.length)throw Error('This is not a complete Milvayo workspace backup. Choose a .json or .niyav workspace backup with at least one project.');setWholeFile({text,name:'Selected workspace',projects:payload.workspace.projects.length})};
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
  const unlock=()=>{
    if(!locked||busy||jobState.running)return;
    try {
      // The job owns these bytes and the password while it runs. Nothing secret is stored on disk.
      backupJobs.startUnlock({ bytes: locked.bytes, password: unlockPw, purpose: locked.purpose, workspaceId });
      // Keep the selected ciphertext in memory so a wrong password can be retried without picking the file again.
      setUnlockPw('');
      say(true,'Checking password in the background. You can navigate away and retry here if it fails.');
    } catch (e) { say(false,e.message); }
  };
  const applyDecrypted=()=>{
    const result=backupJobs.getDecrypted();
    if(!result)return;
    try {
      if(result.purpose==='project') {
        if(result.workspaceId!==workspaceId){say(false,'You switched workspaces while unlocking. Return to the original workspace to import this file.');return;}
        runImport(result.text,result.workspaceId);
        backupJobs.discardDecrypted();
      } else {
        stageWorkspace(result.text);
        backupJobs.discardDecrypted();
        say(true,'Workspace file decrypted. Review the restore confirmation below.');
      }
    } catch(e){say(false,e.message);}
  };
  const exportBackup=async(all)=>{
    if(busy||jobState.running)return;
    const base=all?'milvayo-all-projects-backup':`${slug(chosen.name)}-backup`;
    let text;try{text=backupText(all,{snapshots:withSnapshots,projectId})}catch(e){say(false,e.message);return}
    if(fmt==='json'){
      if(await downloadText(`${base}.json`,text,'application/json'))say(true,'JSON backup exported.');
      return;
    }
    if(!protect){
      try { setBusy('Compressing backup…'); await paint();
        const bytes = await niyavCodec.encode(text);
        if(await downloadBytes(`${base}.niyav`, bytes, 'application/octet-stream')) say(true,'Compressed .niyav file exported. This file is NOT password protected.');
      } catch(e){say(false,e.message);} finally{setBusy(null)}
      return;
    }
    if(protect){
      if(Array.from(pw).length<MIN_PASSWORD){say(false,`Use a password of at least ${MIN_PASSWORD} characters.`);return}
      if(pw!==pw2){say(false,'The two passwords do not match.');return}
    }
    try {
      // Create a fixed snapshot NOW: later edits do not change the export that is being encrypted.
      backupJobs.startExport({ filename: `${base}.niyav`, text, password: protect?pw:undefined, level, protected:protect });
      setPw('');setPw2('');
      say(true,'Encrypted backup started. You may visit other screens. Return here to download the finished file.');
    } catch(e){say(false,e.message);}
  };
  const downloadReady=async()=>{try{await backupJobs.shareReady();say(true,'The encrypted file is still saved here and can be downloaded again.');}catch(e){say(false,e.message)}};
  const discardReady=async()=>{try{await backupJobs.discardReady();say(true,'Saved encrypted file removed from this device.');}catch(e){say(false,e.message)}};

  return (
    <>
      <Segmented fill options={[{value:'export',label:'Export'},{value:'import',label:'Import'},{value:'recovery',label:'Recovery'}]} value={section} onChange={setSection}/>
      {jobState.running ? (
        <Card style={{ gap: 10 }}>
          <SectionTitle>{jobState.running.label}</SectionTitle>
          <Bar value={jobState.running.progress || 0} />
          <T size={12} muted>{Math.round((jobState.running.progress || 0) * 100)}% {jobState.running.kind === 'decrypt' ? 'checking password and unlocking' : 'deriving the encryption key'}. On Android, a correct and incorrect password require the same expensive key check. This protects against rapid password guessing. You can navigate away; switching apps may pause progress.</T>
          <Button label="Cancel operation" small variant="secondary" onPress={backupJobs.cancel} />
        </Card>
      ) : null}
      {jobState.ready ? (
        <Card style={{ gap: 10 }}>
          <SectionTitle>Backup ready to download</SectionTitle>
          <T size={12} muted>{jobState.ready.name} · {kb(jobState.ready.bytes)} · {jobState.ready.protected?'AES-256 protected':'Compressed'}. {Platform.OS==='web'?'The file remains available while this web tab stays open; download before reloading.':'The finished file is kept in app storage across normal restarts.'} Sharing does not delete it.</T>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button label="Download backup" icon="download" small onPress={downloadReady} />
            <DangerConfirm label="Discard saved backup" onConfirm={discardReady} />
          </View>
        </Card>
      ) : null}
      {jobState.decrypted ? (
        <Card style={{ gap: 10 }}>
          <SectionTitle>Decryption complete</SectionTitle>
          <T size={12} muted>The password-protected file was opened in memory. No project has been imported or replaced yet. Review the result before applying it.</T>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button label={jobState.decrypted.purpose==='project'?'Import decrypted project':'Review workspace restore'} small onPress={applyDecrypted} />
            <Button label="Discard decrypted data" small variant="ghost" onPress={backupJobs.discardDecrypted} />
          </View>
        </Card>
      ) : null}
      {jobState.interrupted ? <T size={12} muted>{jobState.interrupted}</T> : null}
      {jobState.error ? <T size={12} color={c.accent}>{jobState.error}</T> : null}
      {busy ? <Card style={{ gap: 10 }}><T size={13} weight="600">{busy}</T></Card> : null}
      {notice ? <Feedback type={notice.ok?'success':'danger'} text={notice.text}/> : null}

      {locked && !jobState.running && !jobState.decrypted ? (
        <Card style={{ gap: 10 }}>
          <SectionTitle>Password required</SectionTitle>
          <T size={12} muted>This backup is password protected. To safely detect a wrong password, the entire key-derivation step must finish. This can take time on Android; a fast password hint would weaken offline protection.</T>
          <Input secure value={unlockPw} onChangeText={setUnlockPw} placeholder="Backup password" autoFocus onSubmitEditing={unlock} />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button label="Unlock" small variant="secondary" onPress={unlock} disabled={!!busy || !!jobState.running || !unlockPw} />
            <Button label="Cancel" small variant="ghost" onPress={() => { setLocked(null); setUnlockPw(''); }} />
          </View>
        </Card>
      ) : null}

      <View style={{display:section==='export'?'flex':'none',gap:16}}>
      <Card style={{ gap: 12 }}>
        <SectionTitle>Protect your work</SectionTitle>
        <T size={12} muted>JSON and unprotected .niyav files download immediately. Password-protected backups continue if you navigate away; return here to download the encrypted result. The app must remain installed. Android or iOS may pause the operation when you switch apps; interrupted work must be restarted.</T>
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
                {pw2 ? <T size={12} color={pw===pw2?c.ink:'#E0512D'} accessibilityRole="text">{pw===pw2?'Passwords match. Ready to encrypt.':'Passwords do not match. Nothing will be encrypted.'}</T> : null}
                <Segmented options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} value={level} onChange={pickLevel} />
                <T size={11} muted>{LEVEL_TEXT[level]} All three use AES-256 encryption; the level only sets how slow it is to guess the password. The level is saved in the file, so opening it never asks for it.</T>
                <T size={11} muted>The password is never stored or sent anywhere. If you forget it, the backup cannot be opened. Keep it somewhere safe.</T>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row' }}>
          <Chip label="Include recovery snapshots (larger file)" active={withSnapshots} onPress={() => setWithSnapshots(!withSnapshots)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Button label={scope === 'project' ? `Back up "${chosen.name}"` : 'Back up entire workspace'} icon="download" small disabled={!!busy || !!jobState.running || (fmt==='niyav' && protect && (Array.from(pw).length<MIN_PASSWORD || pw!==pw2))} onPress={() => exportBackup(scope === 'workspace')} />
        </View>
      </Card>

      </View>
      <View style={{display:section==='import'?'flex':'none',gap:16}}>
      <Card style={{ gap: 12 }}>
        <SectionTitle>Import project</SectionTitle>
        <T size={12} muted>Opens a .json or .niyav backup as a new project. Your current projects are not changed.</T>
        <Button label="Import .json or .niyav file" icon="upload" small variant="secondary" onPress={chooseProject} disabled={!!busy || !!jobState.running} />
      </Card>

      </View>
      <View style={{display:section==='recovery'?'flex':'none',gap:16}}>
      <Feedback type="warning" text="Recovery can replace current workspace data. Export a backup first; every restore still asks for confirmation."/>
      <Fold title="Full workspace recovery" subtitle="Restores projects, programs, portfolios and local history together. Explicit confirmation required.">
        <T size={12} muted>Choose a complete Milvayo workspace backup (.json or .niyav). A recovery snapshot is created before replacement. To add projects without replacing this workspace, use Import project above.</T>
        <Button label="Choose workspace file" icon="upload" small variant="secondary" onPress={chooseWorkspace} disabled={!!busy || !!jobState.running}/>
        {wholeFile?<View style={{gap:8}}><T size={12} muted>{wholeFile.projects} project(s) in selected workspace. This replaces current workspace data after confirmation.</T><DangerConfirm label="Restore entire workspace" onConfirm={()=>{const r=restoreWorkspace(wholeFile.text);say(r.ok,r.ok?'Whole workspace restored; prior snapshot retained.':r.error);if(r.ok)setWholeFile(null)}}/><Button label="Cancel selection" small variant="ghost" onPress={()=>setWholeFile(null)}/></View>:null}
        <Button label="Create recovery snapshot" small variant="secondary" onPress={()=>{if(createSnapshot())say(true,'Local recovery snapshot created')}}/>
      </Fold>
      <Fold title="Recovery snapshots" subtitle={`${(workspace.backups||[]).length} saved recovery points`}>
        {(workspace.backups||[]).slice(0,12).map(sn=><View key={sn.id} style={{gap:8}}><T size={13} weight="600">{sn.label}</T><T muted size={11}>{sn.at}</T><DangerConfirm label="Restore snapshot" onConfirm={()=>{const ok=restoreSnapshot(sn.id);say(ok,ok?'Recovery snapshot restored.':'Restore failed')}}/></View>)}
      </Fold>
      <Card style={{ gap: 12 }}>
        <SectionTitle>Recover archived projects</SectionTitle>
        {archived.length === 0 ? (
          <EmptyState compact title="Nothing archived" description="Archived projects stay recoverable and appear here."/>
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
      </View>
    </>
  );
}
