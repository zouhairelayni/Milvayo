// /src/canvas/useCanvasCamera.native.js
import {useMemo} from 'react';
import {useSharedValue} from 'react-native-reanimated';
export function useCanvasCamera(initial){const pose=useSharedValue(initial),drag=useSharedValue(null);return useMemo(()=>({pose,drag}),[pose,drag]);}
