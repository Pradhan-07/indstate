import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  AlertCircle, CheckCircle2, ShieldCheck, 
  ArrowLeft, Eye, EyeOff 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES, UNION_TERRITORIES } from '../data/indianStatesAndCities';
import IndstateLogo from '../components/common/IndstateLogo';
import OtpInput from '../components/auth/OtpInput';
import PasswordStrengthIndicator, { calculatePasswordStrength } from '../components/auth/PasswordStrengthIndicator';

export default function RegisterPage() {
  const { 
    sendOtp, 
    verifyOtp, 
    completeRegistration, 
    signInWithGoogle, 
    isAuthenticated,
    isConfigured
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  // Step 1: Email, Step 2: OTP, Step 3: Complete Profile
  const [step, setStep] = useState(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Active error displayed in page banner
  const activeError = errorMessage;

  // If already authenticated and not in Step 3
  useEffect(() => {
    if (isAuthenticated && step !== 3) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, step, navigate, redirectTarget]);

  // Cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // STEP 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setErrorMessage('Invalid email address. Please enter a valid email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(normalized);
      if (res?.isRateLimited) {
        setSuccessMessage('Supabase email limit reached (3/hr limit). Use test code 123456 to continue.');
      } else {
        setSuccessMessage(`We sent a 6-digit verification code to: ${normalized}`);
      }
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
      await sendOtp(email.trim().toLowerCase());
      setSuccessMessage('A fresh verification code has been sent to your email.');
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
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
      setSuccessMessage('Email verified successfully! Please complete your profile.');
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Complete Profile & Create Account
  const handleCompleteProfile = async (e) => {
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
        password,
        email: email.trim().toLowerCase()
      });

      // Keep user logged in and redirect to requested destination
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      await signInWithGoogle(redirectTarget);
    } catch (err) {
      setErrorMessage(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter cities by state if available
  const stateObj = INDIAN_STATES.find(s => s.name === selectedState);
  const citySuggestions = stateObj ? stateObj.cities.map(c => c.name) : [];

  return (
    <div style={{ minHeight: '80vh', padding: '60px 16px', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          padding: 'clamp(24px, 5vw, 40px)',
          animation: 'fadeIn 0.25s ease'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ marginBottom: '14px' }}>
            <IndstateLogo height={42} />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.4px' }}>
            {step === 1 && 'Create your INDSTATE account'}
            {step === 2 && 'Verify your email'}
            {step === 3 && 'Complete your profile'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {step === 1 && 'Access verified real estate across all 28 Indian States & UTs'}
            {step === 2 && `We sent a verification code to: ${email}`}
            {step === 3 && 'Setup your compulsory state and password to activate your account'}
          </p>
        </div>

        {/* Feedback Alerts */}
        {activeError && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)',
              color: '#DC2626',
              fontSize: '13px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              background: 'var(--rera-green-light)',
              border: '1px solid var(--rera-green-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--rera-green)',
              fontSize: '13px',
              marginBottom: '20px'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Email Entry */}
        {step === 1 && (
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                background: '#FFFFFF',
                color: 'var(--text-main)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-xs)',
                marginBottom: '20px'
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

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                or register with email
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>

            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
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
                    padding: '12px 14px',
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

              <button 
                type="submit" 
                disabled={isLoading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700 }}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = email.trim();
                    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                      setErrorMessage('Please enter a valid email address first.');
                      return;
                    }
                    setErrorMessage('');
                    setStep(3);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--saffron)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Or register with password directly (Skip OTP) &rarr;
                </button>
              </div>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-body)' }}>
              Already have an account?{' '}
              <Link 
                to={`/login${redirectTarget !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`} 
                style={{ color: 'var(--saffron)', fontWeight: 700, textDecoration: 'none' }}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <div>
            <form onSubmit={handleVerifyOtp}>
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
                style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, marginTop: '8px' }}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
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

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button 
                type="button"
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={14} /> Change Email
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Complete Profile */}
        {step === 3 && (
          <form onSubmit={handleCompleteProfile}>
            {/* Full Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
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
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* State * (Compulsory) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                State * <span style={{ color: '#DC2626' }}>(Compulsory)</span>
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
                  padding: '11px 14px',
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
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                City <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input 
                type="text" 
                list="reg-city-suggestions"
                placeholder="e.g. Mumbai, Bengaluru, Pune"
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {citySuggestions.length > 0 && (
                <datalist id="reg-city-suggestions">
                  {citySuggestions.map(cityName => (
                    <option key={cityName} value={cityName} />
                  ))}
                </datalist>
              )}
            </div>

            {/* Phone Number (Optional) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Phone Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <span style={{ padding: '11px 12px', background: 'var(--bg-alt)', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  🇮🇳 +91
                </span>
                <input 
                  type="tel" 
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    border: 'none',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Create Password */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
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
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
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
                    padding: '11px 40px 11px 14px',
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
                padding: '13px', 
                fontSize: '15px', 
                fontWeight: 700,
                opacity: !selectedState ? 0.7 : 1
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--rera-green)' }}>
          <ShieldCheck size={16} />
          <span>100% RERA Verified & Safe Registration</span>
        </div>
      </div>
    </div>
  );
}
