// /src/components/shell/HeaderActions.js
import { createContext, useContext, useEffect } from 'react';

export const HeaderActionsContext = createContext(null);

// Only the visible screen registers its context-specific header controls.
export function useHeaderActions(screen, controls, active = true) {
  const register = useContext(HeaderActionsContext);
  useEffect(() => {
    if (!register || !active) return undefined;
    register({ screen, controls });
    return () => register(current => current?.screen === screen ? null : current);
  }, [register, screen, controls, active]);
}
