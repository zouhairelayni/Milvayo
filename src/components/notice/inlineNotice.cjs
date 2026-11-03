// /src/components/notice/inlineNotice.cjs
'use strict';

// Android draws a native Modal in its own window above the app, so the island notice (mounted in the app shell) is hidden
// behind the Task Sheet and the phone side menu. Those surfaces show the same error inline with this rule.
// `ignoredId` is the notice that was already on screen when the surface opened, so an old error is not shown again.
function inlineErrorText(notice, ignoredId) {
  if (!notice || notice.type !== 'error' || notice.id === ignoredId) return '';
  return String(notice.text || '');
}
module.exports = { inlineErrorText };
