// /src/store/backupLevel.js
import AsyncStorage from '@react-native-async-storage/async-storage';
const { LEVELS, DEFAULT_LEVEL } = require('./niyav.cjs');

// Remembers the last protection level (low | medium | high). Holds no password and nothing else.
const KEY = 'niyarvo.backupLevel';
export const loadBackupLevel = async () => { try { const v = await AsyncStorage.getItem(KEY); return v && Object.prototype.hasOwnProperty.call(LEVELS, v) ? v : DEFAULT_LEVEL; } catch { return DEFAULT_LEVEL; } };
export const saveBackupLevel = (level) => { if (Object.prototype.hasOwnProperty.call(LEVELS, level)) AsyncStorage.setItem(KEY, level).catch(() => {}); };
