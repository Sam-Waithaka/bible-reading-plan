import { createContext, useContext, useEffect, useId } from 'react';

export type MobileBottomActionsContextValue = {
  hasBlockingOverlay: boolean;
  hasPageAction: boolean;
  registerBlockingOverlay: (id: string) => () => void;
  registerPageAction: (id: string) => () => void;
};

const noopRegistration = () => () => undefined;

export const MobileBottomActionsContext = createContext<MobileBottomActionsContextValue>({
  hasBlockingOverlay: false,
  hasPageAction: false,
  registerBlockingOverlay: noopRegistration,
  registerPageAction: noopRegistration,
});

export const useMobileBottomActions = () => useContext(MobileBottomActionsContext);

export const usePageBottomAction = (enabled = true) => {
  const id = useId();
  const { registerPageAction } = useMobileBottomActions();
  useEffect(() => enabled ? registerPageAction(id) : undefined, [enabled, id, registerPageAction]);
};

export const useMobileBlockingOverlay = (open: boolean) => {
  const id = useId();
  const { registerBlockingOverlay } = useMobileBottomActions();
  useEffect(() => open ? registerBlockingOverlay(id) : undefined, [id, open, registerBlockingOverlay]);
};
