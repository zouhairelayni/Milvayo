// /src/screens/onboarding/tourEvents.cjs
'use strict';
// A small event hub for the module-load fresh probe, committed shell and More replay entry.
//  - requestTour(): "Take the tour" in More asks the shell to open the tour.
//  - markFreshInstall(): the module-load probe saw a true first launch. If the shell is already listening it opens at once,
//    otherwise the flag waits for the shell's committed subscription.
const listeners = new Set();
let fresh = false;
const subscribeTour = (fn) => { listeners.add(fn); if(fresh){fresh=false;fn();} return () => { listeners.delete(fn); }; };
const requestTour = () => { listeners.forEach((fn) => fn()); };
const markFreshInstall = () => { if (listeners.size) requestTour(); else fresh = true; };
const takeFreshInstall = () => { const was = fresh; fresh = false; return was; };
module.exports = { subscribeTour, requestTour, markFreshInstall, takeFreshInstall };
