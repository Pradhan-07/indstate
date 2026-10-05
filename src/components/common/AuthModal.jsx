import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Lock, Mail, User, MapPin, Eye, EyeOff, 
  ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck, 
  RotateCcw, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INDIAN_STATES, UNION_TERRITORIES, ALL_REGIONS } from '../../data/indianStatesAndCities';
import IndstateLogo from './IndstateLogo';
import OtpInput from '../auth/OtpInput';
import PasswordStrengthIndicator, { calculatePasswordStrength } from '../auth/PasswordStrengthIndicator';

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authMode, 
    setAuthMode, 
    signInWithPassword,
    signInWithGoogle,
    sendOtp,
    verifyOtp,
    completeRegistration,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPassword,
    redirectPath,
    setRedirectPath,
    isConfigured,
    enterInstantDemo
  } = useAuth();

  const navigate = useNavigate();

  // Mode: 'login' | 'register' | 'forgot'
  const [currentMode, setCurrentMode] = useState('login');

  // Sub-steps for register & forgot password flows:
  // Register: 1 = Enter Email, 2 = Verify OTP, 3 = Complete Profile
  // Forgot: 1 = Enter Email, 2 = Verify OTP, 3 = Set New Password
  const [step, setStep] = useState(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Resend OTP Cooldown (60 seconds)
  const [cooldown, setCooldown] = useState(0);

  // Active error displayed in modal banner
  const activeError = errorMessage;

  // Sync mode with context
  useEffect(() => {
    if (authMode === 'register') {
      setCurrentMode('register');
      setStep(1);
    } else if (authMode === 'forgot-password' || authMode === 'forgot') {
      setCurrentMode('forgot');
      setStep(1);
    } else {
      setCurrentMode('login');
      setStep(1);
    }
    setErrorMessage('');
    setSuccessMessage('');
  }, [authMode, isAuthModalOpen]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    closeAuthModal();
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handlePostAuthSuccess = () => {
    handleClose();
    if (redirectPath) {
      const dest = redirectPath;
      setRedirectPath(null);
      navigate(dest);
    }
  };

  // --------------------------------------------------------------------------
  // LOGIN FLOW (Email + Password)
  // --------------------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithPassword(email, password);
      handlePostAuthSuccess();
    } catch (err) {
      setErrorMessage(err.message || 'Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // INSTANT DEMO (Explore website instantly without credentials)
  // --------------------------------------------------------------------------
  const handleInstantDemo = () => {
    setErrorMessage('');
    enterInstantDemo();
    handlePostAuthSuccess();
  };

  // --------------------------------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMessage(err.message || 'Google sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // REGISTER FLOW - STEP 1: Send OTP to Email
  // --------------------------------------------------------------------------
  const handleRegisterSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage('Invalid email address. Please enter a valid email.');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(normalizedEmail);
      setSuccessMessage(`Verification code sent to ${normalizedEmail}`);
      setStep(2);
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (currentMode === 'register') {
        await sendOtp(email.trim().toLowerCase());
      } else {
        await sendPasswordResetOtp(email.trim().toLowerCase());
      }
      setSuccessMessage('A fresh verification code has been sent to your email.');
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // REGISTER FLOW - STEP 2: Verify OTP
  // --------------------------------------------------------------------------
  const handleRegisterVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(email, code);
      setSuccessMessage('Email verified successfully! Complete your profile.');
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // REGISTER FLOW - STEP 3: Complete Profile & Password
  // --------------------------------------------------------------------------
  const handleRegisterComplete = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    if (!selectedState) {
      setErrorMessage('State is required. Indian State / UT selection is compulsory.');
      return;
    }

    const { isValid } = calculatePasswordStrength(password);
    if (!isValid) {
      setErrorMessage('Password does not meet requirements (min 8 characters, uppercase, lowercase, number).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await completeRegistration({
        fullName,
        state: selectedState,
        city,
        phone,
        password
      });

      handlePostAuthSuccess();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // FORGOT PASSWORD FLOW
  // --------------------------------------------------------------------------
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage('Invalid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetOtp(normalizedEmail);
      setSuccessMessage(`Password reset code sent to ${normalizedEmail}`);
      setStep(2);
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyPasswordResetOtp(email, code);
      setSuccessMessage('Code verified. You can now set your new password.');
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const { isValid } = calculatePasswordStrength(password);
    if (!isValid) {
      setErrorMessage('Password does not meet requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(password);
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setTimeout(() => {
        setCurrentMode('login');
        setStep(1);
        setPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '460px', 
          width: '92%',
          padding: 'clamp(20px, 4vw, 32px)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          aria-label="Close authentication modal"
          style={{ 
            position: 'absolute', 
            top: '18px', 
            right: '18px', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <IndstateLogo height={36} />
          </div>

          {currentMode === 'login' && (
            <>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.3px' }}>
                Welcome back to INDSTATE
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Sign in to manage your saved properties and inquiries
              </p>
            </>
          )}

          {currentMode === 'register' && (
            <>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.3px' }}>
                {step === 1 && 'Create your INDSTATE account'}
                {step === 2 && 'Verify your email'}
                {step === 3 && 'Complete your profile'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {step === 1 && 'Join India\'s 100% RERA verified property marketplace'}
                {step === 2 && `We sent a verification code to ${email}`}
                {step === 3 && 'Provide your details and state to activate your account'}
              </p>
            </>
          )}

          {currentMode === 'forgot' && (
            <>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.3px' }}>
                {step === 1 && 'Forgot your password?'}
                {step === 2 && 'Verify your email'}
                {step === 3 && 'Create New Password'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {step === 1 && 'Enter your email to receive a password reset verification code'}
                {step === 2 && `Enter the 6-digit OTP code sent to ${email}`}
                {step === 3 && 'Set a strong new password for your account'}
              </p>
            </>
          )}
        </div>

        {/* Global Error Banner */}
        {activeError && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '11px 14px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)',
              color: '#DC2626',
              fontSize: '13px',
              lineHeight: 1.4,
              marginBottom: '18px',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{activeError}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '11px 14px',
              background: 'var(--rera-green-light)',
              border: '1px solid var(--rera-green-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--rera-green)',
              fontSize: '13px',
              lineHeight: 1.4,
              marginBottom: '18px',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 1: LOGIN MODE                                               */}
        {/* ================================================================= */}
        {currentMode === 'login' && (
          <div>
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                background: '#FFFFFF',
                color: 'var(--text-main)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-xs)',
                marginBottom: '18px'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                or sign in with email
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--saffron)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Password
                  </label>
                  <button 
                    type="button"
                    onClick={() => {
                      setCurrentMode('forgot');
                      setStep(1);
                      setErrorMessage('');
                    }}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--saffron)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    placeholder="Enter your password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--saffron)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Instant Demo Option */}
              <button
                type="button"
                onClick={handleInstantDemo}
                disabled={isLoading}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px dashed var(--saffron)',
                  background: 'var(--saffron-light)',
                  color: '#92400E',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF3C7'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--saffron-light)'}
              >
                <Sparkles size={15} />
                <span>⚡ Instant Demo (Explore without sign in)</span>
              </button>
            </form>

            <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '13px', color: 'var(--text-body)' }}>
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => {
                  setCurrentMode('register');
                  setStep(1);
                  setErrorMessage('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--saffron)', fontWeight: 700, cursor: 'pointer' }}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: REGISTER FLOW                                             */}
        {/* ================================================================= */}
        {currentMode === 'register' && (
          <div>
            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <div>
                {/* Google OAuth Option */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-color)',
                    background: '#FFFFFF',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-xs)',
                    marginBottom: '18px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign up with Google</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    or with verified email
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>

                <form onSubmit={handleRegisterSendOtp}>
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                      Email
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-color)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--saffron)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
                  >
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>

                <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '13px', color: 'var(--text-body)' }}>
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setCurrentMode('login');
                      setErrorMessage('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--saffron)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: OTP Verification */}
            {step === 2 && (
              <div>
                <form onSubmit={handleRegisterVerifyOtp}>
                  <OtpInput 
                    value={otpDigits}
                    onChange={setOtpDigits}
                    onComplete={() => {}}
                    disabled={isLoading}
                  />

                  <button 
                    type="submit" 
                    disabled={isLoading || otpDigits.some(d => d === '')}
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
                  >
                    {isLoading ? 'Verifying Code...' : 'Verify'}
                  </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Didn't receive it?{' '}
                  {cooldown > 0 ? (
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      Resend OTP in {cooldown}s
                    </span>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      style={{ background: 'none', border: 'none', color: 'var(--saffron)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ArrowLeft size={13} /> Change Email
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Complete Profile & Password */}
            {step === 3 && (
              <form onSubmit={handleRegisterComplete}>
                {/* Full Name */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                    Full Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Arjun Verma" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* State * (Compulsory) */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                    State * <span style={{ color: '#DC2626' }}>(Compulsory)</span>
                  </label>
                  <select 
                    value={selectedState}
                    onChange={e => setSelectedState(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#FFFFFF',
                      color: selectedState ? 'var(--primary)' : 'var(--text-muted)'
                    }}
                  >
                    <option value="">Select State</option>
                    <optgroup label="Indian States (28)">
                      {INDIAN_STATES.map(s => (
                        <option key={s.code} value={s.name}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Union Territories (8)">
                      {UNION_TERRITORIES.map(s => (
                        <option key={s.code} value={s.name}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* City (Optional) */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-main)' }}>
                    City <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mumbai, Bengaluru, Pune" 
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Password & Strength */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                    Create Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="Minimum 8 characters" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-color)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                    Confirm Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      required
                      placeholder="Re-enter password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-color)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || !selectedState}
                  className="btn btn-primary" 
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '14px', 
                    fontWeight: 700,
                    opacity: !selectedState ? 0.7 : 1 
                  }}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: FORGOT PASSWORD FLOW                                      */}
        {/* ================================================================= */}
        {currentMode === 'forgot' && (
          <div>
            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <form onSubmit={handleForgotSendOtp}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                    Email
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
                >
                  {isLoading ? 'Sending Code...' : 'Send OTP'}
                </button>

                <div style={{ marginTop: '18px', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setCurrentMode('login');
                      setErrorMessage('');
                    }}
                    style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {step === 2 && (
              <div>
                <form onSubmit={handleForgotVerifyOtp}>
                  <OtpInput 
                    value={otpDigits}
                    onChange={setOtpDigits}
                    onComplete={() => {}}
                    disabled={isLoading}
                  />

                  <button 
                    type="submit" 
                    disabled={isLoading || otpDigits.some(d => d === '')}
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
                  >
                    {isLoading ? 'Verifying Code...' : 'Verify'}
                  </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Didn't receive it?{' '}
                  {cooldown > 0 ? (
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      Resend OTP in {cooldown}s
                    </span>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      style={{ background: 'none', border: 'none', color: 'var(--saffron)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ArrowLeft size={13} /> Change Email
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Reset Password */}
            {step === 3 && (
              <form onSubmit={handleForgotResetPassword}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="Minimum 8 characters" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-color)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle new password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      required
                      placeholder="Re-enter new password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-color)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm new password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
                >
                  {isLoading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Legal Disclaimer Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          By continuing, you agree to INDSTATE's <a href="/terms" style={{ color: 'var(--saffron)' }}>Terms</a> and <a href="/rera-disclaimer" style={{ color: 'var(--saffron)' }}>RERA Disclaimers</a>.
        </div>
      </div>
    </div>
  );
}
