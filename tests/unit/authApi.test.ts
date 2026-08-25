import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  confirmEmail,
  getCurrentUser,
  getProfile,
  logout,
  normalizeAuthUser,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  setPassword,
  signIn,
  tokenLogin,
  updateCurrentUser,
  updateProfile,
} from '../../src/services/authApi';
import { ApiError } from '../../src/services/apiClient';

const jsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init,
  });

const userPayload = {
  id: 12,
  username: 'samuel',
  email: 'samuel@example.com',
  phone_number: '0712345678',
  first_name: 'Samuel',
  last_name: 'Waithaka',
  email_verified: true,
  groups: ['Writing Publisher'],
  permissions: ['writings.publish_writing'],
  profile: {
    display_name: 'Sam',
    bio: 'Writer',
    profile_photo: null,
    relationship_to_church: 'CONGREGANT',
    ministry_or_department: 'Media Team',
    location: 'Njoro',
  },
};

describe('authApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes the backend /me payload into frontend auth user shape', () => {
    expect(normalizeAuthUser(userPayload)).toEqual({
      email: 'samuel@example.com',
      emailVerified: true,
      firstName: 'Samuel',
      groups: ['Writing Publisher'],
      id: 12,
      lastName: 'Waithaka',
      permissions: ['writings.publish_writing'],
      phoneNumber: '0712345678',
      profile: {
        bio: 'Writer',
        displayName: 'Sam',
        location: 'Njoro',
        ministryOrDepartment: 'Media Team',
        profilePhoto: null,
        relationshipToChurch: 'CONGREGANT',
      },
      username: 'samuel',
    });
  });

  it('logs in with identifier and password at /v1/auth/token/', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access: 'access-token', refresh: 'refresh-token' }))
      .mockResolvedValueOnce(jsonResponse(userPayload));
    vi.stubGlobal('fetch', fetchMock);

    await expect(signIn('0712345678', 'secret')).resolves.toMatchObject({
      tokens: { access: 'access-token', refresh: 'refresh-token' },
      user: { email: 'samuel@example.com', username: 'samuel' },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/v1/auth/token/', expect.objectContaining({
      body: JSON.stringify({ identifier: '0712345678', password: 'secret' }),
      method: 'POST',
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/auth/me/', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      method: 'GET',
    }));
  });

  it('refreshes an access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ access: 'next-access' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshToken('refresh-token')).resolves.toEqual({ access: 'next-access', refresh: 'refresh-token' });
    expect(fetchMock).toHaveBeenCalledWith('/v1/auth/token/refresh/', expect.objectContaining({
      body: JSON.stringify({ refresh: 'refresh-token' }),
      method: 'POST',
    }));
  });

  it('loads the current user with a bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(userPayload));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCurrentUser('access-token')).resolves.toMatchObject({ username: 'samuel' });
    expect(fetchMock).toHaveBeenCalledWith('/v1/auth/me/', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
    }));
  });

  it('updates safe current-user fields with backend snake_case keys', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(userPayload));
    vi.stubGlobal('fetch', fetchMock);

    await updateCurrentUser('access-token', {
      firstName: 'Sam',
      lastName: 'Wait',
      phoneNumber: '0700000000',
    });
    expect(fetchMock).toHaveBeenCalledWith('/v1/auth/me/', expect.objectContaining({
      body: JSON.stringify({
        first_name: 'Sam',
        last_name: 'Wait',
        phone_number: '0700000000',
      }),
      method: 'PATCH',
    }));
  });

  it('loads and updates profile fields', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(userPayload.profile))
      .mockResolvedValueOnce(jsonResponse({ ...userPayload.profile, display_name: 'Samuel' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getProfile('access-token')).resolves.toMatchObject({ displayName: 'Sam' });
    await expect(updateProfile('access-token', {
      bio: 'Serving',
      displayName: 'Samuel',
      location: 'Njoro',
      ministryOrDepartment: 'Media',
      relationshipToChurch: 'VOLUNTEER',
    })).resolves.toMatchObject({ displayName: 'Samuel' });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/auth/profile/', expect.objectContaining({
      body: JSON.stringify({
        bio: 'Serving',
        display_name: 'Samuel',
        location: 'Njoro',
        ministry_or_department: 'Media',
        relationship_to_church: 'VOLUNTEER',
      }),
      method: 'PATCH',
    }));
  });

  it('calls logout with refresh token and bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await logout('refresh-token', 'access-token');
    expect(fetchMock).toHaveBeenCalledWith('/v1/auth/logout/', expect.objectContaining({
      body: JSON.stringify({ refresh: 'refresh-token' }),
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      method: 'POST',
    }));
  });

  it('supports password and invite setup endpoints', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ access: 'access-token', refresh: 'refresh-token', ok: true })));
    vi.stubGlobal('fetch', fetchMock);

    await tokenLogin('samuel', 'secret');
    await requestPasswordReset('samuel@example.com');
    await resetPassword('reset-token', 'new-password');
    await confirmEmail('confirm-token');
    await setPassword('setup-token', 'new-password');

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/auth/request-password-reset/', expect.objectContaining({
      body: JSON.stringify({ identifier: 'samuel@example.com' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/v1/auth/reset-password/', expect.objectContaining({
      body: JSON.stringify({ token: 'reset-token', new_password: 'new-password' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/v1/auth/confirm-email/', expect.objectContaining({
      body: JSON.stringify({ token: 'confirm-token' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(5, '/v1/auth/set-password/', expect.objectContaining({
      body: JSON.stringify({ token: 'setup-token', new_password: 'new-password' }),
    }));
  });

  it('preserves backend error detail and status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ detail: 'No active account found.' }, { status: 401 }))));

    await expect(tokenLogin('missing', 'bad-password')).rejects.toMatchObject({
      detail: 'No active account found.',
      status: 401,
    });
    await expect(tokenLogin('missing', 'bad-password')).rejects.toBeInstanceOf(ApiError);
  });
});
