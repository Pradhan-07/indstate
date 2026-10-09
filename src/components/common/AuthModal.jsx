import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Eye, EyeOff, ArrowLeft, AlertCircle, 
  CheckCircle2, ShieldCheck, Sparkles, Building2, User, KeyRound 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INDIAN_STATES, UNION_TERRITORIES } from '../../data/indianStatesAndCities';
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
    registerDirect,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPassword,
    signInAsPreset,
    PRESET_ACCOUNTS,
    redirectPath,
    setRedirectPath,
    enterInstantDemo
  } = useAuth();

  const navigate = useNavigate();

  // Mode: 'login' | 'register' | 'forgot'
  const [currentMode, setCurrentMode] = useState('login');

  // Forgot password step: 1 = Email, 2 = OTP, 3 = Password
  const [forgotStep, setForgotStep] = useState(1);

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
  const [selectedRole, setSelectedRole] = useState('Buyer');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Sync mode with context
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setIsGoogleLoading(false);
      setIsLoading(false);
      if (authMode === 'register') {
        setCurrentMode('register');
      } else if (authMode === 'forgot-password' || authMode === 'forgot') {
        setCurrentMode('forgot');
        setForgotStep(1);
      } else {
        setCurrentMode('login');
      }
    }
  }, [authMode, isAuthModalOpen]);

  // Cooldown timer
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

  // 1. LOGIN SUBMIT
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

  // 2. REGISTER SUBMIT (Direct 1-step registration)
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!selectedState) {
      setErrorMessage('State is required. Indian State / UT selection is compulsory.');
      return;
    }

    const { isValid } = calculatePasswordStrength(password);
    if (!isValid) {
      setErrorMessage('Password must be at least 8 characters with letters and numbers.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await registerDirect({
        fullName,
        email,
        password,
        state: selectedState,
        city,
        phone,
        role: selectedRole
      });
      setSuccessMessage('Account created successfully! Welcome to INDSTATE.');
      setTimeout(() => {
        handlePostAuthSuccess();
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. GOOGLE SIGN IN
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      handlePostAuthSuccess();
    } catch (err) {
      if (err?.message) {
        setErrorMessage(err.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 4. QUICK PRESET LOGIN
  const handlePresetLogin = (presetId) => {
    setErrorMessage('');
    signInAsPreset(presetId);
    handlePostAuthSuccess();
  };

  // 5. INSTANT DEMO LOGIN
  const handleInstantDemo = () => {
    setErrorMessage('');
    enterInstantDemo();
    handlePostAuthSuccess();
  };

  // 6. FORGOT PASSWORD FLOW
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setErrorMessage('Invalid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendPasswordResetOtp(normalized);
      if (res?.isRateLimited) {
        setSuccessMessage('Demo OTP code is 123456. Enter it below to proceed.');
      } else {
        setSuccessMessage(`Password reset code sent to ${normalized}`);
      }
      setForgotStep(2);
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
      setSuccessMessage('Code verified! Set your new password.');
      setForgotStep(3);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(password);
      setSuccessMessage('Password reset successfully! You can now sign in.');
      setTimeout(() => {
        setCurrentMode('login');
        setForgotStep(1);
        setPassword('');
        setConfirmPassword('');
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Selected State Cities
  const stateObj = INDIAN_STATES.find(s => s.name === selectedState);
  const citySuggestions = stateObj ? stateObj.cities.map(c => c.name) : [];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: currentMode === 'register' ? '520px' : '480px', 
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
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
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ marginBottom: '10px' }}>
            <IndstateLogo height={38} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.3px', margin: 0 }}>
            {currentMode === 'login' && 'Welcome to INDSTATE'}
            {currentMode === 'register' && 'Join INDSTATE Real Estate'}
            {currentMode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
            {currentMode === 'login' && 'India\'s 100% RERA Verified Property Marketplace'}
            {currentMode === 'register' && 'Search, post & verify properties across all 28 States & UTs'}
            {currentMode === 'forgot' && 'Secure account password recovery'}
          </p>
        </div>

        {/* Top Tab Switcher (Sign In vs Create Account) */}
        {currentMode !== 'forgot' && (
          <div 
            style={{ 
              display: 'flex', 
              background: '#F1F5F9', 
              borderRadius: '10px', 
              padding: '4px', 
              marginBottom: '20px' 
            }}
          >
            <button
              type="button"
              onClick={() => {
                setCurrentMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: currentMode === 'login' ? '#FFFFFF' : 'transparent',
                color: currentMode === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: currentMode === 'login' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: currentMode === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: currentMode === 'register' ? '#FFFFFF' : 'transparent',
                color: currentMode === 'register' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: currentMode === 'register' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: currentMode === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
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
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
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
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        {currentMode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
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
                cursor: (isLoading || isGoogleLoading) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || isGoogleLoading) ? 0.8 : 1,
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-xs)',
                marginBottom: '16px'
              }}
            >
              {isGoogleLoading ? (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(0,0,0,0.15)',
                    borderTopColor: 'var(--saffron, #FF9933)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{currentMode === 'login' ? 'Continue with Google' : 'Sign up with Google'}</span>
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                or with email
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 1: SIGN IN FORM                                              */}
        {/* ================================================================= */}
        {currentMode === 'login' && (
          <div>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                  Email Address
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

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Password
                  </label>
                  <button 
                    type="button"
                    onClick={() => {
                      setCurrentMode('forgot');
                      setForgotStep(1);
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
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Quick 1-Click Test Logins Section */}
            <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  ⚡ Quick 1-Click Test Logins
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Instant Access</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {PRESET_ACCOUNTS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetLogin(preset.id)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: '#F8FAFC',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--saffron)';
                      e.currentTarget.style.background = '#FFFFFF';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = '#F8FAFC';
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>
                      {preset.role === 'Buyer' ? '👤' : preset.role === 'Agent' ? '🏢' : '🏡'}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                      {preset.role}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {preset.city}
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleInstantDemo}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px dashed var(--saffron)',
                  background: 'var(--saffron-light)',
                  color: '#92400E',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} />
                <span>Instant Demo Visitor (Explore without typing)</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: REGISTER FORM (Direct 1-Step)                            */}
        {/* ================================================================= */}
        {currentMode === 'register' && (
          <form onSubmit={handleRegister}>
            {/* Full Name */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
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

            {/* Email Address */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                Email Address *
              </label>
              <input 
                type="email" 
                required
                placeholder="name@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
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
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                State * <span style={{ color: '#DC2626' }}>(Required for RERA)</span>
              </label>
              <select 
                value={selectedState}
                onChange={e => {
                  setSelectedState(e.target.value);
                  setCity('');
                }}
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
                <option value="">Select Indian State / UT</option>
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

            {/* City & Phone in 2 Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                  City <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input 
                  type="text" 
                  list="modal-city-suggestions"
                  placeholder="e.g. Mumbai" 
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                {citySuggestions.length > 0 && (
                  <datalist id="modal-city-suggestions">
                    {citySuggestions.map(cityName => (
                      <option key={cityName} value={cityName} />
                    ))}
                  </datalist>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                  Phone <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input 
                  type="tel" 
                  maxLength={10}
                  placeholder="98765 43210" 
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Account Role */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                I am registering as:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['Buyer', 'Owner', 'Agent'].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: `1.5px solid ${selectedRole === role ? 'var(--saffron)' : 'var(--border-color)'}`,
                      background: selectedRole === role ? 'var(--saffron-light)' : '#FFFFFF',
                      color: selectedRole === role ? 'var(--saffron)' : 'var(--text-body)',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {role === 'Buyer' ? 'Buyer / Tenant' : role === 'Owner' ? 'Property Owner' : 'Agent Partner'}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
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
                    padding: '10px 38px 10px 12px',
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
                    right: '10px',
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
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
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
                    padding: '10px 38px 10px 12px',
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
                    right: '10px',
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

        {/* ================================================================= */}
        {/* VIEW 3: FORGOT PASSWORD FLOW                                      */}
        {/* ================================================================= */}
        {currentMode === 'forgot' && (
          <div>
            {forgotStep === 1 && (
              <form onSubmit={handleForgotSendOtp}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                    Email Address
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
              </form>
            )}

            {forgotStep === 2 && (
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
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700, marginTop: '12px' }}
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotResetPassword}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                    New Password
                  </label>
                  <input 
                    type="password" 
                    required
                    placeholder="Minimum 6 characters" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                    Confirm Password
                  </label>
                  <input 
                    type="password" 
                    required
                    placeholder="Re-enter password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
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
                  {isLoading ? 'Updating...' : 'Set New Password'}
                </button>
              </form>
            )}

            <div style={{ marginTop: '18px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('login');
                  setForgotStep(1);
                  setErrorMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--rera-green)' }}>
          <ShieldCheck size={15} />
          <span>Secured by 256-Bit SSL • 100% RERA Verified</span>
        </div>
      </div>
    </div>
  );
}
