import React, { useState } from 'react';
import { MapPin, Building, ShieldCheck, AlertCircle } from 'lucide-react';
import { INDIAN_STATES, UNION_TERRITORIES, ALL_REGIONS } from '../../data/indianStatesAndCities';
import IndstateLogo from '../common/IndstateLogo';

export default function GoogleAuthPromptModal({ isOpen, user, onSave, isLoading }) {
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Selected state's major cities for smart autocomplete
  const stateObj = INDIAN_STATES.find(s => s.name === selectedState);
  const citySuggestions = stateObj ? stateObj.cities.map(c => c.name) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedState) {
      setError('State is required. Please select your Indian State or Union Territory.');
      return;
    }
    setError('');
    onSave({
      state: selectedState,
      city: city.trim()
    });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <IndstateLogo height={38} />
          </div>
          <h3 style={{ fontSize: '20px', color: 'var(--primary)', fontWeight: 700 }}>
            Complete your INDSTATE profile
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Welcome, <strong>{user?.user_metadata?.full_name || user?.email}</strong>! Please select your primary operating state to continue.
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
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* State * (Compulsory) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              State * <span style={{ color: '#DC2626' }}>(Compulsory)</span>
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
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  background: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  color: selectedState ? 'var(--primary)' : 'var(--text-muted)'
                }}
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
              Ensures relevant state RERA regulations and localized stamp duty rates.
            </p>
          </div>

          {/* City (Optional) */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
              City <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input 
              type="text"
              list="city-suggestions"
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
              <datalist id="city-suggestions">
                {citySuggestions.map(cityName => (
                  <option key={cityName} value={cityName} />
                ))}
              </datalist>
            )}
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
            {isLoading ? 'Saving Profile...' : 'Continue to INDSTATE'}
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
