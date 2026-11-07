// /src/cloud/useCloudPresence.js
import {useEffect,useState} from 'react';
import {useCloudSession} from './useCloudSession';
export function useCloudPresence(projectId,resource,editing=false){
 const {session,state}=useCloudSession(),connected=state.connected,scopeKey=[state.scope?.uid,state.scope?.orgId,state.scope?.workspaceId,state.grant?.version].join('/'),[peers,setPeers]=useState([]);
 useEffect(()=>{let cancelled=false,stop;setPeers([]);if(connected&&session&&projectId&&resource)session.watch(projectId,resource,editing,values=>{if(!cancelled)setPeers(values);}).then(cleanup=>{if(cancelled)void cleanup();else stop=cleanup;}).catch(()=>{});return()=>{cancelled=true;void stop?.();};},[session,connected,scopeKey,projectId,resource,editing]);
 return {viewers:new Set(peers.map(p=>p.uid)).size,editing:peers.some(p=>p.state==='editing'||p.state==='typing'),typing:peers.some(p=>p.state==='typing')};
}
