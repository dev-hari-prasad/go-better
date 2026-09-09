/**
 * Authentication API Service
 * Interacts with backend /auth endpoints defined in backend/src/routes/auth.routes.ts
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gobetter.dev';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
}

export interface SessionUserAgent {
  browser?: string;
  version?: string;
  os?: string;
  platform?: string;
  source?: string;
  isMobile?: boolean;
  isDesktop?: boolean;
}

export interface UserSession {
  id: string;
  userId?: string;
  createdAt: string;
  expiresAt?: string;
  userAgent?: SessionUserAgent | string;
  userName?: string;
  userEmail?: string | null;
  loginMethod?: 'email' | 'github';
}

export interface SignupPayload {
  email: string;
  password?: string;
  name?: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
  password?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyForgotPasswordPayload {
  email: string;
  otp: string;
  password: string;
}

export interface ResetPasswordPayload {
  userId?: string;
  email?: string;
  oldPassword: string;
  password: string;
}

export interface AuthApiResponse<T = any> {
  message?: string;
  error?: string;
  user?: UserRecord;
  updatePassword?: Array<{ email: string; userId: string }>;
  data?: T;
}

/**
 * Parses response body safely as JSON or text
 */
async function parseResponseBody(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/**
 * 1. POST /auth/signup - Request OTP for new user sign up
 */
export async function signup(payload: SignupPayload): Promise<AuthApiResponse> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: cleanEmail,
      password: payload.password || undefined,
      name: payload.name || cleanEmail.split('@')[0],
    }),
  });

  const body = await parseResponseBody(response);
  if (!response.ok) {
    const errorMsg = body?.error || body?.message || `Signup failed (${response.status})`;
    throw new Error(errorMsg);
  }

  localStorage.setItem('showMarketingPopup', 'false');
  return body;
}

/**
 * 2. POST /auth/verify-email - Verify OTP, finalize sign-up, set session cookie
 */
export async function verifyEmail(payload: VerifyEmailPayload): Promise<AuthApiResponse> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: cleanEmail,
      otp: payload.otp.trim(),
      password: payload.password || undefined,
    }),
  });

  const body = await parseResponseBody(response);
  if (!response.ok) {
    const errorMsg = body?.error || body?.message || `Verification failed (${response.status})`;
    throw new Error(errorMsg);
  }

  localStorage.setItem('showMarketingPopup', 'false');
  return body;
}

/**
 * 3. POST /auth/login - Authenticate with email & password, set session cookie
 */
export async function login(payload: LoginPayload): Promise<AuthApiResponse> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: cleanEmail,
      password: payload.password,
    }),
  });

  const body = await parseResponseBody(response);
  if (!response.ok) {
    let errorMsg = body?.error || body?.message;
    if (response.status === 404) {
      errorMsg = 'No account found with this email. Please sign up.';
    } else if (response.status === 403) {
      errorMsg = 'Incorrect password. Please try again or reset your password.';
    } else if (response.status === 422) {
      errorMsg = 'Email and password are required.';
    } else if (!errorMsg) {
      errorMsg = `Login failed (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  localStorage.setItem('showMarketingPopup', 'false');
  return body;
}

/**
 * 4. PATCH /auth/forgot-password - Request recovery OTP
 */
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<AuthApiResponse> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: cleanEmail }),
  });

  const body = await parseResponseBody(response);
  if (!response.ok) {
    const errorMsg = body?.error || body?.message || `Failed to send recovery code (${response.status})`;
    throw new Error(errorMsg);
  }

  return body;
}

/**
 * 5. PATCH /auth/verify-forgot-password - Verify recovery OTP, set new password, create session
 */
export async function verifyForgotPassword(payload: VerifyForgotPasswordPayload): Promise<AuthApiResponse> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const response = await fetch(`${API_BASE_URL}/auth/verify-forgot-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: cleanEmail,
      otp: payload.otp.trim(),
      password: payload.password,
    }),
  });

  const body = await parseResponseBody(response);
  if (!response.ok) {
    const errorMsg = body?.message || body?.error || `Failed to reset password (${response.status})`;
    throw new Error(errorMsg);
  }

  localStorage.setItem('showMarketingPopup', 'false');
  return body;
}

