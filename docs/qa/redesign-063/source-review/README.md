# Source-rendered visual review

These HTML files render the actual redesigned JSX with React DOM Server and React Native Web, using the bundled sample project through the actual model/modern bridge. Calendar and empty-state fixtures render the actual components directly. Feather glyphs use the installed font. SVG elements use a small DOM adapter; theme and store contexts are injected, effects do not execute and actions are inert.

**These are component composition/contrast/artwork checks, not screenshots of a running Expo app, Android, live gestures or animation.** The desktop overview fixture omits the desktop shell. The shell in phone fixtures uses the real header/dock components, with fixed review props. See `manifest.json` and `capture-results.json`. Runtime app preview failures are retained in the parent QA directory and are not accepted screenshot evidence. No model data is persisted by this renderer.

Tour artwork follow-up: `tour-artwork.svg` renders the actual supplied TourArtwork component JSX with a static SVG adapter and theme palette; `tour-artwork.png` is its librsvg rasterization. Five kinds are shown in Dark, Light and AMOLED and were opened for visual inspection. Reveal is omitted, no app/store/gesture effects execute, and these are not screenshots of the whole running tour.
