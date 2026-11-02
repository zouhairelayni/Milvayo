// /src/gestures/TimelineGestureHost.js
import React from 'react';
// Web and fallback: no native gesture wrapper. Timeline uses pointer/PanResponder gestures there.
export default function TimelineGestureHost({ children }) { return <>{children}</>; }
