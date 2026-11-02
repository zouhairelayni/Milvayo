// /src/app/navigation/pageRetention.cjs
// Decides whether a retained tab page must re-render. Hidden pages ignore everything except becoming visible,
// so typing in search, project notices or navigation elsewhere never re-renders a screen nobody can see.
function shouldRenderPage(prev, next) {
 if (prev.pageId !== next.pageId || prev.active !== next.active) return true;
 if (prev.openTask !== next.openTask || prev.go !== next.go) return true;
 if (!next.active) return false;
 return prev.query !== next.query || prev.statusRequest !== next.statusRequest;
}
// Web keeps its established policy (heavy hidden screens unmount). Native retains visited primary tabs.
function retainsHiddenTabs(platform) { return platform !== 'web'; }
module.exports = { shouldRenderPage, retainsHiddenTabs };
