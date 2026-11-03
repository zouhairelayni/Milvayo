// /src/ui/downloadText.js
import { Alert, Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Real cross-platform exports; native uses SDK 58 File + Android/iOS share sheet.
export async function downloadText(name, text, mime = 'text/plain') {
  try {
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } else {
      const safeName = String(name).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const file = new File(Paths.cache, `${Date.now()}-${safeName}`);
      file.create();
      await file.write(text);
      if (!await Sharing.isAvailableAsync()) throw new Error('System file sharing unavailable');
      await Sharing.shareAsync(file.uri, {mimeType:mime, dialogTitle:'Export Niyarvo Projects file'});
    }
    return true;
  } catch (error) {
    Alert.alert('Export failed', error.message);
    return false;
  }
}

// Binary export for .niyav files (gzip or password protected). Same paths as downloadText, bytes instead of text.
export async function downloadBytes(name, bytes, mime = 'application/octet-stream') {
  try {
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } else {
      const safeName = String(name).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const file = new File(Paths.cache, `${Date.now()}-${safeName}`);
      file.create();
      await file.write(bytes);
      if (!await Sharing.isAvailableAsync()) throw new Error('System file sharing unavailable');
      await Sharing.shareAsync(file.uri, {mimeType:mime, dialogTitle:'Export Niyarvo Projects file', UTI:'public.data'});
    }
    return true;
  } catch (error) {
    Alert.alert('Export failed', error.message);
    return false;
  }
}