/**
 * 6. PATCH /auth/reset-password - Change password for authenticated user (verifies oldPassword)
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      userId: payload.userId || undefined,
      email: payload.email || undefined,
      oldPassword: payload.oldPassword,
      password: payload.password,
    }),
  });

  if (!response.ok) {
    const body = await parseResponseBody(response);
    const errorMsg = body?.error || body?.message || `Failed to update password (${response.status})`;
    throw new Error(errorMsg);
  }
}

/**
 * 7. GET /auth/session - Retrieve current session details using HTTP-only cookie
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const sessionId = localStorage.getItem('session_id');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data && typeof data === 'object' && data.id ? data : null;
  } catch (err) {
    console.warn('Failed to fetch current session:', err);
    return null;
  }
}

/**
 * 8. GET /auth/sessions - Retrieve all active sessions for the current user
 */
export async function getAllSessions(): Promise<UserSession[]> {
  try {
    const sessionId = localStorage.getItem('session_id');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Failed to fetch user sessions:', err);
    return [];
  }
}

/**
 * 9. DELETE /auth/logout - Revoke the current active session and clear cookie
 */
export async function logout(): Promise<boolean> {
  localStorage.setItem('showMarketingPopup', 'true');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return response.ok || response.status === 204;
  } catch (err) {
    console.warn('Failed to logout from server:', err);
    return false;
  }
}

/**
 * 10. DELETE /auth/logout-all - Revoke all active sessions for this user and clear cookie
 */
export async function logoutAll(): Promise<boolean> {
  localStorage.setItem('showMarketingPopup', 'true');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout-all`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return response.ok || response.status === 204;
  } catch (err) {
    console.warn('Failed to logout all sessions from server:', err);
    return false;
  }
}

export interface UpdateUserProfilePayload {
  name?: string;
  email?: string;
  emailNotification?: boolean;
}

export interface UserProfileRecord {
  id?: string;
  name?: string;
  email?: string;
  emailNotification?: boolean;
  error?: string;
  message?: string;
}

/**
 * 11. PATCH or POST /users - Update user profile and notification preferences
 */
export async function updateUserProfile(
  payload: UpdateUserProfilePayload
): Promise<UserProfileRecord> {
  const bodyData: UpdateUserProfilePayload = {};

  if (payload.name !== undefined) {
    const trimmed = payload.name.trim();
    if (trimmed.length > 0) {
      bodyData.name = trimmed;
    }
  }

  if (payload.email !== undefined) {
    const trimmedEmail = payload.email.trim().toLowerCase();
    if (trimmedEmail.includes('@')) {
      bodyData.email = trimmedEmail;
    }
  }

  if (payload.emailNotification !== undefined) {
    bodyData.emailNotification = Boolean(payload.emailNotification);
  }

  if (Object.keys(bodyData).length === 0) {
    throw new Error('At least one profile field is required');
  }

  // First try PATCH /users as mounted in backend/src/routes/users.routes.ts
  let response = await fetch(`${API_BASE_URL}/users`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(bodyData),
  });

  // If PATCH returns 404 or 405, fallback to POST /users
  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(bodyData),
    });
  }

  const rawText = await response.text();
  let json: any = {};
  try {
    json = rawText ? JSON.parse(rawText) : {};
  } catch {
    json = { message: rawText };
  }

  if (!response.ok) {
    const errorMsg = json.error || json.message || `Failed to update profile (${response.status})`;
    throw new Error(errorMsg);
  }

  // Synchronize local storage cache
  if (json.name) {
    localStorage.setItem('user_profile_name', json.name);
  }
  if (json.email) {
    localStorage.setItem('user_profile_email', json.email);
  }
  if (typeof json.emailNotification === 'boolean') {
    localStorage.setItem('user_email_notification', String(json.emailNotification));
  }

  return json;
}

/**
 * 12. DELETE /users - Permanently delete user account and associated data
 */
export async function deleteUserAccount(): Promise<boolean> {
  localStorage.setItem('showMarketingPopup', 'true');
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return response.ok || response.status === 204;
  } catch (err) {
    console.warn('Failed to delete user account on server:', err);
    return false;
  }
}
