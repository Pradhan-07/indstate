import React from 'react';
import { LayoutGrid, List, Map, ArrowUpDown, X } from 'lucide-react';

export default function PropertySortBar({ 
  totalCount, 
  viewMode, 
  setViewMode, 
  sortBy, 
  setSortBy,
  filters,
  clearFilterKey
}) {
  return (
    <div 
      style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        padding: 'clamp(12px, 3vw, 16px) clamp(14px, 3vw, 20px)',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '14px',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      {/* Left: Results Count & Active Filter Chips */}
      <div>
        <div style={{ fontSize: '14.5px', color: 'var(--primary)' }}>
          Showing <strong>{totalCount}</strong> Verified Properties
          {filters.city && ` in ${filters.city}`}
          {filters.state && !filters.city && ` in ${filters.state}`}
        </div>

        {/* Active Filter Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
          {filters.purpose && (
            <span style={{ fontSize: '11px', background: 'var(--primary-alpha)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {filters.purpose}
              <button onClick={() => clearFilterKey('purpose')}><X size={12} /></button>
            </span>
          )}
          {filters.bhk && (
            <span style={{ fontSize: '11px', background: 'var(--saffron-light)', color: 'var(--saffron)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {filters.bhk} BHK
              <button onClick={() => clearFilterKey('bhk')}><X size={12} /></button>
            </span>
          )}
          {filters.reraOnly && (
            <span style={{ fontSize: '11px', background: 'var(--rera-green-light)', color: 'var(--rera-green)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              RERA Verified
              <button onClick={() => clearFilterKey('reraOnly')}><X size={12} /></button>
            </span>
          )}
        </div>
      </div>

      {/* Right: View Toggles & Sort */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        {/* Sort By */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown size={14} color="var(--text-muted)" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              outline: 'none',
              background: '#FFFFFF',
              color: 'var(--text-main)'
            }}
          >
            <option value="featured">Featured First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="area-desc">Carpet Area: High to Low</option>
            <option value="newest">Newest Launches</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div 
          style={{
            display: 'flex',
            background: 'var(--bg-alt)',
            padding: '3px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid View"
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'grid' ? 'var(--shadow-xs)' : 'none'
            }}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="List View"
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'list' ? 'var(--shadow-xs)' : 'none'
            }}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            title="Interactive Map View"
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              background: viewMode === 'map' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'map' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'map' ? 'var(--shadow-xs)' : 'none'
            }}
          >
            <Map size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
