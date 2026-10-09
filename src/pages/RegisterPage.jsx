import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  AlertCircle, CheckCircle2, ShieldCheck, 
  Eye, EyeOff, Sparkles, Building2, User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES, UNION_TERRITORIES } from '../data/indianStatesAndCities';
import IndstateLogo from '../components/common/IndstateLogo';
import PasswordStrengthIndicator, { calculatePasswordStrength } from '../components/auth/PasswordStrengthIndicator';

export default function RegisterPage() {
  const { 
    registerDirect, 
    signInWithGoogle, 
    signInAsPreset,
    PRESET_ACCOUNTS,
    isAuthenticated,
    enterInstantDemo
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('Buyer');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTarget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!selectedState) {
      setErrorMessage('State is required. Indian State / UT selection is compulsory.');
      return;
    }

    const { isValid } = calculatePasswordStrength(password);
    if (!isValid) {
      setErrorMessage('Password must be at least 8 characters with uppercase, lowercase and number.');
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
        email: normalized,
        password,
        state: selectedState,
        city,
        phone,
        role: selectedRole
      });

      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate(redirectTarget, { replace: true });
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle(redirectTarget);
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      if (err?.message) {
        setErrorMessage(err.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePresetLogin = (presetId) => {
    setErrorMessage('');
    signInAsPreset(presetId);
    navigate(redirectTarget, { replace: true });
  };

  const handleInstantDemo = () => {
    enterInstantDemo();
    navigate(redirectTarget, { replace: true });
  };

  // Selected State major cities
  const stateObj = INDIAN_STATES.find(s => s.name === selectedState);
  const citySuggestions = stateObj ? stateObj.cities.map(c => c.name) : [];

  return (
    <div style={{ minHeight: '80vh', padding: '60px 16px', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
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

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.4px', margin: 0 }}>
            Create your INDSTATE account
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
            Join India's 100% RERA verified property marketplace
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
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

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
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
            cursor: (isLoading || isGoogleLoading) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || isGoogleLoading) ? 0.8 : 1,
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-xs)',
            marginBottom: '20px'
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
              <span>Sign up with Google</span>
            </>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            or register with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Direct Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '14px' }}>
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

          {/* Email Address */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
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
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* State * (Compulsory) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
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
                padding: '11px 14px',
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

          {/* City & Phone (2 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                City <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input 
                type="text" 
                list="reg-city-suggestions"
                placeholder="e.g. Mumbai"
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Phone <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <span style={{ padding: '11px 10px', background: 'var(--bg-alt)', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  +91
                </span>
                <input 
                  type="tel" 
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    border: 'none',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Role selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              I am registering as:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {['Buyer', 'Owner', 'Agent'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  style={{
                    padding: '9px',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedRole === role ? 'var(--saffron)' : 'var(--border-color)'}`,
                    background: selectedRole === role ? 'var(--saffron-light)' : '#FFFFFF',
                    color: selectedRole === role ? 'var(--saffron)' : 'var(--text-body)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {role === 'Buyer' ? 'Buyer / Tenant' : role === 'Owner' ? 'Property Owner' : 'Agent Partner'}
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
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
          <div style={{ marginBottom: '22px' }}>
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

        {/* 1-Click Test Accounts */}
        <div style={{ marginTop: '26px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              ⚡ 1-Click Test Accounts
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Skip registration</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
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
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                  {preset.role === 'Buyer' ? '👤' : preset.role === 'Agent' ? '🏢' : '🏡'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                  {preset.role}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {preset.city}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleInstantDemo}
            disabled={isLoading}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '11px 14px',
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
              gap: '6px'
            }}
          >
            <Sparkles size={16} />
            <span>Instant Demo (Explore without creating account)</span>
          </button>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-body)' }}>
          Already have an account?{' '}
          <Link 
            to={`/login${redirectTarget !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`} 
            style={{ color: 'var(--saffron)', fontWeight: 700, textDecoration: 'none' }}
          >
            Sign In
          </Link>
        </div>

        <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--rera-green)' }}>
          <ShieldCheck size={16} />
          <span>100% RERA Verified & Safe Registration</span>
        </div>
      </div>
    </div>
  );
}
