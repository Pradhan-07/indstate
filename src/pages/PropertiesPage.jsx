import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProperty } from '../context/PropertyContext';
import FilterSidebar from '../components/properties/FilterSidebar';
import PropertySortBar from '../components/properties/PropertySortBar';
import PropertyCard from '../components/common/PropertyCard';
import PropertyMapView from '../components/properties/PropertyMapView';
import { ShieldAlert, RotateCcw, Loader2 } from 'lucide-react';

export default function PropertiesPage() {
  const { properties, isLoading } = useProperty();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL parameters or defaults
  const [filters, setFilters] = useState({
    purpose: searchParams.get('purpose') || '',
    state: searchParams.get('state') || '',
    city: searchParams.get('city') || '',
    locality: searchParams.get('locality') || '',
    type: searchParams.get('type') || '',
    bhk: searchParams.get('bhk') || '',
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 500000000,
    reraOnly: searchParams.get('reraOnly') === 'true',
    furnishing: searchParams.get('furnishing') || '',
    possession: searchParams.get('possession') || ''
  });

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'map'
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price-asc' | 'price-desc' | 'area-desc' | 'newest'
  const [visibleCount, setVisibleCount] = useState(9);

  // Sync state if URL query params change (e.g. from header nav or hero search)
  useEffect(() => {
    const purpose = searchParams.get('purpose') || '';
    const state = searchParams.get('state') || '';
    const city = searchParams.get('city') || '';
    const locality = searchParams.get('locality') || '';
    const type = searchParams.get('type') || '';
    const bhk = searchParams.get('bhk') || '';
    const reraOnly = searchParams.get('reraOnly') === 'true';

    setFilters(prev => ({
      ...prev,
      purpose,
      state,
      city,
      locality,
      type,
      bhk,
      reraOnly
    }));
  }, [searchParams]);

  const resetFilters = () => {
    setFilters({
      purpose: '',
      state: '',
      city: '',
      locality: '',
      type: '',
      bhk: '',
      maxPrice: 500000000,
      reraOnly: false,
      furnishing: '',
      possession: ''
    });
    setSearchParams({});
  };

  const clearFilterKey = (key) => {
    setFilters(prev => ({ ...prev, [key]: key === 'maxPrice' ? 500000000 : key === 'reraOnly' ? false : '' }));
  };

  // Filter & Sort Logic
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (filters.purpose && p.purpose !== filters.purpose) return false;
      if (filters.state && p.state?.trim().toLowerCase() !== filters.state.trim().toLowerCase()) return false;
      if (filters.city && p.city?.trim().toLowerCase() !== filters.city.trim().toLowerCase()) return false;
      if (filters.locality && !p.locality?.toLowerCase().includes(filters.locality.toLowerCase().trim())) return false;
      if (filters.type && p.propertyType !== filters.type) return false;
      if (filters.bhk && p.bhk !== Number(filters.bhk)) return false;
      if (filters.maxPrice && p.price > filters.maxPrice) return false;
      if (filters.reraOnly && !p.isReraVerified) return false;
      if (filters.furnishing && p.furnishing !== filters.furnishing) return false;
      if (filters.possession && p.possessionStatus !== filters.possession) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'area-desc') return (b.carpetArea || 0) - (a.carpetArea || 0);
      if (sortBy === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      }
      return 0;
    });
  }, [properties, filters, sortBy]);

  const displayedProperties = filteredProperties.slice(0, visibleCount);

  return (
    <div style={{ padding: '40px 0 80px 0', background: 'var(--bg-page)' }}>
      <div className="container">
        {/* Breadcrumb & Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Home / Properties {filters.state ? `/ ${filters.state}` : ''} {filters.city ? `/ ${filters.city}` : ''}
          </div>
          <h1 style={{ fontSize: '30px', color: 'var(--primary)' }}>
            {filters.city 
              ? `Properties for Sale & Rent in ${filters.city}, ${filters.state}`
              : filters.state 
                ? `Properties Across ${filters.state}`
                : 'All Real Estate Listings Across India'}
          </h1>
        </div>

        {/* 2-Column Responsive Layout */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            gap: '30px',
            alignItems: 'start'
          }}
          className="properties-layout-grid"
        >
          {/* Left Column: Cascading Filter Sidebar */}
          <FilterSidebar 
            filters={filters} 
            setFilters={setFilters} 
            resetFilters={resetFilters} 
          />

          {/* Right Column: Sort Bar & Results */}
          <div>
            <PropertySortBar 
              totalCount={filteredProperties.length}
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortBy={sortBy}
              setSortBy={setSortBy}
              filters={filters}
              clearFilterKey={clearFilterKey}
            />

            {isLoading ? (
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' : '1fr',
                  gap: '24px',
                  marginBottom: '36px'
                }}
              >
                {[1, 2, 3, 4, 5, 6].map(sk => (
                  <div 
                    key={sk} 
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden',
                      height: '380px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ height: '200px', background: '#F1F5F9', animation: 'pulse 1.5s infinite ease-in-out' }} />
                    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                      <div style={{ height: '22px', width: '50%', background: '#F1F5F9', borderRadius: '4px' }} />
                      <div style={{ height: '18px', width: '85%', background: '#F1F5F9', borderRadius: '4px' }} />
                      <div style={{ height: '14px', width: '65%', background: '#F1F5F9', borderRadius: '4px', marginTop: 'auto' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div 
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  padding: '60px 20px',
                  textAlign: 'center'
                }}
              >
                <ShieldAlert size={48} color="var(--saffron)" style={{ margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '22px', color: 'var(--primary)', marginBottom: '8px' }}>
                  No Properties Match Your Specific Filter Criteria
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 20px auto' }}>
                  Try resetting some filters such as BHK, locality, or maximum budget to view all verified properties in this region.
                </p>
                <button onClick={resetFilters} className="btn btn-primary">
                  <RotateCcw size={16} />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : viewMode === 'map' ? (
              /* Map View */
              <PropertyMapView properties={filteredProperties} />
            ) : (
              /* Grid / List View */
              <>
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' : '1fr',
                    gap: '24px',
                    marginBottom: '36px'
                  }}
                >
                  {displayedProperties.map(property => (
                    <PropertyCard key={property.id} property={property} layout={viewMode} />
                  ))}
                </div>

                {visibleCount < filteredProperties.length && (
                  <div style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 6)}
                      className="btn btn-outline btn-lg"
                    >
                      Load More Properties ({filteredProperties.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .properties-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
