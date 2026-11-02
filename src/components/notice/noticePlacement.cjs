// /src/components/notice/noticePlacement.cjs
'use strict';

// This host draws at the window level, outside the SafeAreaView's padded content.
// Use the platform inset and Android status bar height (when edge-to-edge Expo Go
// reports no top inset) so the island never starts behind system icons/cutouts.
const safeNumber = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
function noticeTopOffset(insets, platform, statusBarHeight) {
  const topInset = safeNumber(insets && insets.top);
  const androidFallback = platform === 'android' ? safeNumber(statusBarHeight) : 0;
  return Math.max(topInset, androidFallback) + 10;
}
module.exports = { noticeTopOffset };
