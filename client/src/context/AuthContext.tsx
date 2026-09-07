import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserSession,
  SignupPayload,
  VerifyEmailPayload,
  LoginPayload,
  ForgotPasswordPayload,
  VerifyForgotPasswordPayload,
  ResetPasswordPayload,
  AuthApiResponse,
  signup as apiSignup,
  verifyEmail as apiVerifyEmail,
  login as apiLogin,
  forgotPassword as apiForgotPassword,
  verifyForgotPassword as apiVerifyForgotPassword,
  resetPassword as apiResetPassword,
  getCurrentSession as apiGetCurrentSession,
  getAllSessions as apiGetAllSessions,
  logout as apiLogout,
  logoutAll as apiLogoutAll,
  deleteUserAccount as apiDeleteUserAccount,
} from '../services/authApi';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: 'email' | 'github' | 'guest';
}

export interface AuthContextType {
  user: AuthUser | null;
  session: UserSession | null;
  sessions: UserSession[];
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  login: (payload: LoginPayload) => Promise<AuthApiResponse>;
  signup: (payload: SignupPayload) => Promise<AuthApiResponse>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<AuthApiResponse>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<AuthApiResponse>;
  verifyForgotPassword: (payload: VerifyForgotPasswordPayload) => Promise<AuthApiResponse>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
  logout: () => Promise<boolean>;
  logoutAll: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  refreshSession: () => Promise<UserSession | null>;
  refreshSessions: () => Promise<UserSession[]>;
  setGitHubUser: (user: { name: string; email: string; username: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedEmail = localStorage.getItem('user_profile_email');
    const storedName = localStorage.getItem('user_profile_name');
    const storedId = localStorage.getItem('user_db_id') || localStorage.getItem('user_id');
    const storedProvider = (localStorage.getItem('user_auth_provider') as AuthUser['provider']) || 'guest';

    if (storedEmail || storedId) {
      return {
        id: storedId || '',
        name: storedName || storedEmail?.split('@')[0] || 'Developer',
        email: storedEmail || '',
        provider: storedProvider,
      };
    }
    return null;
  });

