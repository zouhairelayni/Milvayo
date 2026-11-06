// /src/diagnostics/useRenderMetric.js
import { useLayoutEffect } from 'react';
import { diagnosticMonitor } from './monitor';

// Release React omits Profiler callbacks. This measures elapsed JS time through commit,
// including child work/scheduling; it must never be reported as React CPU duration.
export function useRenderMetric(screen) {
  const started = diagnosticMonitor.now();
  useLayoutEffect(() => {
    diagnosticMonitor.recordCommit(screen, Math.max(0, diagnosticMonitor.now() - started));
    if (screen === 'shell') diagnosticMonitor.recordStartup('shell first render start', '', started);
  });
}
