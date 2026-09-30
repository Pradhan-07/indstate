import React, { useState } from 'react';
import { 
  Filter, RotateCcw, ShieldCheck, MapPin, 
  BookmarkCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { INDIAN_STATES, UNION_TERRITORIES } from '../../data/indianStatesAndCities';
import { formatIndianPrice } from '../../utils/currencyFormatter';
import { useProperty } from '../../context/PropertyContext';

export default function FilterSidebar({ filters, setFilters, resetFilters }) {
  const { saveSearch } = useProperty();
  const [savedSearchSuccess, setSavedSearchSuccess] = useState(false);

  const allRegions = [...INDIAN_STATES, ...UNION_TERRITORIES];
  const currentStateObj = allRegions.find(r => r.name === filters.state);
  const citiesList = currentStateObj?.cities || [];
  const currentCityObj = citiesList.find(c => c.name === filters.city);
  const localitiesList = currentCityObj?.localities || [];

  const handleStateChange = (e) => {
    const newState = e.target.value;
    const newRegion = allRegions.find(r => r.name === newState);
    const newCity = newRegion && newRegion.cities.length > 0 ? newRegion.cities[0].name : '';
    setFilters(prev => ({
      ...prev,
      state: newState,
      city: newCity,
      locality: ''
    }));
  };

  const handleCityChange = (e) => {
    setFilters(prev => ({
      ...prev,
      city: e.target.value,
      locality: ''
    }));
  };

  const handleSaveSearch = () => {
    saveSearch({
      title: `${filters.purpose || 'Properties'} in ${filters.city || filters.state || 'India'} ${filters.bhk ? `(${filters.bhk} BHK)` : ''}`,
      query: JSON.stringify(filters),
      date: new Date().toLocaleDateString()
    });
    setSavedSearchSuccess(true);
    setTimeout(() => setSavedSearchSuccess(false), 2500);
  };

  const [mobileExpanded, setMobileExpanded] = useState(false);
  const activeCount = [
    filters.purpose,
    filters.state,
    filters.city,
    filters.locality,
    filters.type,
    filters.bhk,
    filters.reraOnly,
    filters.furnishing,
    filters.possession,
    filters.maxPrice < 500000000
  ].filter(Boolean).length;

  return (
    <aside 
      className="filter-sidebar-card"
      style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '20px',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      {/* Header with Mobile Accordion Toggle */}
      <div 
        className="filter-sidebar-header"
        onClick={() => setMobileExpanded(prev => !prev)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          paddingBottom: mobileExpanded ? '14px' : '0', 
          borderBottom: mobileExpanded ? '1px solid var(--border-light)' : 'none' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '17px', color: 'var(--primary)' }}>Filters</h3>
          {activeCount > 0 && (
            <span style={{ background: 'var(--saffron)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px' }}>
              {activeCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeCount > 0 && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetFilters();
              }} 
              style={{ fontSize: '12px', color: 'var(--saffron)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
          <span className="filter-toggle-icon-mobile" style={{ color: 'var(--primary)' }}>
            {mobileExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
      </div>

      {/* Filter Body Content */}
      <div className={`filter-sidebar-body ${mobileExpanded ? 'is-expanded' : ''}`}>

      {/* 1. Purpose (Buy / Rent / PG / Commercial / Plots) */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Purpose
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {['Buy', 'Rent', 'PG-Co-living', 'Commercial', 'Plots'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, purpose: prev.purpose === p ? '' : p }))}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                textAlign: 'center',
                border: filters.purpose === p ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                background: filters.purpose === p ? 'var(--primary)' : 'var(--bg-page)',
                color: filters.purpose === p ? '#FFFFFF' : 'var(--text-main)',
                transition: 'var(--transition)'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Indian State Filter (All 28 States + 8 UTs) */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          Select Indian State / UT
        </label>
        <select 
          value={filters.state} 
          onChange={handleStateChange}
          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#FFFFFF', outline: 'none', fontSize: '13px' }}
        >
          <option value="">All Regions</option>
          <optgroup label="All 28 Indian States">
            {INDIAN_STATES.map(s => (
              <option key={s.code} value={s.name}>{s.name}</option>
            ))}
          </optgroup>
          <optgroup label="Union Territories">
            {UNION_TERRITORIES.map(u => (
              <option key={u.code} value={u.name}>{u.name}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* 3. Cascading City Filter */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          City
        </label>
        <select 
          value={filters.city} 
          onChange={handleCityChange}
          disabled={!filters.state}
          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#FFFFFF', outline: 'none', fontSize: '13px' }}
        >
          <option value="">All Cities in {filters.state || 'Selected State'}</option>
          {citiesList.map(c => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 4. Cascading Locality Filter */}
      {localitiesList.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            Locality
          </label>
          <select 
            value={filters.locality} 
            onChange={e => setFilters(prev => ({ ...prev, locality: e.target.value }))}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#FFFFFF', outline: 'none', fontSize: '13px' }}
          >
            <option value="">All Localities in {filters.city}</option>
            {localitiesList.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      )}

      {/* 5. BHK Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Bedrooms (BHK)
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['1', '2', '3', '4', '5'].map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, bhk: prev.bhk === b ? '' : b }))}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center',
                border: filters.bhk === b ? '1.5px solid var(--saffron)' : '1px solid var(--border-color)',
                background: filters.bhk === b ? 'var(--saffron)' : 'var(--bg-page)',
                color: filters.bhk === b ? '#FFFFFF' : 'var(--text-main)'
              }}
            >
              {b} BHK
            </button>
          ))}
        </div>
      </div>

      {/* 6. Price Range in INR (₹ Lakhs / ₹ Crores) */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Max Budget (INR ₹)
          </label>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
            {filters.maxPrice >= 500000000 ? 'Any Budget' : formatIndianPrice(filters.maxPrice)}
          </span>
        </div>
        <input 
          type="range"
          min={500000} // 5 Lakh
          max={500000000} // 50 Cr
          step={500000}
          value={filters.maxPrice}
          onChange={e => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--saffron)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>₹5 Lakh</span>
          <span>₹2.5 Cr</span>
          <span>₹50+ Cr</span>
        </div>
      </div>

      {/* 7. Property Type */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          Property Type
        </label>
        <select 
          value={filters.type} 
          onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#FFFFFF', outline: 'none', fontSize: '13px' }}
        >
          <option value="">All Types</option>
          <option value="Apartment">Apartment / Flat</option>
          <option value="Independent Villa">Independent Villa</option>
          <option value="Penthouse">Penthouse</option>
          <option value="Builder Floor">Builder Floor</option>
          <option value="Commercial Office">Commercial Office</option>
          <option value="PG / Shared Living">PG & Co-Living</option>
          <option value="Residential Plot">Residential Plot</option>
        </select>
      </div>

      {/* 8. RERA Verified Toggle */}
      <div 
        style={{
          background: 'var(--rera-green-light)',
          border: '1px solid var(--rera-green-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="var(--rera-green)" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--rera-green)' }}>RERA Verified Only</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Show 100% legal compliance</div>
          </div>
        </div>
        <input 
          type="checkbox"
          checked={filters.reraOnly}
          onChange={e => setFilters(prev => ({ ...prev, reraOnly: e.target.checked }))}
          style={{ width: '18px', height: '18px', accentColor: 'var(--rera-green)', cursor: 'pointer' }}
        />
      </div>

      {/* 9. Furnishing & Possession */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Furnishing</label>
          <select 
            value={filters.furnishing} 
            onChange={e => setFilters(prev => ({ ...prev, furnishing: e.target.value }))}
            style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', background: '#fff' }}
          >
            <option value="">Any</option>
            <option value="Fully Furnished">Fully</option>
            <option value="Semi-Furnished">Semi</option>
            <option value="Unfurnished">Unfurnished</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Possession</label>
          <select 
            value={filters.possession} 
            onChange={e => setFilters(prev => ({ ...prev, possession: e.target.value }))}
            style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', background: '#fff' }}
          >
            <option value="">Any</option>
            <option value="Ready to Move">Ready</option>
            <option value="Under Construction">Under Const.</option>
          </select>
        </div>
      </div>

        {/* Save Search Button */}
        <button 
          type="button" 
          onClick={handleSaveSearch}
          className="btn btn-outline" 
          style={{ width: '100%', fontSize: '13px', padding: '10px' }}
        >
          <BookmarkCheck size={16} />
          <span>{savedSearchSuccess ? "Search Saved in Dashboard!" : "Save This Search Alert"}</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .filter-sidebar-body {
            display: none;
            margin-top: 14px;
          }
          .filter-sidebar-body.is-expanded {
            display: block;
            animation: fadeIn 0.22s ease-out;
          }
          .filter-toggle-icon-mobile {
            display: inline-flex !important;
          }
        }
        @media (min-width: 1025px) {
          .filter-sidebar-body {
            display: block !important;
            margin-top: 16px;
          }
          .filter-toggle-icon-mobile {
            display: none !important;
          }
          .filter-sidebar-header {
            cursor: default !important;
            padding-bottom: 14px !important;
            border-bottom: 1px solid var(--border-light) !important;
          }
        }
      `}</style>
    </aside>
  );
}
