// /src/screens/onboarding/freshInstall.js
import AsyncStorage from '@react-native-async-storage/async-storage';
const { INDEX_KEY, MAIN_KEY, KEY_PREFIX } = require('../../store/workspaces.cjs');
const { isFreshInstall } = require('./onboardingPlan.cjs');
const { markFreshInstall } = require('./tourEvents.cjs');

// Issue both reads on module load, before StoreProvider can establish the sample.
// Orphan/recovered workspace data is an existing install too. Read failures skip the automatic tour.
export const freshInstallProbe = (()=>{
 let pending;
 try{
  pending=AsyncStorage.multiGet([INDEX_KEY, MAIN_KEY]);
  return Promise.all([pending,AsyncStorage.getAllKeys()])
   .then(([entries,keys])=>{const values=new Map(entries);
    if(values.has(INDEX_KEY)&&values.has(MAIN_KEY)&&Array.isArray(keys)&&isFreshInstall(values.get(INDEX_KEY),values.get(MAIN_KEY))&&!keys.some(key=>key.startsWith(KEY_PREFIX)))markFreshInstall();
   }).catch(()=>{});
 }catch{Promise.resolve(pending).catch(()=>{});return Promise.resolve();}
})();
