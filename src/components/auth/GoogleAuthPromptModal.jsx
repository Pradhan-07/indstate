import React, { useState, useEffect } from 'react';
import { MapPin, Building, ShieldCheck, AlertCircle, User, Phone } from 'lucide-react';
import { INDIAN_STATES, UNION_TERRITORIES } from '../../data/indianStatesAndCities';
import IndstateLogo from '../common/IndstateLogo';

export default function GoogleAuthPromptModal({ isOpen, user, onSave, isLoading }) {
  const [fullName, setFullName] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  // Prefill name or phone when user session arrives
  useEffect(() => {
    if (user) {
      const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const metaPhone = user.user_metadata?.phone || user.phone || '';
      if (metaName && !fullName) setFullName(metaName);
      if (metaPhone && !phone) setPhone(metaPhone);
    }
  }, [user]);

  if (!isOpen) return null;

  // Selected state's major cities for smart autocomplete
  const stateObj = INDIAN_STATES.find(s => s.name === selectedState);
  const citySuggestions = stateObj ? stateObj.cities.map(c => c.name) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedState || !selectedState.trim()) {
      setError('State is required. Please select your Indian State or Union Territory.');
      return;
    }
    setError('');
    onSave({
      fullName: fullName.trim(),
      state: selectedState.trim(),
      city: city.trim(),
      phone: phone.trim()
    });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '460px', padding: '32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <IndstateLogo height={38} />
          </div>
          <h3 style={{ fontSize: '20px', color: 'var(--primary)', fontWeight: 700 }}>
            Complete your INDSTATE profile
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Welcome, <strong>{fullName || user?.email}</strong>! Please complete your details to personalize your state-based property experience.
          </p>
        </div>

        {error && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)',
              color: '#DC2626',
              fontSize: '13px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
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

          {/* State * (Compulsory) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              State * <span style={{ color: '#DC2626' }}>(Required)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedState}
                onChange={e => {
                  setSelectedState(e.target.value);
                  setCity('');
                  if (error) setError('');
                }}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  background: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  color: selectedState ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--saffron)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              >
                <option value="">-- Select Indian State / UT --</option>
                <optgroup label="States (28)">
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
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Ensures verified RERA compliance and localized stamp duty details for your region.
            </p>
          </div>

          {/* City */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              City
            </label>
            <input 
              type="text"
              list="google-city-suggestions"
              placeholder="e.g. Mumbai, Bengaluru, Pune"
              value={city}
              onChange={e => setCity(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--saffron)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
            {citySuggestions.length > 0 && (
              <datalist id="google-city-suggestions">
                {citySuggestions.map(cityName => (
                  <option key={cityName} value={cityName} />
                ))}
              </datalist>
            )}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              Phone
            </label>
            <input 
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
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
            disabled={isLoading || !selectedState}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              opacity: !selectedState ? 0.6 : 1,
              cursor: !selectedState ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </form>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--rera-green)' }}>
          <ShieldCheck size={14} />
          <span>100% RERA Verified Platform</span>
        </div>
      </div>
    </div>
  );
}
