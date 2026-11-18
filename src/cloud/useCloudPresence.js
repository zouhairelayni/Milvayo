// /src/cloud/useCloudPresence.js
import {useEffect,useRef,useState} from 'react';
import {useCloudSession} from './useCloudSession';
export function useCloudPresence(projectId,resource,editing=false){
 const {session,state}=useCloudSession(),connected=state.connected,scopeKey=[state.scope?.uid,state.scope?.orgId,state.scope?.workspaceId,state.grant?.version].join('/'),[peers,setPeers]=useState([]),handle=useRef(null),latest=useRef(editing);
 latest.current=editing;
 // Subscribing depends only on WHERE I am (project and resource). Typing or editing must never tear the listener down.
 useEffect(()=>{let cancelled=false,stop;setPeers([]);handle.current=null;if(connected&&session&&projectId&&resource)session.watch(projectId,resource,latest.current,values=>{if(!cancelled)setPeers(values);}).then(cleanup=>{if(cancelled)void cleanup();else{stop=cleanup;handle.current=cleanup;cleanup.setState?.(latest.current);}}).catch(()=>{});return()=>{cancelled=true;handle.current=null;void stop?.();};},[session,connected,scopeKey,projectId,resource]);
 // A state change is published on the open session.
 useEffect(()=>{handle.current?.setState?.(editing);},[editing]);
 return {viewers:new Set(peers.map(p=>p.uid)).size,editing:peers.some(p=>p.state==='editing'||p.state==='typing'),typing:peers.some(p=>p.state==='typing')};
}