  const [session, setSession] = useState<UserSession | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('showMarketingPopup') === 'false';
  });

  // Query GET /auth/session to check if there is an active session
  const refreshSession = useCallback(async (): Promise<UserSession | null> => {
    try {
      const activeSession = await apiGetCurrentSession();
      if (activeSession?.id && activeSession?.userId) {
        setSession(activeSession);
        setIsAuthenticated(true);
        localStorage.setItem('user_db_id', activeSession.userId);
        localStorage.setItem('user_id', activeSession.userId);
        localStorage.setItem('session_id', activeSession.id);

        setUser((prev) => {
          const email = localStorage.getItem('user_profile_email') || prev?.email || '';
          const name = localStorage.getItem('user_profile_name') || prev?.name || (email ? email.split('@')[0] : 'Developer');
          return {
            id: activeSession.userId || prev?.id || '',
            name,
            email,
            provider: (localStorage.getItem('user_auth_provider') as any) || 'email',
          };
        });
        return activeSession;
      } else {
        setSession(null);
        // If current provider was email and server session is gone, clear credentials
        const currentProvider = localStorage.getItem('user_auth_provider');
        if (currentProvider === 'email') {
          setIsAuthenticated(false);
          setUser(null);
          localStorage.removeItem('user_db_id');
          localStorage.removeItem('user_id');
          localStorage.removeItem('session_id');
        }
        return null;
      }
    } catch (err) {
      console.warn('AuthContext: failed to refresh current session', err);
      setSession(null);
      return null;
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  // Query GET /auth/sessions to retrieve all user devices
  const refreshSessions = useCallback(async (): Promise<UserSession[]> => {
    try {
      const list = await apiGetAllSessions();
      setSessions(list);
      return list;
    } catch (err) {
      console.warn('AuthContext: failed to fetch all sessions', err);
      setSessions([]);
      return [];
    }
  }, []);

  // Initial mount: verify session against backend
  useEffect(() => {
    void refreshSession().then((sess) => {
      if (sess) {
        void refreshSessions();
      }
    });
  }, [refreshSession, refreshSessions]);

  // Sync with window events for profile updates
  useEffect(() => {
    const handleProfileUpdated = () => {
      const storedEmail = localStorage.getItem('user_profile_email');
      const storedName = localStorage.getItem('user_profile_name');
      const storedId = localStorage.getItem('user_db_id') || localStorage.getItem('user_id');
      const storedProvider = (localStorage.getItem('user_auth_provider') as AuthUser['provider']) || 'guest';

      if (storedEmail || storedId) {
        setUser({
          id: storedId || '',
          name: storedName || storedEmail?.split('@')[0] || 'Developer',
          email: storedEmail || '',
          provider: storedProvider,
        });
        setIsAuthenticated(localStorage.getItem('showMarketingPopup') === 'false');
      } else {
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('user-profile-updated', handleProfileUpdated);
    window.addEventListener('user-changed', handleProfileUpdated);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdated);
      window.removeEventListener('user-changed', handleProfileUpdated);
    };
  }, []);

  // 1. POST /auth/signup
  const signup = useCallback(async (payload: SignupPayload): Promise<AuthApiResponse> => {
    const res = await apiSignup(payload);
    localStorage.setItem('showMarketingPopup', 'false');
    setIsAuthenticated(true);
    return res;
  }, []);

  // 2. POST /auth/verify-email
  const verifyEmail = useCallback(async (payload: VerifyEmailPayload): Promise<AuthApiResponse> => {
    const res = await apiVerifyEmail(payload);
    const returnedUser = res.user;
    const cleanEmail = payload.email.trim().toLowerCase();
    const displayName = returnedUser?.name || cleanEmail.split('@')[0];
    const userId = returnedUser?.id || '';

    localStorage.setItem('showMarketingPopup', 'false');
    localStorage.setItem('gobe-user-id', cleanEmail);
    if (userId) {
      localStorage.setItem('user_db_id', userId);
      localStorage.setItem('user_id', userId);
    }
    localStorage.setItem('user_profile_name', displayName);
    localStorage.setItem('user_profile_email', returnedUser?.email || cleanEmail);
    localStorage.setItem('user_auth_provider', 'email');

    setUser({
      id: userId,
      name: displayName,
      email: returnedUser?.email || cleanEmail,
      provider: 'email',
    });
    setIsAuthenticated(true);

    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('user-changed'));

    void refreshSession();
    void refreshSessions();
    return res;
  }, [refreshSession, refreshSessions]);

  // 3. POST /auth/login
  const login = useCallback(async (payload: LoginPayload): Promise<AuthApiResponse> => {
    const res = await apiLogin(payload);
    const cleanEmail = payload.email.trim().toLowerCase();
    const displayName = cleanEmail.split('@')[0];

    localStorage.setItem('showMarketingPopup', 'false');
    localStorage.setItem('gobe-user-id', cleanEmail);
    localStorage.setItem('user_profile_name', displayName);
    localStorage.setItem('user_profile_email', cleanEmail);
    localStorage.setItem('user_auth_provider', 'email');

    // Retrieve active session details immediately
    const sess = await refreshSession();
    if (sess?.userId) {
      localStorage.setItem('user_db_id', sess.userId);
      localStorage.setItem('user_id', sess.userId);
      setUser({
        id: sess.userId,
        name: displayName,
        email: cleanEmail,
        provider: 'email',
      });
    } else {
      setUser({
        id: '',
        name: displayName,
        email: cleanEmail,
        provider: 'email',
      });
    }

    setIsAuthenticated(true);
    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('user-changed'));

    void refreshSessions();
    return res;
  }, [refreshSession, refreshSessions]);

  // 4. PATCH /auth/forgot-password
  const forgotPassword = useCallback(async (payload: ForgotPasswordPayload): Promise<AuthApiResponse> => {
    return apiForgotPassword(payload);
  }, []);

  // 5. PATCH /auth/verify-forgot-password
  const verifyForgotPassword = useCallback(async (payload: VerifyForgotPasswordPayload): Promise<AuthApiResponse> => {
    const res = await apiVerifyForgotPassword(payload);
    const updatedUser = res.updatePassword?.[0];
    const cleanEmail = payload.email.trim().toLowerCase();
    const displayName = cleanEmail.split('@')[0];
    const userId = updatedUser?.userId || '';

    localStorage.setItem('showMarketingPopup', 'false');
    localStorage.setItem('gobe-user-id', cleanEmail);
    if (userId) {
      localStorage.setItem('user_db_id', userId);
      localStorage.setItem('user_id', userId);
    }
    localStorage.setItem('user_profile_name', displayName);
    localStorage.setItem('user_profile_email', updatedUser?.email || cleanEmail);
    localStorage.setItem('user_auth_provider', 'email');

    setUser({
      id: userId,
      name: displayName,
      email: updatedUser?.email || cleanEmail,
      provider: 'email',
    });
    setIsAuthenticated(true);

    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('user-changed'));

    void refreshSession();
    void refreshSessions();
    return res;
  }, [refreshSession, refreshSessions]);

  // 6. PATCH /auth/reset-password
  const resetPassword = useCallback(async (payload: ResetPasswordPayload): Promise<void> => {
    const effectiveUserId = payload.userId || user?.id || localStorage.getItem('user_db_id') || undefined;
    const effectiveEmail = payload.email || user?.email || localStorage.getItem('user_profile_email') || undefined;

    return apiResetPassword({
      userId: effectiveUserId,
      email: effectiveEmail,
      oldPassword: payload.oldPassword,
      password: payload.password,
    });
  }, [user]);

  // 7. DELETE /auth/logout
  const logout = useCallback(async (): Promise<boolean> => {
    let success = false;
    try {
      success = await apiLogout();
    } catch (err) {
      console.warn('AuthContext: logout error', err);
    }

    setSession(null);
    setUser(null);
    setIsAuthenticated(false);

    localStorage.setItem('showMarketingPopup', 'true');
    localStorage.removeItem('gobe-user-id');
    localStorage.removeItem('user_db_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('session_id');
    localStorage.removeItem('user_profile_name');
    localStorage.removeItem('user_profile_email');
    localStorage.removeItem('user_auth_provider');

    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('user-changed'));
    return success;
  }, []);

  // 8. DELETE /auth/logout-all
  const logoutAll = useCallback(async (): Promise<boolean> => {
    let success = false;
    try {
      success = await apiLogoutAll();
    } catch (err) {
      console.warn('AuthContext: logoutAll error', err);
    }

    setSession(null);
    setSessions([]);
    setUser(null);
    setIsAuthenticated(false);

    localStorage.setItem('showMarketingPopup', 'true');
    localStorage.removeItem('gobe-user-id');
    localStorage.removeItem('user_db_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('session_id');
    localStorage.removeItem('user_profile_name');
    localStorage.removeItem('user_profile_email');
    localStorage.removeItem('user_auth_provider');

    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('user-changed'));
    return success;
  }, []);

  // 9. DELETE /users
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    let success = false;
    try {
      success = await apiDeleteUserAccount();
    } catch (err) {
      console.warn('AuthContext: deleteAccount error', err);
    }

    setSession(null);
    setSessions([]);
    setUser(null);
    setIsAuthenticated(false);

    localStorage.setItem('showMarketingPopup', 'true');
    localStorage.removeItem('gobe-user-id');
    localStorage.removeItem('user_db_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('session_id');
    localStorage.removeItem('user_profile_name');
    localStorage.removeItem('user_profile_email');
    localStorage.removeItem('user_email_notification');
    localStorage.removeItem('user_auth_provider');
    localStorage.removeItem('user_login_method');
    localStorage.removeItem('user_avatar_style');

    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('user-changed'));
    return success;
  }, []);

  // GitHub user linking
  const setGitHubUser = useCallback((gitHubData: { name: string; email: string; username: string }) => {
    localStorage.setItem('showMarketingPopup', 'false');
    localStorage.setItem('gobe-user-id', gitHubData.username);
    localStorage.setItem('user_profile_name', gitHubData.name);
    localStorage.setItem('user_profile_email', gitHubData.email);
    localStorage.setItem('user_auth_provider', 'github');

    setUser({
      id: gitHubData.username,
      name: gitHubData.name,
      email: gitHubData.email,
      provider: 'github',
    });
    setIsAuthenticated(true);

    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('user-changed'));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        sessions,
        isAuthenticated,
        isLoadingSession,
        login,
        signup,
        verifyEmail,
        forgotPassword,
        verifyForgotPassword,
        resetPassword,
        logout,
        logoutAll,
        deleteAccount,
        refreshSession,
        refreshSessions,
        setGitHubUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
