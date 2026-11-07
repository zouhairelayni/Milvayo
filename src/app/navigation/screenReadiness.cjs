// /src/app/navigation/screenReadiness.cjs
'use strict';
// A usable snapshot wins over refresh/transient flags. Empty is a usable result too.
function screenReadiness({ status = 'ready', hasData = false, preparing = false, offline = false, error = null } = {}) {
  if (hasData || status === 'empty') return { view: 'content', refreshing: status === 'refreshing' || status === 'loading', offline, error };
  if (error || status === 'error') return { view: 'error', refreshing: false, offline, error: error || 'Could not load this screen' };
  if (offline) return { view: 'offline', refreshing: false, offline: true, error: null };
  if (preparing || ['uninitialized', 'hydrating', 'loading'].includes(status)) return { view: 'skeleton', refreshing: false, offline: false, error: null };
  return { view: 'content', refreshing: false, offline: false, error: null };
}
module.exports = { screenReadiness };
