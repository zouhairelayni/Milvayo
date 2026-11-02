# v0.5.21 performance batch
Why: your v0.5.20 report showed Projects 96 renders (many 100-138 ms, timer stalls up to 1.3 s), Tasks max 146 ms.
Cause: text fields saved into the store on every key (full save + whole-app redraw per key).
- `Input` has a new `lazy` option (src/ui/commitBuffer.cjs): typed text stays in the field and is saved 300 ms after you pause, on leaving the field, on Enter and when the screen closes. Used on project governance, documents, risks, WBS, owner/list rows, and the task sheet text fields.
- projectMetric (project totals) is cached per project object (Projects, Portfolios, Programs).
- Recovery-snapshot sizes are measured once per snapshot (keeps the size check from batch 05 cheap).
- Not touched: Timeline / Board gestures and drag code.
Version label: 0.5.21. app.json / package.json are yours: set "version": "0.5.21".
Tests: 482, 0 fail. JSX parse of all 63 source files: 0 errors. Device run: Not run. Undo: restore the batch 05 zip.
