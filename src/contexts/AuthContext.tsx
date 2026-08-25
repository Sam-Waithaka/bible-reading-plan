import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  getCurrentUser,
  logout as logoutRequest,
  refreshToken,
  signIn as signInRequest,
} from '../services/authApi';
import type { AuthStatus, AuthTokens, AuthUser } from '../types/auth';
import { AuthContext, type AuthContextType } from './AuthStore';
import { subscribeToAuthSession } from '../services/authSession';
import {
  clearStoredAuthTokens,
  readStoredAuthTokens,
  storeAuthTokens,
} from '../utils/authStorage';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [tokens, setTokens] = useState<AuthTokens | null>(() => readStoredAuthTokens());
  const [user, setUser] = useState<AuthUser | null>(null);

  const applySession = useCallback((nextTokens: AuthTokens, nextUser: AuthUser) => {
    storeAuthTokens(nextTokens);
    setTokens(nextTokens);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    clearStoredAuthTokens();
    setTokens(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const refreshSession = useCallback(async () => {
    const storedTokens = tokens || readStoredAuthTokens();

    if (!storedTokens) {
      clearSession();
      return null;
    }

    try {
      const nextTokens = await refreshToken(storedTokens.refresh);
      const nextUser = await getCurrentUser(nextTokens.access);

      applySession(nextTokens, nextUser);
      return nextUser;
    } catch {
      clearSession();
      return null;
    }
  }, [applySession, clearSession, tokens]);

  useEffect(() => subscribeToAuthSession((event) => {
    if (event.type === 'refreshed') {
      setTokens(event.tokens);
      return;
    }

    setTokens(null);
    setUser(null);
    setStatus('anonymous');
  }), []);
  const signIn = useCallback(async (identifier: string, password: string) => {
    const session = await signInRequest(identifier, password);
    applySession(session.tokens, session.user);
    return session.user;
  }, [applySession]);

  const signOut = useCallback(async () => {
    const currentTokens = tokens || readStoredAuthTokens();

    try {
      if (currentTokens) {
        await logoutRequest(currentTokens.refresh, currentTokens.access);
      }
    } finally {
      clearSession();
    }
  }, [clearSession, tokens]);

  useEffect(() => {
    const storedTokens = readStoredAuthTokens();

    if (!storedTokens) {
      clearSession();
      return;
    }

    let cancelled = false;

    const bootstrapSession = async () => {
      setStatus('loading');

      try {
        const nextUser = await getCurrentUser(storedTokens.access, false);
        if (!cancelled) {
          applySession(storedTokens, nextUser);
        }
      } catch {
        if (!cancelled) {
          try {
            const nextTokens = await refreshToken(storedTokens.refresh);
            const nextUser = await getCurrentUser(nextTokens.access);
            if (!cancelled) {
              applySession(nextTokens, nextUser);
            }
          } catch {
            if (!cancelled) {
              clearSession();
            }
          }
        }
      }
    };

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const groups = useMemo(() => user?.groups || [], [user]);
  const permissions = useMemo(() => user?.permissions || [], [user]);
  const hasPortalAccess = Boolean(user);

  const value = useMemo<AuthContextType>(
    () => ({
      accessToken: tokens?.access || '',
      groups,
      hasGroup: (group) => groups.includes(group),
      hasPermission: (permission) => permissions.includes(permission),
      hasPortalAccess,
      permissions,
      refreshSession,
      signIn,
      signOut,
      status,
      tokens,
      user,
    }),
    [groups, hasPortalAccess, permissions, refreshSession, signIn, signOut, status, tokens, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
