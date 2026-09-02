import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import RequireAuth from './RequireAuth';

const PortalAccessGate = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  return auth.hasPortalAccess ? children : <Navigate to="/" replace />;
};

const RequirePortalAccess = ({ children }: { children: ReactNode }) => (
  <RequireAuth>
    <PortalAccessGate>{children}</PortalAccessGate>
  </RequireAuth>
);

export default RequirePortalAccess;
