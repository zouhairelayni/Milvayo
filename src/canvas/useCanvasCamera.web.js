// /src/canvas/useCanvasCamera.web.js
import {useMemo,useRef} from 'react';
export function useCanvasCamera(initial){const pose=useRef(initial),drag=useRef(null);return useMemo(()=>({pose,drag}),[]);}
