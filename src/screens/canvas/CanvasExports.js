// /src/screens/canvas/CanvasExports.js
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, T, downloadText } from '../../ui/ui';
import DiagramExports from '../../governance/DiagramExports';
import { exportScene } from '../../canvas/scene';
const {exportBoard}=require('../../domain/canvas.cjs');
const {readSource}=require('../../canvas/sources.cjs');
function structuredCSV(board,project){
 const rows=[];for(const o of board.objects){if(o.type!=='linked')continue;const data=readSource(project,o.sourceLink);if(!data.available)continue;
  if(data.kind==='roadmap')data.tasks.forEach(t=>rows.push(['task',t.id,t.title,t.status,t.owner,t.start,t.due]));
  else if(['task','risk','stakeholder'].includes(o.sourceLink.sourceType))rows.push([o.sourceLink.sourceType,o.sourceLink.sourceId,data.title,...data.lines]);
 }
 const quote=value=>{const text=String(value??''),safe=/^[=+\-@\t\r]/.test(text)?"'"+text:text;return '"'+safe.replace(/"/g,'""')+'"';};return rows.length?['source_type,source_id,title,detail_1,detail_2,detail_3,detail_4',...rows.map(row=>row.map(quote).join(','))].join('\n'):null;
}
export default function CanvasExports({board,project,scope}){
 const [requested,setRequested]=useState(false),[message,setMessage]=useState('');
 const scene=useMemo(()=>requested?exportScene(board,project,scope):null,[requested,board,project,scope]);
 const csv=useMemo(()=>requested?structuredCSV(board,project):null,[requested,board,project]);
 return <View style={{gap:8}}><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center'}}>
  <DiagramExports scene={scene} name={board.title} kind="outline" fileKind="canvas" subject="canvas" onOpen={()=>setRequested(true)} getCSV={csv?()=>csv:undefined}/>
  <Button label="Board backup" icon="download" variant="secondary" onPress={async()=>{setMessage(await downloadText(`${board.id}.json`,exportBoard(board),'application/json')?'Board backup prepared':'Backup could not be exported');}}/>
 </View>{message?<T accessibilityLiveRegion="polite">{message}</T>:null}</View>;
}
