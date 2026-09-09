import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  Github, 
  Mail, 
  Check, 
  LogOut, 
  Trash2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Key,
  Eye,
  EyeOff,
  Laptop,
  Smartphone,
  Shield,
  RefreshCw,
  Bell,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '../ui/UserAvatar';
import { AvatarStyleId } from '../../utils/avatarUtils';
import {
  resetPassword,
  logout,
  logoutAll,
  getAllSessions,
  getCurrentSession,
  updateUserProfile,
  deleteUserAccount,
  UserSession,
} from '../../services/authApi';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState(() => localStorage.getItem('user_profile_name') || 'Alex Mercer');
  const [email, setEmail] = useState(() => localStorage.getItem('user_profile_email') || 'alexmercer@acme.io');
  const [avatarStyleId, setAvatarStyleId] = useState<AvatarStyleId>(() => (localStorage.getItem('user_avatar_style') as AvatarStyleId) || 'gradient-smooth');
  const [emailNotification, setEmailNotification] = useState<boolean>(() => {
    const saved = localStorage.getItem('user_email_notification');
    return saved !== null ? saved === 'true' : true;
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Active sessions state
  const [showSessionsSection, setShowSessionsSection] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // Danger zone collapsed by default
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const [all, current] = await Promise.all([
        getAllSessions(),
        getCurrentSession(),
      ]);
      setSessions(all);
      setCurrentSessionId(current?.id || null);
    } catch (err) {
      console.warn('Failed to load active sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName(localStorage.getItem('user_profile_name') || 'Alex Mercer');
      setEmail(localStorage.getItem('user_profile_email') || 'alexmercer@acme.io');
      setAvatarStyleId((localStorage.getItem('user_avatar_style') as AvatarStyleId) || 'gradient-smooth');
      const savedNotif = localStorage.getItem('user_email_notification');
      setEmailNotification(savedNotif !== null ? savedNotif === 'true' : true);
      setIsSaving(false);
      setShowPasswordSection(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setShowSessionsSection(false);
      setSessions([]);
      setCurrentSessionId(null);
      setIsLoadingSessions(false);
      setIsLoggingOutAll(false);
      setShowDangerZone(false);
      setIsDeleting(false);
      setIsDeletingAccount(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      toast.error('Please enter your full name');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateUserProfile({
        name: trimmedName,
        email: trimmedEmail,
        emailNotification,
      });

      localStorage.setItem('user_profile_name', updated.name || trimmedName);
      localStorage.setItem('user_profile_email', updated.email || trimmedEmail);
      localStorage.setItem('user_email_notification', String(updated.emailNotification ?? emailNotification));
      localStorage.setItem('user_avatar_style', avatarStyleId);

      window.dispatchEvent(
        new CustomEvent('user-profile-updated', {
          detail: {
            name: updated.name || trimmedName,
            email: updated.email || trimmedEmail,
            emailNotification: updated.emailNotification ?? emailNotification,
            avatarStyleId,
          },
        })
      );
      window.dispatchEvent(new Event('user-changed'));

      toast.success('Profile and preferences updated successfully');
      onClose();
    } catch (err: any) {
      // Local fallback in case server endpoint is unavailable
      localStorage.setItem('user_profile_name', trimmedName);
      localStorage.setItem('user_profile_email', trimmedEmail);
      localStorage.setItem('user_email_notification', String(emailNotification));
      localStorage.setItem('user_avatar_style', avatarStyleId);

      window.dispatchEvent(
        new CustomEvent('user-profile-updated', {
          detail: { name: trimmedName, email: trimmedEmail, emailNotification, avatarStyleId },
        })
      );
      window.dispatchEvent(new Event('user-changed'));
      toast.error(err.message || 'Saved profile locally');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed:', err);
    }
    localStorage.removeItem('gobe-user-id');
    localStorage.removeItem('user_db_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('session_id');
    localStorage.removeItem('user_profile_name');
    localStorage.removeItem('user_profile_email');
    localStorage.removeItem('user_auth_provider');

    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('user-changed'));

    toast.success('Logged out successfully');
    onClose();
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await logoutAll();
      localStorage.removeItem('gobe-user-id');
      localStorage.removeItem('user_db_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('session_id');
      localStorage.removeItem('user_profile_name');
      localStorage.removeItem('user_profile_email');
      localStorage.removeItem('user_auth_provider');

      window.dispatchEvent(new Event('user-profile-updated'));
      window.dispatchEvent(new Event('user-changed'));

      toast.success('Signed out of all devices successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke sessions');
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    setIsDeletingAccount(true);
    try {
      const ok = await deleteUserAccount();
      if (ok) {
        toast.success('Account and associated data deleted permanently');
      } else {
        toast.info('Account deleted locally');
      }
    } catch (err: any) {
      console.warn('Failed to delete account on server:', err);
      toast.info('Account deleted locally');
    } finally {
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

      setIsDeletingAccount(false);
      setIsDeleting(false);
      onClose();
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!oldPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPasswordError('New password must contain at least 1 number');
      return;
    }
    if (!/[^A-Za-z0-9\s]/.test(newPassword)) {
      setPasswordError('New password must contain at least 1 special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordError('');
    setIsUpdatingPassword(true);

    try {
      const currentUserId = localStorage.getItem('user_db_id') || localStorage.getItem('user_id');
      const currentEmail = email || localStorage.getItem('user_profile_email') || localStorage.getItem('gobe-user-id');

      await resetPassword({
        userId: currentUserId || undefined,
        email: currentEmail || undefined,
        oldPassword,
        password: newPassword,
      });

      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-apple-fade p-4" onClick={onClose}>
      <div 
        className="relative bg-[#16171d] border border-[#232530] rounded-3xl shadow-2xl w-full max-w-[560px] overflow-hidden animate-apple-scale max-h-[92vh] flex flex-col font-sans select-none"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-7 pt-6 pb-4 border-b border-[#232530] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Edit Profile</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Manage your personal details and authentication method.</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 -mr-1"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-7 overflow-y-auto space-y-6 flex-1">
          
          {/* User Profile Info with Name and Email on the right */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#121319] border border-[#232530]">
            <UserAvatar
              name={name}
              avatarStyleId={avatarStyleId}
              size={56}
              className="ring-2 ring-[#232530] shadow-md shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-zinc-100 tracking-tight truncate">
                {name || 'User'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono truncate mt-0.5">
                {email || 'No email provided'}
              </p>
            </div>
          </div>

          {/* Text Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full bg-[#121319] border border-[#2d3340] rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all shadow-inner placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alexmercer@acme.io"
                className="w-full bg-[#121319] border border-[#2d3340] rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all shadow-inner placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Email Notification Preferences & GitHub Two-Way Integration Notice */}
          <div className="p-4 rounded-2xl bg-[#121319] border border-[#232530] space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#c0f200]/10 border border-[#c0f200]/20 flex items-center justify-center text-[#c0f200] shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-100">Email Notifications</h4>
                  <p className="text-[11px] text-zinc-400">Receive email alerts for completed reviews and critical security findings.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={emailNotification}
                  onChange={(e) => setEmailNotification(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#232530] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c0f200]" />
              </label>
            </div>

            {/* GitHub Two-Way Integration Activity Notice */}
            <div className="px-3 py-2 rounded-xl bg-[#161822] border border-[#2d3340] flex items-center gap-2 text-xs text-zinc-400">
              <Github className="w-3.5 h-3.5 text-[#c0f200] shrink-0" />
              <p className="text-[11px] text-zinc-400 leading-snug">
                GitHub directly manages comment and review notifications according to your GitHub account settings.
              </p>
            </div>
          </div>

          {/* Collapsible Change Password / Security Section */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                setPasswordError('');
              }}
              className="flex items-center justify-between w-full py-2 px-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-semibold text-[11px] uppercase tracking-wider">Change Password</span>
              </div>
              {showPasswordSection ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            {showPasswordSection && (
              <div className="mt-2 p-4 rounded-2xl bg-[#121319] border border-[#232530] space-y-3.5 animate-apple-fade">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Current Password</label>
                  <div className="relative flex items-center">
                    <input 
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#16171d] border border-[#2d3340] rounded-xl px-3.5 py-2 pr-10 text-xs text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                    >
                      {showOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">New Password</label>
                    <div className="relative flex items-center">
                      <input 
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#16171d] border border-[#2d3340] rounded-xl px-3.5 py-2 pr-10 text-xs text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Confirm New Password</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#16171d] border border-[#2d3340] rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {passwordError && (
                  <p className="text-xs text-rose-400 font-medium">{passwordError}</p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-zinc-500">Min 8 chars, 1 number, 1 special character</p>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isUpdatingPassword}
                    className="px-3.5 py-1.5 rounded-xl bg-[#c0f200] hover:bg-[#a6d100] text-black text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Active Sessions / Devices Section */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                const nextState = !showSessionsSection;
                setShowSessionsSection(nextState);
                if (nextState) {
                  void loadSessions();
                }
              }}
              className="flex items-center justify-between w-full py-2 px-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-semibold text-[11px] uppercase tracking-wider">Active Sessions & Devices</span>
              </div>
              <div className="flex items-center gap-2">
                {sessions.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10">
                    {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                )}
                {showSessionsSection ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </div>
            </button>

            {showSessionsSection && (
              <div className="mt-2 p-4 rounded-2xl bg-[#121319] border border-[#232530] space-y-3 animate-apple-fade">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    Devices currently authenticated to your account.
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadSessions()}
                    disabled={isLoadingSessions}
                    className="text-xs text-zinc-400 hover:text-[#c0f200] transition-colors p-1 cursor-pointer flex items-center gap-1"
                    title="Refresh sessions"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                    <span className="text-[11px]">Refresh</span>
                  </button>
                </div>

                {isLoadingSessions ? (
                  <div className="py-4 text-center text-xs text-zinc-500">
                    Loading active sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="py-3 px-3.5 rounded-xl bg-[#16171d] border border-white/5 text-xs text-zinc-500 text-center">
                    No active sessions found on server.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
                    {sessions.map((sess) => {
                      const isCurrent = sess.id === currentSessionId;
                      const ua = typeof sess.userAgent === 'object' && sess.userAgent ? (sess.userAgent as any) : null;
                      const deviceLabel = ua
                        ? `${ua.browser || 'Browser'} on ${ua.os || ua.platform || 'Device'}`
                        : (typeof sess.userAgent === 'string' && sess.userAgent !== 'Unknow' ? sess.userAgent : 'Web Session');
                      const createdAtFormatted = sess.createdAt
                        ? new Date(sess.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Active';

                      return (
                        <div
                          key={sess.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#16171d] border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-zinc-400">
                              {ua?.isMobile ? (
                                <Smartphone className="w-3.5 h-3.5" />
                              ) : (
                                <Laptop className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-zinc-200 truncate">
                                  {deviceLabel}
                                </span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold text-[#c0f200] bg-[#c0f200]/15 border border-[#c0f200]/30 shrink-0">
                                    Current
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                Created {createdAtFormatted}
                              </span>
                            </div>
                          </div>
                          {isCurrent && (
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="px-2 py-1 rounded-md text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                              title="Sign out of this session"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Sign Out</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Revoke all sessions action */}
                <div className="pt-2 border-t border-[#232530] flex items-center justify-between">
                  <div className="text-[11px] text-zinc-500">
                    Sign out of all devices and active browsers.
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoutAll}
                    disabled={isLoggingOutAll}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{isLoggingOutAll ? 'Revoking...' : 'Log Out All Devices'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Danger Zone (Properly hidden by default) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowDangerZone(!showDangerZone)}
              className="flex items-center justify-between w-full py-2 px-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-600" />
                <span className="font-semibold text-[11px] uppercase tracking-wider">Advanced / Danger Zone</span>
              </div>
              {showDangerZone ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            {showDangerZone && (
              <div className="mt-2 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between gap-3 animate-apple-fade">
                <div>
                  <div className="text-xs font-semibold text-rose-300">Delete Account</div>
                  <div className="text-[11px] text-zinc-400">Permanently delete your account, reviews, repositories, and workspace credentials.</div>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteProfile}
                  disabled={isDeletingAccount}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                    isDeleting
                      ? 'bg-rose-600 text-white shadow-md animate-pulse'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingAccount ? 'Deleting...' : isDeleting ? 'Click to Confirm' : 'Delete Account'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Left-aligned with Save Changes first, Cancel second, Logout on the right */}
        <div className="bg-[#121319] border-t border-[#232530] px-7 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#c0f200] hover:bg-[#a6d100] text-black font-semibold rounded-xl text-sm transition-colors shadow-md animate-apple-scale cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button 
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
