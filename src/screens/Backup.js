import { useState } from 'react';
import { Platform, View } from 'react-native';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
const {MAX_IMPORT_BYTES}=require('../importFiles.cjs');
import { Button, Card, Empty, Page, SectionTitle, T, downloadText } from '../ui';
import { useStore } from '../store';
import {Fold,DangerConfirm} from './CompactTools';
import { useTheme } from '../theme';

const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';

// Web only: opens the file picker and hands back the text of the chosen file.
function pickTextFile(done) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.addEventListener('cancel',()=>done(null));
  input.onchange = () => {
    const f = input.files && input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => done(String(r.result || ''));
    r.readAsText(f);
  };
  input.click();
}

export default function Backup() {
  const { c } = useTheme();
  const { s, projects, backupText, importProject, restoreWorkspace, createSnapshot, recoverProject, switchProject, workspace, restoreSnapshot } = useStore();
  const [notice, setNotice] = useState(null); // { ok, text }
  const [wholeFile,setWholeFile]=useState(null); // selected full-workspace JSON, not yet applied
  const archived = projects.filter((p) => p.archived);

  const say = (ok, text) => setNotice({ ok, text });
  const runImport = (text) => {
    if(text.length>5*1024*1024){say(false,'Import exceeds 5 MB limit');return;}
    const r = importProject(text);
    if (r.ok) {
      say(true, r.names.length === 1 ? `Imported "${r.names[0]}" and opened it.` : `Imported ${r.names.length} projects. "${r.names[r.names.length - 1]}" is open.`);
    } else say(false, r.error);
  };

  const pickJson = async () => {
    if(Platform.OS==='web')return new Promise(resolve=>pickTextFile(resolve));
    const selection=await DocumentPicker.getDocumentAsync({type:['application/json','text/json','text/plain'],copyToCacheDirectory:true,multiple:false});
    if(selection.canceled||!selection.assets?.length)return null;
    const asset=selection.assets[0];
    if(!asset.name?.toLowerCase().endsWith('.json'))throw Error('Choose a .json file.');
    if(asset.size>MAX_IMPORT_BYTES)throw Error('File exceeds 5 MB limit.');
    const text=await new File(asset.uri).text();
    if(text.length>MAX_IMPORT_BYTES)throw Error('File exceeds 5 MB limit.');
    return text.charCodeAt(0)===0xFEFF?text.slice(1):text;
  };
  const chooseProject=async()=>{try{const text=await pickJson();if(text!==null)runImport(text)}catch(e){say(false,e.message)}};
  const chooseWorkspace=async()=>{try{const text=await pickJson();if(text===null)return;const payload=JSON.parse(text);if(payload.format!=='niyarvo.workspace.v1'||!payload.workspace||!Array.isArray(payload.workspace.projects))throw Error('Select a complete Niyarvo workspace backup.');setWholeFile({text,name:'Selected workspace',projects:payload.workspace.projects.length});}catch(e){say(false,e.message)}};
  return (
    <Page title="Backup" subtitle="Import, export and recover project data. Files stay on this device.">
      {notice ? <T size={13} weight="600" color={notice.ok ? c.ink : c.accent}>{notice.text}</T> : null}

      <Card style={{ gap: 12 }}>
        <SectionTitle>Back up</SectionTitle>
        <T size={12} muted>Downloads a JSON file you can import again later, here or on another device.</T>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Button
            label={`Back up "${s.project.name}"`}
            icon="download"
            small
            onPress={() => { downloadText(`${slug(s.project.name)}-backup.json`, backupText(false), 'application/json'); say(true, 'Backup of this project is ready.'); }}
          />
          <Button
              label="Back up entire workspace"
              icon="download"
              small
              variant="secondary"
              onPress={() => { downloadText('niyarvo-all-projects-backup.json', backupText(true), 'application/json'); say(true, `Workspace backup includes ${projects.length} projects, programs, portfolios and local history.`); }}
            />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionTitle>Import project</SectionTitle>
        <T size={12} muted>Opens a backup file as a new project. Your current projects are not changed.</T>
        <Button label="Import .json file" icon="upload" small variant="secondary" onPress={chooseProject} />
      </Card>

      <Fold title="Full workspace recovery" subtitle="Restores projects, programs, portfolios and local history together. Explicit confirmation required.">
        <T size={12} muted>Only use a complete Niyarvo workspace JSON backup. An automatic snapshot of the current workspace is created before replacement. To add projects without replacing your workspace, use Import project above.</T>
        <Button label="Choose workspace .json" icon="upload" small variant="secondary" onPress={chooseWorkspace}/>
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
    </Page>
  );
}
