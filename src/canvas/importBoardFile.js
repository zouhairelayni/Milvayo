// /src/canvas/importBoardFile.js
import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
const {pickAndroidJsonText,pickDocumentJsonText,tooBig}=require('../store/importFiles.cjs');
export async function importBoardFile(){
 if(Platform.OS==='android')return pickAndroidJsonText(File);
 if(Platform.OS!=='web')return pickDocumentJsonText(await DocumentPicker.getDocumentAsync({type:'application/json',copyToCacheDirectory:true,multiple:false}),File);
 return new Promise((resolve,reject)=>{
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
  input.oncancel=()=>resolve(null);input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return resolve(null);if(file.size>2*1024*1024+10000)throw Error('Canvas file exceeds 2 MB');const text=await file.text();if(tooBig(text,2*1024*1024+10000))throw Error('Canvas file exceeds 2 MB');resolve(text);}catch(e){reject(e);}};input.click();
 });
}
