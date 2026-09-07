import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SpinnerGap,
  CaretLeft,
  Eye,
  EyeSlash,
  Check,
  X,
} from '@phosphor-icons/react';
import { GitHubDark } from '@ridemountainpig/svgl-react';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { AuroraSilkBackground } from './AuroraBackground';
import { navigateTo } from '../../router/routes';
import { toast } from 'sonner';
import {
  signup,
  verifyEmail,
  login,
  forgotPassword,
  verifyForgotPassword,
  resetPassword,
  getCurrentSession,
} from '../../services/authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gobetter.dev';

export type AuthMode = 'signup' | 'login' | 'forgot-password' | 'reset-password';
type AuthStep = 'form' | 'otp_verify' | 'forgot_password' | 'verify_forgot_password' | 'reset_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  onAuthSuccess?: (user: { name: string; email: string; provider: 'github' | 'email' }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onModeChange,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isLogoBlinking, setIsLogoBlinking] = useState(false);
  const [logoBlinkKey, setLogoBlinkKey] = useState(0);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerLogoBlink = useCallback(() => {
    if (blinkTimerRef.current) {
      clearTimeout(blinkTimerRef.current);
    }
    setIsLogoBlinking(false);
    requestAnimationFrame(() => {
      setIsLogoBlinking(true);
      setLogoBlinkKey((k) => k + 1);
      blinkTimerRef.current = setTimeout(() => {
        setIsLogoBlinking(false);
      }, 1800);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (blinkTimerRef.current) {
        clearTimeout(blinkTimerRef.current);
      }
    };
  }, []);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Password validation rules: min 8 chars, at least 1 number, at least 1 special char
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9\s]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;
  const isPasswordViolated = (password.length > 0 || hasSubmitted) && !isPasswordValid;
  // Once password becomes valid, remove popover immediately
  const showPasswordPopover = mode === 'signup' && !isPasswordValid && (isPasswordFocused || hasSubmitted);

  // New Password validation rules (for forgot password reset & direct reset)
  const hasNewMinLength = newPassword.length >= 8;
  const hasNewNumber = /\d/.test(newPassword);
  const hasNewSpecialChar = /[^A-Za-z0-9\s]/.test(newPassword);
  const isNewPasswordValid = hasNewMinLength && hasNewNumber && hasNewSpecialChar;
  const isNewPasswordViolated = (newPassword.length > 0 || hasSubmitted) && !isNewPasswordValid;
  const showNewPasswordPopover = !isNewPasswordValid && (isNewPasswordFocused || hasSubmitted);

  // When modal opens: reset form and trigger the logo blinking animation
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'forgot-password') {
        setMode('forgot-password');
        setStep('forgot_password');
      } else if (initialMode === 'reset-password') {
        setMode('reset-password');
        setStep('reset_password');
      } else {
        setMode(initialMode);
        setStep('form');
      }
      setEmail(localStorage.getItem('user_profile_email') || '');
      setPassword('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordFocused(false);
      setIsNewPasswordFocused(false);
      setHasSubmitted(false);
      setEmailError('');
      setOtpDigits(['', '', '', '', '', '']);
      setIsSubmitting(false);
      setResendCooldown(0);

      // Trigger logo blink on modal open
      triggerLogoBlink();
    }
  }, [isOpen, initialMode, triggerLogoBlink]);

  // Handle ESC key to exit
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  // Auto-focus email on form / forgot_password / reset_password step
  useEffect(() => {
    if ((step === 'form' || step === 'forgot_password' || step === 'reset_password') && isOpen) {
      setTimeout(() => emailInputRef.current?.focus(), 150);
    }
  }, [step, isOpen]);

  // Auto-focus first digit on OTP steps
  useEffect(() => {
    if (step === 'otp_verify' || step === 'verify_forgot_password') {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  if (!isOpen) return null;

  // Handle GitHub Continue
  const handleGitHubAuth = () => {
    triggerLogoBlink();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const githubUsername = 'octocat-dev';
      const userEmail = 'octocat@users.noreply.github.com';
      const displayName = 'Octocat Developer';

      localStorage.setItem('showMarketingPopup', 'false');
      localStorage.setItem('gobe-user-id', githubUsername);
      localStorage.setItem('user_profile_name', displayName);
      localStorage.setItem('user_profile_email', userEmail);
      localStorage.setItem('user_auth_provider', 'github');

      window.dispatchEvent(new Event('user-profile-updated'));
      window.dispatchEvent(new Event('user-changed'));

      toast.success(
        mode === 'signup'
          ? 'Account created with GitHub successfully!'
          : 'Signed in with GitHub successfully!'
      );

      if (onAuthSuccess) {
        onAuthSuccess({ name: displayName, email: userEmail, provider: 'github' });
      }
      onClose();
    }, 600);
  };

  // Submit email to backend /auth/login or /auth/signup
  const handleSubmitForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerLogoBlink();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (mode === 'signup' && !isPasswordValid) {
      setHasSubmitted(true);
      toast.error('Please meet all password requirements before continuing');
      return;
    }

    if (mode === 'login' && !password) {
      setHasSubmitted(true);
      toast.error('Please enter your password');
      return;
    }

    setEmailError('');
    setIsSubmitting(true);

    if (mode === 'login') {
      try {
        await login({
          email: cleanEmail,
          password: password,
        });

        // Retrieve active session details
        const session = await getCurrentSession();
        const displayName = cleanEmail.split('@')[0];

        localStorage.setItem('showMarketingPopup', 'false');
        localStorage.setItem('gobe-user-id', cleanEmail);
        if (session?.userId) {
          localStorage.setItem('user_db_id', session.userId);
          localStorage.setItem('user_id', session.userId);
        }
        localStorage.setItem('user_profile_name', displayName);
        localStorage.setItem('user_profile_email', cleanEmail);
        localStorage.setItem('user_auth_provider', 'email');

        window.dispatchEvent(new Event('user-profile-updated'));
        window.dispatchEvent(new Event('user-changed'));

        toast.success('Welcome back! Signed in successfully.');
        if (onAuthSuccess) {
          onAuthSuccess({ name: displayName, email: cleanEmail, provider: 'email' });
        }
        onClose();
      } catch (err: any) {
        setEmailError(err.message || 'Login failed. Please check your credentials.');
        toast.error(err.message || 'Login failed');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // mode === 'signup'
    try {
      await signup({
        email: cleanEmail,
        password: password || undefined,
      });

      setStep('otp_verify');
      setResendCooldown(30);
      toast.info('Verification code sent to your email');
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send verification code. Please try again.');
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP digit inputs
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const digit = cleaned[cleaned.length - 1];
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6 && step !== 'verify_forgot_password') {
        verifyAndComplete(fullCode);
      }
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6 && step !== 'verify_forgot_password') {
      verifyAndComplete(pastedData);
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP with backend /auth/verify-email
  const verifyAndComplete = async (codeToVerify?: string) => {
    triggerLogoBlink();
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      toast.error('Please enter all 6 digits of the code');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await verifyEmail({
        email: email.trim().toLowerCase(),
        otp: code,
        password: password || undefined,
      });

      const returnedUser = data.user;
      const displayName = returnedUser?.name || email.split('@')[0];
      const userEmail = returnedUser?.email || email;

      localStorage.setItem('showMarketingPopup', 'false');
      localStorage.setItem('gobe-user-id', userEmail);
      if (returnedUser?.id) {
        localStorage.setItem('user_db_id', returnedUser.id);
        localStorage.setItem('user_id', returnedUser.id);
      }
      localStorage.setItem('user_profile_name', displayName);
      localStorage.setItem('user_profile_email', userEmail);
      localStorage.setItem('user_auth_provider', 'email');

      window.dispatchEvent(new Event('user-profile-updated'));
      window.dispatchEvent(new Event('user-changed'));

      toast.success(
        mode === 'signup'
          ? 'Account created and verified! Welcome to GoBetter.'
          : 'Welcome back! Signed in successfully.'
      );
      if (onAuthSuccess) {
        onAuthSuccess({ name: displayName, email: userEmail, provider: 'email' });
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP for signup
  const handleResendOtp = async () => {
    triggerLogoBlink();
    if (resendCooldown > 0) return;
    try {
      await signup({ email: email.trim().toLowerCase() });

      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      toast.info(`New verification code sent to ${email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend code');
    }
  };

  // Send forgot password recovery code via PATCH /auth/forgot-password
  const handleSendForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerLogoBlink();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setIsSubmitting(true);

    try {
      await forgotPassword({ email: cleanEmail });

      setStep('verify_forgot_password');
      setOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setResendCooldown(30);
      toast.info(`Recovery code sent to ${cleanEmail}`);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send recovery code');
      toast.error(err.message || 'Failed to send recovery code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend recovery code for forgot password
  const handleResendForgotPassword = async () => {
    triggerLogoBlink();
    if (resendCooldown > 0) return;
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });

      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      toast.info(`New recovery code sent to ${email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend code');
    }
  };

  // Verify OTP and reset password via PATCH /auth/verify-forgot-password
  const handleVerifyForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerLogoBlink();
    const code = otpDigits.join('');
    if (code.length < 6) {
      toast.error('Please enter all 6 digits of the recovery code');
      return;
    }

    if (!isNewPasswordValid) {
      setHasSubmitted(true);
      toast.error('Please meet all password requirements before continuing');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await verifyForgotPassword({
        email: email.trim().toLowerCase(),
        otp: code,
        password: newPassword,
      });

      const updatedUser = data.updatePassword?.[0];
      const cleanEmail = email.trim().toLowerCase();
      const displayName = cleanEmail.split('@')[0];

      localStorage.setItem('showMarketingPopup', 'false');
      if (updatedUser) {
        localStorage.setItem('gobe-user-id', updatedUser.email || cleanEmail);
        if (updatedUser.userId) {
          localStorage.setItem('user_db_id', updatedUser.userId);
          localStorage.setItem('user_id', updatedUser.userId);
        }
        localStorage.setItem('user_profile_name', displayName);
        localStorage.setItem('user_profile_email', updatedUser.email || cleanEmail);
        localStorage.setItem('user_auth_provider', 'email');

        window.dispatchEvent(new Event('user-profile-updated'));
        window.dispatchEvent(new Event('user-changed'));
      }

      toast.success('Password reset successfully! Signed in to your account.');
      if (onAuthSuccess) {
        onAuthSuccess({
          name: displayName,
          email: cleanEmail,
          provider: 'email',
        });
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct password reset via PATCH /auth/reset-password
  const handleDirectResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerLogoBlink();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!oldPassword) {
      setHasSubmitted(true);
      toast.error('Please enter your current password');
      return;
    }

    if (!isNewPasswordValid) {
      setHasSubmitted(true);
      toast.error('Please meet all new password requirements before continuing');
      return;
    }

    if (newPassword !== confirmPassword) {
      setHasSubmitted(true);
      toast.error('New passwords do not match');
      return;
    }

    setEmailError('');
    setIsSubmitting(true);

    try {
      await resetPassword({
        email: cleanEmail,
        oldPassword,
        password: newPassword,
      });

      toast.success('Password updated successfully! Please log in with your new password.');
      setOldPassword('');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setHasSubmitted(false);
      setMode('login');
      setStep('form');
      window.history.pushState({ auth: 'login' }, '', '/login');
      document.title = 'Log In | GoBetter AI';
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password. Check your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptureClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button')) {
      triggerLogoBlink();
    }
  };

  return (
    <div
      onClickCapture={handleCaptureClick}
      className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0d1117] flex flex-col justify-between min-h-screen animate-apple-fade select-none"
    >
      {/* ── Aurora Silk Drapery Background (Matching Resend Screenshot) ── */}
      <AuroraSilkBackground />

      {/* ── Top Bar with < Dashboard button (No border) ── */}
      <div className="relative z-20 w-full px-6 py-5 sm:px-8 sm:py-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16171d]/90 hover:bg-[#20222a] text-xs text-zinc-300 hover:text-white backdrop-blur-md transition-all cursor-pointer font-sans shadow-xs active:scale-[0.98]"
        >
          <CaretLeft size={14} weight="bold" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* ── Central Resend-Style Auth Stack ── */}
      <div className="relative z-20 w-full max-w-[400px] mx-auto px-4 py-2 sm:py-4 -mt-4 sm:-mt-8 mb-12 sm:mb-16 flex flex-col items-center text-center">
        {/* Standalone Enlarged Logo (No card wrapper / No borders / No tooltip) with On-Open, On-Hover & Button-Click Neon Blinking */}
        <div
          key={logoBlinkKey}
          onClick={triggerLogoBlink}
          onMouseEnter={triggerLogoBlink}
          className={`relative group/logo cursor-pointer inline-flex items-center justify-center transition-transform duration-300 hover:scale-105 ${
            isLogoBlinking ? 'animate-gobe-blink' : ''
          }`}
        >
          <GobeAiLogo size={64} variant="brand" />
        </div>

        {/* ════════════ STEP 1: RESEND-STYLE SIGNUP / LOGIN FORM ════════════ */}
        {step === 'form' && (
          <div className="w-full flex flex-col items-center animate-apple-scale">
            {/* Heading */}
            <h1 className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight font-sans mt-6">
              {mode === 'signup' ? 'Create a GoBetter account' : 'Welcome back'}
            </h1>

            {/* Toggle Subtitle */}
            <div className="text-xs text-zinc-400 font-sans mt-1.5">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      triggerLogoBlink();
                      setMode('login');
                      setHasSubmitted(false);
                      onModeChange?.('login');
                      window.history.pushState({ auth: 'login' }, '', '/login');
                      document.title = 'Log In | GoBetter AI';
                    }}
                    className="text-white hover:text-[#c0f200] font-medium underline underline-offset-2 decoration-white/40 hover:decoration-[#c0f200] transition-colors cursor-pointer"
                  >
                    Log in.
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      triggerLogoBlink();
                      setMode('signup');
                      setHasSubmitted(false);
                      onModeChange?.('signup');
                      window.history.pushState({ auth: 'signup' }, '', '/signup');
                      document.title = 'Create Account | GoBetter AI';
                    }}
                    className="text-white hover:text-[#c0f200] font-medium underline underline-offset-2 decoration-white/40 hover:decoration-[#c0f200] transition-colors cursor-pointer"
                  >
                    Sign up.
                  </button>
                </>
              )}
            </div>

            {/* Log in with GitHub Button with SVGL GitHub Icon */}
            <button
              type="button"
              onClick={handleGitHubAuth}
              disabled={isSubmitting}
              className="mt-8 sm:mt-9 w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#16171d] hover:bg-[#20222a] border border-white/10 hover:border-white/20 text-white font-medium text-xs sm:text-sm font-sans tracking-tight transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50 group"
            >
              {isSubmitting ? (
                <>
                  <SpinnerGap size={17} className="animate-spin" />
                  <span>Connecting to GitHub...</span>
                </>
              ) : (
                <>
                  <GitHubDark className="w-[18px] h-[18px] shrink-0 text-white group-hover:scale-105 transition-transform" />
                  <span>Log in with GitHub</span>
                </>
              )}
            </button>

            {/* Subtle Horizontal Divider with 'or' - matching app bg color */}
            <div className="relative flex items-center justify-center w-full my-6">
              <div className="w-full border-t border-white/[0.08]" />
              <span className="absolute px-3 bg-[#0d1117] text-[11px] text-zinc-500 font-sans uppercase tracking-wider">
                or
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmitForm} className="w-full space-y-3.5 text-left">
              <div>
                <label className="block text-xs text-zinc-400 font-medium font-sans mb-1.5">
                  Email
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="steve@apple.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  className={`w-full px-3.5 py-2.5 bg-[#121318] border rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all font-sans ${
                    emailError
                      ? 'border-rose-500/70 focus:border-rose-500'
                      : 'border-white/10 focus:border-white/25 focus:ring-1 focus:ring-white/10'
                  }`}
                />
                {emailError && (
                  <p className="text-xs text-rose-400 mt-1">{emailError}</p>
                )}
              </div>

              {/* Password Input with Right-Side Popover */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-zinc-400 font-medium font-sans">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerLogoBlink();
                        setStep('forgot_password');
                        setEmailError('');
                        setHasSubmitted(false);
                        window.history.pushState({ auth: 'forgot-password' }, '', '/forgot-password');
                        document.title = 'Forgot Password | GoBetter AI';
                      }}
                      className="text-[11px] text-zinc-400 hover:text-[#c0f200] transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className={`w-full px-3.5 py-2.5 pr-10 bg-[#121318] border rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all font-sans ${
                      isPasswordViolated
                        ? 'border-rose-500/60 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/20'
                        : 'border-white/10 focus:border-white/25 focus:ring-1 focus:ring-white/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Requirements Popover on the Right */}
                {showPasswordPopover && (
                  <div
                    className="sm:absolute sm:left-[calc(100%+14px)] sm:top-1/2 sm:-translate-y-1/2 sm:w-[260px] w-full mt-2.5 sm:mt-0 z-40 bg-[#161b22] border border-white/15 rounded-xl p-3.5 shadow-2xl text-left animate-apple-scale pointer-events-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {/* Caret arrow pointing left to password input on desktop */}
                    <div className="hidden sm:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#161b22] border-l border-b border-white/15 rotate-45 pointer-events-none" />

                    <div className="text-[11px] font-semibold text-zinc-300 font-sans tracking-wide uppercase mb-2 flex items-center justify-between">
                      <span>Password requirements</span>
                      {isPasswordValid && (
                        <span className="text-[10px] text-[#c0f200] font-mono font-bold uppercase tracking-wider">
                          Valid
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1.5 text-xs font-sans">
                      <li
                        className={`flex items-center gap-2 transition-colors duration-200 ${
                          hasMinLength
                            ? 'text-[#c0f200]'
                            : isPasswordViolated
                            ? 'text-rose-300'
                            : 'text-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-colors duration-200 ${
                            hasMinLength
                              ? 'bg-[#c0f200]/20 text-[#c0f200]'
                              : isPasswordViolated
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-white/10 text-zinc-500'
                          }`}
                        >
                          {hasMinLength ? (
                            <Check size={11} weight="bold" />
                          ) : isPasswordViolated ? (
                            <X size={11} weight="bold" />
                          ) : (
                            '•'
                          )}
                        </span>
                        <span className={hasMinLength ? 'text-zinc-200 font-medium' : ''}>
                          Minimum 8 characters
                        </span>
                      </li>

                      <li
                        className={`flex items-center gap-2 transition-colors duration-200 ${
                          hasNumber
                            ? 'text-[#c0f200]'
                            : isPasswordViolated
                            ? 'text-rose-300'
                            : 'text-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-colors duration-200 ${
                            hasNumber
                              ? 'bg-[#c0f200]/20 text-[#c0f200]'
                              : isPasswordViolated
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-white/10 text-zinc-500'
                          }`}
                        >
                          {hasNumber ? (
                            <Check size={11} weight="bold" />
                          ) : isPasswordViolated ? (
                            <X size={11} weight="bold" />
                          ) : (
                            '•'
                          )}
                        </span>
                        <span className={hasNumber ? 'text-zinc-200 font-medium' : ''}>
                          At least 1 number (0-9)
                        </span>
                      </li>

                      <li
                        className={`flex items-center gap-2 transition-colors duration-200 ${
                          hasSpecialChar
                            ? 'text-[#c0f200]'
                            : isPasswordViolated
                            ? 'text-rose-300'
                            : 'text-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-colors duration-200 ${
                            hasSpecialChar
                              ? 'bg-[#c0f200]/20 text-[#c0f200]'
                              : isPasswordViolated
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-white/10 text-zinc-500'
                          }`}
                        >
                          {hasSpecialChar ? (
                            <Check size={11} weight="bold" />
                          ) : isPasswordViolated ? (
                            <X size={11} weight="bold" />
                          ) : (
                            '•'
                          )}
                        </span>
                        <span className={hasSpecialChar ? 'text-zinc-200 font-medium' : ''}>
                          At least 1 special character
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-[#1e2029] hover:bg-[#282b36] border border-white/10 hover:border-white/20 text-white font-medium text-xs sm:text-sm font-sans tracking-tight transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    <span>{mode === 'signup' ? 'Sending code...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <span>{mode === 'signup' ? 'Create account' : 'Log in'}</span>
                )}
              </button>
            </form>

            {/* Legal Terms Micro-copy - Only Terms and Privacy Policy (No Acceptable Use) */}
            <p className="text-[11px] text-zinc-500 font-sans mt-6 text-center leading-relaxed">
              By signing up, you agree to our{' '}
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  navigateTo('terms');
                }}
                className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
              >
                Terms
              </a>{' '}
              and{' '}
              <a
                href="/privacy-policy"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  navigateTo('privacy-policy');
                }}
                className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        )}

        {/* ════════════ STEP 2: VERIFY EMAIL OTP (EXACT USER SCREENSHOT) ════════════ */}
        {step === 'otp_verify' && (
          <div className="w-full flex flex-col items-center animate-apple-scale">
            {/* Title & Subtitle */}
            <h2 className="text-2xl font-semibold text-white tracking-tight font-sans mt-5">
              Verify your email address
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans mt-2 leading-relaxed text-center max-w-xs">
              Enter the verification code below to confirm your identity and sign in to{' '}
              <span className="text-zinc-200 font-semibold">GoBetter</span>.
            </p>

            {/* Recessed Code Box matching media_1788612966510.png */}
            <div className="mt-6 mb-5 w-full rounded-2xl bg-[#0e1017] border border-white/[0.08] p-6 text-center shadow-inner">
              {/* 6 Digit Inputs */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 sm:w-11 sm:h-13 text-center text-2xl font-mono font-bold text-white bg-[#161822] border border-white/10 rounded-lg focus:border-[#c0f200] focus:ring-1 focus:ring-[#c0f200]/30 focus:outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => verifyAndComplete()}
              disabled={isSubmitting || otpDigits.join('').length < 6}
              className="w-full py-2.5 px-4 rounded-xl bg-[#c0f200] hover:bg-[#d4ff1a] text-black font-semibold text-sm font-sans tracking-tight transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
            >
              {isSubmitting ? (
                <>
                  <SpinnerGap size={18} className="animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <span>Verify and continue</span>
              )}
            </button>

            {/* Resend & Change Email Links */}
            <div className="flex items-center justify-between w-full text-xs text-zinc-400 mb-1 px-1">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className={`transition-colors cursor-pointer ${
                  resendCooldown > 0
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-zinc-300 hover:text-[#c0f200]'
                }`}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerLogoBlink();
                  setStep('form');
                  setOtpDigits(['', '', '', '', '', '']);
                }}
                className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Change email
              </button>
            </div>
          </div>
        )}

        {/* ════════════ STEP 3: FORGOT PASSWORD REQUEST ════════════ */}
        {step === 'forgot_password' && (
          <div className="w-full flex flex-col items-center animate-apple-scale">
            <h1 className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight font-sans mt-6">
              Reset your password
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans mt-2 leading-relaxed text-center max-w-xs">
              Enter the email address associated with your account and we'll send you a 6-digit recovery code.
            </p>

            <form onSubmit={handleSendForgotPassword} className="w-full mt-6 space-y-3.5 text-left">
              <div>
                <label className="block text-xs text-zinc-400 font-medium font-sans mb-1.5">
                  Email
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="steve@apple.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  className={`w-full px-3.5 py-2.5 bg-[#121318] border rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all font-sans ${
                    emailError
                      ? 'border-rose-500/70 focus:border-rose-500'
                      : 'border-white/10 focus:border-white/25 focus:ring-1 focus:ring-white/10'
                  }`}
                />
                {emailError && (
                  <p className="text-xs text-rose-400 mt-1">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-[#c0f200] hover:bg-[#d4ff1a] text-black font-semibold text-xs sm:text-sm font-sans tracking-tight transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <span>Send recovery code</span>
                )}
              </button>
            </form>

            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerLogoBlink();
                  setStep('reset_password');
                  setMode('reset-password');
                  setEmailError('');
                  setHasSubmitted(false);
                  window.history.pushState({ auth: 'reset-password' }, '', '/reset-password');
                  document.title = 'Reset Password | GoBetter AI';
                }}
                className="text-xs text-zinc-400 hover:text-[#c0f200] transition-colors cursor-pointer"
              >
                Know your current password? Update password directly
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerLogoBlink();
                setStep('form');
                setMode('login');
                setEmailError('');
                setHasSubmitted(false);
                window.history.pushState({ auth: 'login' }, '', '/login');
                document.title = 'Log In | GoBetter AI';
              }}
              className="mt-4 text-xs text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CaretLeft size={13} weight="bold" />
              <span>Back to log in</span>
            </button>
          </div>
        )}

        {/* ════════════ STEP 4: VERIFY FORGOT PASSWORD & SET NEW PASSWORD ════════════ */}
        {step === 'verify_forgot_password' && (
          <div className="w-full flex flex-col items-center animate-apple-scale">
            <h2 className="text-2xl font-semibold text-white tracking-tight font-sans mt-5">
              Set new password
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans mt-2 leading-relaxed text-center max-w-xs">
              Enter the 6-digit recovery code sent to{' '}
              <span className="text-zinc-200 font-medium">{email}</span> and your new password.
            </p>

            {/* Recessed Code Box */}
            <div className="mt-5 mb-4 w-full rounded-2xl bg-[#0e1017] border border-white/[0.08] p-5 text-center shadow-inner">
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 sm:w-11 sm:h-13 text-center text-2xl font-mono font-bold text-white bg-[#161822] border border-white/10 rounded-lg focus:border-[#c0f200] focus:ring-1 focus:ring-[#c0f200]/30 focus:outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* New Password Input with Right Popover */}
            <form onSubmit={handleVerifyForgotPassword} className="w-full space-y-3.5 text-left">
              <div className="relative">
                <label className="block text-xs text-zinc-400 font-medium font-sans mb-1.5">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setIsNewPasswordFocused(true)}
                    onBlur={() => setIsNewPasswordFocused(false)}
                    className={`w-full px-3.5 py-2.5 pr-10 bg-[#121318] border rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all font-sans ${
                      isNewPasswordViolated
                        ? 'border-rose-500/60 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/20'
                        : 'border-white/10 focus:border-white/25 focus:ring-1 focus:ring-white/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Requirements Popover */}
                {showNewPasswordPopover && (
                  <div
                    className="sm:absolute sm:left-[calc(100%+14px)] sm:top-1/2 sm:-translate-y-1/2 sm:w-[260px] w-full mt-2.5 sm:mt-0 z-40 bg-[#161b22] border border-white/15 rounded-xl p-3.5 shadow-2xl text-left animate-apple-scale pointer-events-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="hidden sm:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#161b22] border-l border-b border-white/15 rotate-45 pointer-events-none" />

                    <div className="text-[11px] font-semibold text-zinc-300 font-sans tracking-wide uppercase mb-2 flex items-center justify-between">
                      <span>Password requirements</span>
                      {isNewPasswordValid && (
                        <span className="text-[10px] text-[#c0f200] font-mono font-bold uppercase tracking-wider">
                          Valid
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1.5 text-xs font-sans">
                      <li
                        className={`flex items-center gap-2 transition-colors duration-200 ${
                          hasNewMinLength
                            ? 'text-[#c0f200]'
                            : isNewPasswordViolated
                            ? 'text-rose-300'
                            : 'text-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-colors duration-200 ${
                            hasNewMinLength
                              ? 'bg-[#c0f200]/20 text-[#c0f200]'
                              : isNewPasswordViolated
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-white/10 text-zinc-500'
                          }`}
                        >
                          {hasNewMinLength ? (
                            <Check size={11} weight="bold" />
                          ) : isNewPasswordViolated ? (
                            <X size={11} weight="bold" />
                          ) : (
                            '•'
                          )}
                        </span>
                        <span className={hasNewMinLength ? 'text-zinc-200 font-medium' : ''}>
                          Minimum 8 characters
                        </span>
                      </li>

                      <li
                        className={`flex items-center gap-2 transition-colors duration-200 ${
                          hasNewNumber
                            ? 'text-[#c0f200]'
                            : isNewPasswordViolated
                            ? 'text-rose-300'
                            : 'text-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-colors duration-200 ${
                            hasNewNumber
                              ? 'bg-[#c0f200]/20 text-[#c0f200]'
                              : isNewPasswordViolated
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-white/10 text-zinc-500'
                          }`}
                        >
                          {hasNewNumber ? (
                            <Check size={11} weight="bold" />
                          ) : isNewPasswordViolated ? (
                            <X size={11} weight="bold" />
                          ) : (
                            '•'
                          )}
                        </span>
                        <span className={hasNewNumber ? 'text-zinc-200 font-medium' : ''}>
                          At least 1 number (0-9)
                        </span>
                      </li>

                      <li
                        className={`flex items-center gap-2 transition-colors duration-200 ${
                          hasNewSpecialChar
                            ? 'text-[#c0f200]'
                            : isNewPasswordViolated
                            ? 'text-rose-300'
                            : 'text-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-colors duration-200 ${
                            hasNewSpecialChar
                              ? 'bg-[#c0f200]/20 text-[#c0f200]'
                              : isNewPasswordViolated
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-white/10 text-zinc-500'
                          }`}
                        >
                          {hasNewSpecialChar ? (
                            <Check size={11} weight="bold" />
                          ) : isNewPasswordViolated ? (
                            <X size={11} weight="bold" />
                          ) : (
                            '•'
                          )}
                        </span>
                        <span className={hasNewSpecialChar ? 'text-zinc-200 font-medium' : ''}>
                          At least 1 special character
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Reset Password Action Button */}
              <button
                type="submit"
                disabled={isSubmitting || otpDigits.join('').length < 6 || !isNewPasswordValid}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-[#c0f200] hover:bg-[#d4ff1a] text-black font-semibold text-xs sm:text-sm font-sans tracking-tight transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <span>Reset password & sign in</span>
                )}
              </button>
            </form>

            {/* Resend Code & Back Links */}
            <div className="flex items-center justify-between w-full text-xs text-zinc-400 mt-5 px-1">
              <button
                type="button"
                onClick={handleResendForgotPassword}
                disabled={resendCooldown > 0}
                className={`transition-colors cursor-pointer ${
                  resendCooldown > 0
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-zinc-300 hover:text-[#c0f200]'
                }`}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerLogoBlink();
                  setStep('form');
                  setMode('login');
                  setOtpDigits(['', '', '', '', '', '']);
                  setNewPassword('');
                  setHasSubmitted(false);
                  window.history.pushState({ auth: 'login' }, '', '/login');
                  document.title = 'Log In | GoBetter AI';
                }}
                className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Back to log in
              </button>
            </div>
          </div>
        )}

        {/* ════════════ STEP 5: DIRECT RESET PASSWORD ════════════ */}
        {step === 'reset_password' && (
          <div className="w-full flex flex-col items-center animate-apple-scale">
            <h1 className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight font-sans mt-6">
              Change your password
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans mt-2 leading-relaxed text-center max-w-xs">
              Enter your account email, current password, and choose a new secure password.
            </p>

            <form onSubmit={handleDirectResetPassword} className="w-full mt-6 space-y-3.5 text-left">
              <div>
                <label className="block text-xs text-zinc-400 font-medium font-sans mb-1.5">
                  Email
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="steve@apple.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  className={`w-full px-3.5 py-2.5 bg-[#121318] border rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all font-sans ${
                    emailError
                      ? 'border-rose-500/70 focus:border-rose-500'
                      : 'border-white/10 focus:border-white/25 focus:ring-1 focus:ring-white/10'
                  }`}
                />
                {emailError && (
                  <p className="text-xs text-rose-400 mt-1">{emailError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-medium font-sans mb-1.5">
                  Current Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-[#121318] border border-white/10 focus:border-white/25 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                  >
                    {showOldPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs text-zinc-400 font-medium font-sans mb-1.5">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setIsNewPasswordFocused(true)}
                    onBlur={() => setIsNewPasswordFocused(false)}
                    className={`w-full px-3.5 py-2.5 pr-10 bg-[#121318] border rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all font-sans ${
                      isNewPasswordViolated
                        ? 'border-rose-500/60 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/20'
                        : 'border-white/10 focus:border-white/25 focus:ring-1 focus:ring-white/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password requirements popover */}
                {showNewPasswordPopover && (
                  <div
                    className="sm:absolute sm:left-[calc(100%+14px)] sm:top-1/2 sm:-translate-y-1/2 sm:w-[260px] w-full mt-2.5 sm:mt-0 z-40 bg-[#161b22] border border-white/15 rounded-xl p-3.5 shadow-2xl text-left animate-apple-scale pointer-events-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="hidden sm:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#161b22] border-l border-b border-white/15 rotate-45 pointer-events-none" />
                    <div className="text-[11px] font-semibold text-zinc-300 font-sans tracking-wide uppercase mb-2 flex items-center justify-between">
                      <span>Password requirements</span>
                      {isNewPasswordValid && (
                        <span className="text-[#c0f200] text-[10px] font-normal lowercase flex items-center gap-1">
                          <Check size={12} weight="bold" />
                          <span>valid</span>
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1.5 text-xs font-sans">
                      <li className={`flex items-center gap-2 transition-colors duration-200 ${hasNewMinLength ? 'text-[#c0f200]' : isNewPasswordViolated ? 'text-rose-300' : 'text-zinc-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${hasNewMinLength ? 'bg-[#c0f200]/20 text-[#c0f200]' : isNewPasswordViolated ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-zinc-500'}`}>
                          {hasNewMinLength ? <Check size={11} weight="bold" /> : isNewPasswordViolated ? <X size={11} weight="bold" /> : '•'}
                        </span>
                        <span className={hasNewMinLength ? 'text-zinc-200 font-medium' : ''}>Minimum 8 characters</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-colors duration-200 ${hasNewNumber ? 'text-[#c0f200]' : isNewPasswordViolated ? 'text-rose-300' : 'text-zinc-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${hasNewNumber ? 'bg-[#c0f200]/20 text-[#c0f200]' : isNewPasswordViolated ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-zinc-500'}`}>
                          {hasNewNumber ? <Check size={11} weight="bold" /> : isNewPasswordViolated ? <X size={11} weight="bold" /> : '•'}
                        </span>
                        <span className={hasNewNumber ? 'text-zinc-200 font-medium' : ''}>At least 1 number (0-9)</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-colors duration-200 ${hasNewSpecialChar ? 'text-[#c0f200]' : isNewPasswordViolated ? 'text-rose-300' : 'text-zinc-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${hasNewSpecialChar ? 'bg-[#c0f200]/20 text-[#c0f200]' : isNewPasswordViolated ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-zinc-500'}`}>
                          {hasNewSpecialChar ? <Check size={11} weight="bold" /> : isNewPasswordViolated ? <X size={11} weight="bold" /> : '•'}
                        </span>
                        <span className={hasNewSpecialChar ? 'text-zinc-200 font-medium' : ''}>At least 1 special character</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-medium font-sans mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-[#121318] border border-white/10 focus:border-white/25 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !oldPassword || !isNewPasswordValid || newPassword !== confirmPassword}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-[#c0f200] hover:bg-[#d4ff1a] text-black font-semibold text-xs sm:text-sm font-sans tracking-tight transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <span>Update password</span>
                )}
              </button>
            </form>

            <div className="flex items-center justify-between w-full text-xs text-zinc-400 mt-5 px-1">
              <button
                type="button"
                onClick={() => {
                  triggerLogoBlink();
                  setStep('forgot_password');
                  setMode('forgot-password');
                  window.history.pushState({ auth: 'forgot-password' }, '', '/forgot-password');
                  document.title = 'Forgot Password | GoBetter AI';
                }}
                className="text-zinc-300 hover:text-[#c0f200] transition-colors cursor-pointer"
              >
                Forgot current password?
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerLogoBlink();
                  setStep('form');
                  setMode('login');
                  setEmailError('');
                  setHasSubmitted(false);
                  window.history.pushState({ auth: 'login' }, '', '/login');
                  document.title = 'Log In | GoBetter AI';
                }}
                className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CaretLeft size={13} weight="bold" />
                <span>Back to log in</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Subtle bottom balance spacer ── */}
      <div className="relative z-20 w-full h-8 sm:h-12 shrink-0 pointer-events-none" />
    </div>
  );
};
