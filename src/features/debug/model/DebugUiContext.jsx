/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const DebugUiContext = createContext();

const DEBUG_UI_STORAGE_KEY = 'debug-ui-visible';
const IS_DEV = import.meta.env.DEV;

function restoreInitialVisibility() {
  if (!IS_DEV || typeof window === 'undefined') {
    return false;
  }

  const storedValue = window.localStorage.getItem(DEBUG_UI_STORAGE_KEY);
  if (storedValue === 'false') {
    return false;
  }
  if (storedValue === 'true') {
    return true;
  }

  return true;
}

export function DebugUiProvider({ children }) {
  const [isDebugUiVisible, setIsDebugUiVisible] = useState(restoreInitialVisibility);

  useEffect(() => {
    if (!IS_DEV || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(DEBUG_UI_STORAGE_KEY, String(isDebugUiVisible));
  }, [isDebugUiVisible]);

  const toggleDebugUi = useCallback(() => {
    if (!IS_DEV) {
      return;
    }

    setIsDebugUiVisible((prevState) => !prevState);
  }, []);

  const value = useMemo(() => ({
    isDebugBuild: IS_DEV,
    isDebugUiVisible: IS_DEV && isDebugUiVisible,
    toggleDebugUi,
  }), [isDebugUiVisible, toggleDebugUi]);

  return <DebugUiContext.Provider value={value}>{children}</DebugUiContext.Provider>;
}

export function useDebugUi() {
  const context = useContext(DebugUiContext);
  if (!context) {
    throw new Error('useDebugUi must be used within a DebugUiProvider');
  }
  return context;
}
