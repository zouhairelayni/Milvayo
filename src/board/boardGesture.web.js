// /src/board/boardGesture.web.js
// Web: use the original MockDesign responder and document-level drag continuation.
export { useHoldDrag } from '../gestures/gesture';

// The web mock uses native browser scroll arbitration.
export function cancelPendingBoardHolds() {}
