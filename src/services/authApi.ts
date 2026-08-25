import type {
  AuthMeUpdate,
  AuthProfile,
  AuthProfileUpdate,
  AuthSession,
  AuthTokens,
  AuthUser,
} from '../types/auth';
import { ApiError, createApiUrl } from './apiClient';
import { authenticatedFetch, refreshStoredAuthTokens } from './authSession';

type AuthPayload = Record<string, unknown>;

const readRecord = (value: unknown): AuthPayload =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as AuthPayload : {};

const readString = (record: AuthPayload, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') return value;
  }

  return fallback;
};

const readArray = (record: AuthPayload, key: string) => {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
};

const readMessage = (payload: unknown) => {
  const record = readRecord(payload);
  const message = record.detail || record.message || record.error;
  return typeof message === 'string' && message.trim() ? message.trim() : undefined;
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as AuthPayload;
  } catch {
    return {};
  }
};

const authRequest = async (
  path: string,
  {
    accessToken,
    body,
    method = 'GET',
    retryOnUnauthorized = true,
  }: {
    accessToken?: string;
    body?: AuthPayload;
    method?: 'GET' | 'PATCH' | 'POST';
    retryOnUnauthorized?: boolean;
  } = {},
) => {
  const endpoint = createApiUrl(path);
  const init: RequestInit = {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    method,
  };
  const response = accessToken && retryOnUnauthorized
    ? await authenticatedFetch(endpoint, accessToken, init)
    : await fetch(endpoint, {
      ...init,
      headers: {
        ...init.headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
  const payload = await parseJson(response);

  if (!response.ok) {
    const detail = readMessage(payload);
    throw new ApiError(detail || 'Authentication request failed.', {
      detail,
      endpoint,
      status: response.status,
    });
  }

  return payload;
};

const normalizeProfile = (value: unknown): AuthProfile | null => {
  const record = readRecord(value);
  if (Object.keys(record).length === 0) return null;

  return {
    bio: readString(record, ['bio']),
    displayName: readString(record, ['display_name', 'displayName']),
    location: readString(record, ['location']),
    ministryOrDepartment: readString(record, ['ministry_or_department', 'ministryOrDepartment']),
    profilePhoto: readString(record, ['profile_photo', 'profilePhoto']) || null,
    relationshipToChurch: readString(record, ['relationship_to_church', 'relationshipToChurch']),
  };
};

export const normalizeAuthUser = (payload: unknown): AuthUser => {
  const record = readRecord(payload);

  return {
    email: readString(record, ['email']),
    emailVerified: Boolean(record.email_verified ?? record.emailVerified),
    firstName: readString(record, ['first_name', 'firstName']),
    groups: readArray(record, 'groups'),
    id: typeof record.id === 'number' || typeof record.id === 'string' ? record.id : '',
    lastName: readString(record, ['last_name', 'lastName']),
    permissions: readArray(record, 'permissions'),
    phoneNumber: readString(record, ['phone_number', 'phoneNumber']),
    profile: normalizeProfile(record.profile),
    username: readString(record, ['username']),
  };
};

export const tokenLogin = async (identifier: string, password: string): Promise<AuthTokens> => {
  const payload = await authRequest('/v1/auth/token/', {
    body: { identifier, password },
    method: 'POST',
  });

  return {
    access: readString(payload, ['access']),
    refresh: readString(payload, ['refresh']),
  };
};

export const refreshToken = async (refresh: string): Promise<AuthTokens> => refreshStoredAuthTokens(refresh);

export const logout = (refresh: string, accessToken?: string) =>
  authRequest('/v1/auth/logout/', {
    accessToken,
    body: { refresh },
    method: 'POST',
    retryOnUnauthorized: false,
  });

export const getCurrentUser = async (accessToken: string, retryOnUnauthorized = true): Promise<AuthUser> => {
  const payload = await authRequest('/v1/auth/me/', { accessToken, retryOnUnauthorized });
  return normalizeAuthUser(payload);
};

export const updateCurrentUser = async (accessToken: string, update: AuthMeUpdate): Promise<AuthUser> => {
  const payload = await authRequest('/v1/auth/me/', {
    accessToken,
    body: {
      first_name: update.firstName,
      last_name: update.lastName,
      phone_number: update.phoneNumber,
    },
    method: 'PATCH',
  });
  return normalizeAuthUser(payload);
};

export const getProfile = async (accessToken: string): Promise<AuthProfile | null> => {
  const payload = await authRequest('/v1/auth/profile/', { accessToken });
  return normalizeProfile(payload);
};

export const updateProfile = async (accessToken: string, update: AuthProfileUpdate): Promise<AuthProfile | null> => {
  const payload = await authRequest('/v1/auth/profile/', {
    accessToken,
    body: {
      bio: update.bio,
      display_name: update.displayName,
      location: update.location,
      ministry_or_department: update.ministryOrDepartment,
      relationship_to_church: update.relationshipToChurch,
    },
    method: 'PATCH',
  });
  return normalizeProfile(payload);
};

export const requestPasswordReset = (identifier: string) =>
  authRequest('/v1/auth/request-password-reset/', {
    body: { identifier },
    method: 'POST',
  });

export const resetPassword = (token: string, newPassword: string) =>
  authRequest('/v1/auth/reset-password/', {
    body: { token, new_password: newPassword },
    method: 'POST',
  });

export const confirmEmail = (token: string) =>
  authRequest('/v1/auth/confirm-email/', {
    body: { token },
    method: 'POST',
  });

export const setPassword = (token: string, newPassword: string) =>
  authRequest('/v1/auth/set-password/', {
    body: { token, new_password: newPassword },
    method: 'POST',
  });

export const signIn = async (identifier: string, password: string): Promise<AuthSession> => {
  const tokens = await tokenLogin(identifier, password);
  const user = await getCurrentUser(tokens.access, false);

  return { tokens, user };
};
