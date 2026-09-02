import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  MobileBottomActionsContext,
  type MobileBottomActionsContextValue,
} from './mobileBottomActionContext';

const useRegistrationSet = () => {
  const registrations = useRef(new Set<string>());
  const [count, setCount] = useState(0);
  const register = useCallback((id: string) => {
    registrations.current.add(id);
    setCount(registrations.current.size);
    return () => {
      registrations.current.delete(id);
      setCount(registrations.current.size);
    };
  }, []);
  return { active: count > 0, register };
};

const MobileBottomActionsProvider = ({ children }: { children: ReactNode }) => {
  const pageActions = useRegistrationSet();
  const blockingOverlays = useRegistrationSet();
  const value = useMemo<MobileBottomActionsContextValue>(() => ({
    hasBlockingOverlay: blockingOverlays.active,
    hasPageAction: pageActions.active,
    registerBlockingOverlay: blockingOverlays.register,
    registerPageAction: pageActions.register,
  }), [blockingOverlays.active, blockingOverlays.register, pageActions.active, pageActions.register]);

  return <MobileBottomActionsContext.Provider value={value}>{children}</MobileBottomActionsContext.Provider>;
};

export default MobileBottomActionsProvider;
