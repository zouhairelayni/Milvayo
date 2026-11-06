# Source composition evidence

Projects before/after and final Board fixtures use the real JSX, React DOM server, RN Web primitives, injected local sample data and an SVG adapter. Effects/actions are inert. These are not running Expo or Android screenshots and cannot establish gesture, native layout, font-scaling or FPS acceptance. The shell wrapper is simplified; routing is not exercised. Projects widths: 320, 390, 780, 1440; final Board: 390, with 20 synthetic cards and only five initially rendered. All fixture data is ephemeral and never persisted.

The separate paired-render-benchmark.json is the final timing evidence. It alternates old/new Projects components within one warmed process, enforcing the native initial mount policy through a FlatList adapter. It measures JS wall time, not native CPU/FPS or actual browser latency. Exploratory unpaired timing files were removed.
