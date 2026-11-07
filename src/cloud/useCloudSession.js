// /src/cloud/useCloudSession.js
import {useEffect,useState} from 'react';
import {useStoreActions} from '../store/store';
export function useCloudSession(){const api=useStoreActions(),session=api?.cloudSession?.(),[state,setState]=useState(()=>session?.getState()||{connected:false});useEffect(()=>{if(!session)return;const stop=session.subscribe(setState);setState(session.getState());return stop;},[session]);return {session,state};}
