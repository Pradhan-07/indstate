import React, { useState } from 'react';
import { 
  User, Mail, MapPin, Phone, Calendar, ShieldCheck, 
  CheckCircle2, AlertCircle, Lock, Save, Eye, EyeOff, 
  ArrowRight, Building2, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES, UNION_TERRITORIES, ALL_REGIONS } from '../data/indianStatesAndCities';
import PasswordStrengthIndicator, { calculatePasswordStrength } from '../components/auth/PasswordStrengthIndicator';

export default function ProfilePage() {
  const { user, profile, updateProfile, resetPassword, switchRole } = useAuth();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [selectedState, setSelectedState] = useState(user?.state || '');
  const [city, setCity] = useState(user?.city || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState(user?.role || 'Buyer');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Format Member Since date
  const memberSinceFormatted = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'October 2026';

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!fullName.trim()) {
      setProfileError('Full Name is required.');
      return;
    }

    if (!selectedState) {
      setProfileError('State is required. Indian State / UT selection is compulsory.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        state: selectedState,
        city: city.trim(),
        phone: phone.trim(),
        role
      });
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    const { isValid } = calculatePasswordStrength(newPassword);
    if (!isValid) {
      setPasswordError('Password does not meet requirements (min 8 characters, uppercase, lowercase, number).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await resetPassword(newPassword);
      setPasswordSuccess('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const stateObj = ALL_REGIONS.find(s => s.name === selectedState);
  const citySuggestions = stateObj ? stateObj.cities.map(c => c.name) : [];

  return (
    <div style={{ padding: '40px 0 80px 0', background: 'var(--bg-page)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Profile Card Header */}
        <div 
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: 'clamp(20px, 4vw, 32px)',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img 
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
              alt={user?.name}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--saffron)',
                boxShadow: 'var(--shadow-xs)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                  {user?.name || 'INDSTATE Member'}
                </h1>
                <span 
                  style={{
                    background: 'var(--saffron-light)',
                    color: 'var(--saffron)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--saffron-border)'
                  }}
                >
                  {user?.role || 'Buyer'} Account
                </span>
                <span 
                  style={{
                    background: 'var(--rera-green-light)',
                    color: 'var(--rera-green)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={12} /> Email Verified
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} /> {user?.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} /> {user?.city ? `${user.city}, ` : ''}{user?.state || 'State Not Set'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={14} /> Member Since: {memberSinceFormatted}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Left = Edit Profile, Right = Security & Password */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          
          {/* Card 1: Personal Information */}
          <div 
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '28px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <User size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                Personal Information
              </h2>
            </div>

            {profileError && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 'var(--radius-md)',
                  color: '#DC2626',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}
              >
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'var(--rera-green-light)',
                  border: '1px solid var(--rera-green-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--rera-green)',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              {/* Full Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Full Name *
                </label>
                <input 
                  type="text"
                  required
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

              {/* Email (Read-Only) */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Email Address
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--rera-green)', fontWeight: 600 }}>
                    Verified via OTP
                  </span>
                </div>
                <input 
                  type="email"
                  disabled
                  value={user?.email || ''}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    background: 'var(--bg-alt)',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed'
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
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#FFFFFF'
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

              {/* City */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  City <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input 
                  type="text"
                  list="profile-cities"
                  value={city}
                  placeholder="e.g. Mumbai, Bengaluru"
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
                  <datalist id="profile-cities">
                    {citySuggestions.map(c => <option key={c} value={c} />)}
                  </datalist>
                )}
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Phone Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input 
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
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

              {/* Role Selection */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Primary Account Role
                </label>
                <select
                  value={role}
                  onChange={e => {
                    setRole(e.target.value);
                    switchRole(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="Buyer">Buyer / Tenant</option>
                  <option value="Owner">Owner / Individual Seller</option>
                  <option value="Agent">Real Estate Agent / Channel Partner</option>
                  <option value="Builder">Builder / Developer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile || !selectedState}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Save size={16} />
                <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          {/* Card 2: Security & Password */}
          <div 
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '28px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Lock size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                Security & Password
              </h2>
            </div>

            {passwordError && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 'var(--radius-md)',
                  color: '#DC2626',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}
              >
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'var(--rera-green-light)',
                  border: '1px solid var(--rera-green-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--rera-green)',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 chars, uppercase, lowercase, number"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
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
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Confirm New Password
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
                disabled={isUpdatingPassword || !newPassword}
                className="btn btn-outline"
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <div style={{ marginTop: '28px', padding: '16px', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                <ShieldCheck size={16} color="var(--rera-green)" />
                <span>Supabase Row Level Security (RLS)</span>
              </div>
              Your profile is strictly protected with cryptographic user tokens. Only you have permission to view or modify your personal data.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
