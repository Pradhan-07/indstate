import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  Building2, Heart, Scale, PlusCircle, Menu, X, 
  ShieldCheck, Calculator, UserCheck, ChevronDown 
} from 'lucide-react';
import { useProperty } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import IndstateLogo from './IndstateLogo';

export default function Navbar() {
  const { favorites, compareList } = useProperty();
  const { user, isLoading, setIsAuthModalOpen, setAuthMode, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [propertiesDropdown, setPropertiesDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header-main ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="container">
        <div className="nav-container">
          {/* Official Brand Logo */}
          <Link to="/" className="logo-wrap" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <IndstateLogo height={isScrolled ? 42 : 48} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav>
            <ul className="nav-menu">
              <li>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Home
                </NavLink>
              </li>

              {/* Properties Dropdown */}
              <li 
                style={{ position: 'relative' }}
                onMouseEnter={() => setPropertiesDropdown(true)}
                onMouseLeave={() => setPropertiesDropdown(false)}
              >
                <NavLink 
                  to="/properties" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Properties <ChevronDown size={14} />
                </NavLink>

                {propertiesDropdown && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      background: '#FFFFFF',
                      minWidth: '220px',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-lg)',
                      border: '1px solid var(--border-color)',
                      padding: '8px 0',
                      zIndex: 100,
                      animation: 'fadeIn 0.2s ease-out'
                    }}
                  >
                    <Link to="/properties?purpose=Buy" style={{ display: 'block', padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      🏢 Buy Residential (Flats & Villas)
                    </Link>
                    <Link to="/properties?purpose=Rent" style={{ display: 'block', padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      🔑 Rent Homes & Apartments
                    </Link>
                    <Link to="/properties?purpose=PG-Co-living" style={{ display: 'block', padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      🛏️ PG & Techie Co-Living
                    </Link>
                    <Link to="/properties?purpose=Commercial" style={{ display: 'block', padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      🏙️ Commercial Offices & Retail
                    </Link>
                    <Link to="/properties?purpose=Plots" style={{ display: 'block', padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      📐 Residential & Industrial Plots
                    </Link>
                    <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
                    <Link to="/properties?reraOnly=true" style={{ display: 'block', padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--rera-green)' }}>
                      🛡️ 100% RERA Verified Only
                    </Link>
                  </div>
                )}
              </li>

              <li>
                <NavLink to="/agents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Verified Agents
                </NavLink>
              </li>

              <li>
                <NavLink to="/calculator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  EMI Calculator
                </NavLink>
              </li>

              <li>
                <NavLink to="/compare" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Compare {compareList.length > 0 && <span style={{ background: 'var(--saffron)', color: '#fff', fontSize: '11px', padding: '1px 6px', borderRadius: '10px' }}>{compareList.length}</span>}
                </NavLink>
              </li>

              <li>
                <NavLink to="/blog" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Market News
                </NavLink>
              </li>

              <li>
                <NavLink to="/rera-disclaimer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  RERA Compliance
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Nav Right Actions */}
          <div className="nav-actions">
            {/* Favorites Icon */}
            <Link 
              to="/dashboard?tab=favorites" 
              title="Saved Properties"
              style={{
                position: 'relative',
                color: 'var(--text-body)',
                display: 'flex',
                alignItems: 'center',
                padding: '8px'
              }}
            >
              <Heart size={21} />
              {favorites.length > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: 'var(--saffron)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Dashboard / User */}
            {isLoading ? (
              <div 
                className="nav-action-desktop-only" 
                style={{ 
                  width: '82px', 
                  height: '36px', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'var(--bg-alt)', 
                  opacity: 0.6 
                }} 
              />
            ) : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="nav-action-desktop-only">
                <Link to="/dashboard" className="btn btn-outline btn-sm" title={`Logged in as ${user.name}`}>
                  <UserCheck size={16} />
                  <span>{user.name?.split(' ')[0] || 'Dashboard'}</span>
                  {user.isDemo && (
                    <span 
                      style={{ 
                        fontSize: '10px', 
                        background: '#FEF3C7', 
                        color: '#92400E', 
                        padding: '1px 5px', 
                        borderRadius: '4px', 
                        fontWeight: 700, 
                        marginLeft: '4px'
                      }}
                    >
                      DEMO
                    </span>
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-sm"
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-muted)', 
                    padding: '6px 12px', 
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Sign out of INDSTATE"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }} 
                className="btn btn-outline btn-sm nav-action-desktop-only"
              >
                Sign In
              </button>
            )}

            {/* Post Property CTA */}
            <Link to="/add-property" className="btn btn-primary btn-sm nav-action-desktop-only">
              <PlusCircle size={16} />
              <span>Post Property</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-toggle"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileMenuOpen && (
        <>
          <div 
            className="mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(9, 16, 36, 0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 998,
              animation: 'fadeIn 0.2s ease-out'
            }}
          />
          <div 
            className="mobile-nav-drawer"
            style={{
              position: 'relative',
              zIndex: 999,
              background: '#FFFFFF',
              borderTop: '1px solid var(--border-color)',
              padding: '16px 20px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: 'calc(100dvh - 64px)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              animation: 'slideDown 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* User Auth in Mobile Drawer */}
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', background: 'var(--bg-alt)', borderRadius: '10px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserCheck size={18} color="var(--primary)" />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)', display: 'block' }}>{user.name || 'My Account'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.state || 'India'} • {user.role || 'Buyer'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <Link 
                    to="/dashboard" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, minHeight: '34px', justifyContent: 'center' }}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, minHeight: '34px', justifyContent: 'center' }}
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="btn btn-sm"
                    style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }} 
                className="btn btn-outline"
                style={{ width: '100%', minHeight: '44px', justifyContent: 'center', marginBottom: '6px', fontWeight: 700 }}
              >
                Sign In / Register
              </button>
            )}

            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Home</Link>
            <Link to="/properties?purpose=Buy" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">🏢 Buy Residential (Flats & Villas)</Link>
            <Link to="/properties?purpose=Rent" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">🔑 Rent Homes & Apartments</Link>
            <Link to="/properties?purpose=PG-Co-living" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">🛏️ PG & Co-living</Link>
            <Link to="/properties?purpose=Commercial" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">🏙️ Commercial Spaces</Link>
            <Link to="/properties?reraOnly=true" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link" style={{ color: 'var(--rera-green)', fontWeight: 700 }}>🛡️ 100% RERA Verified Only</Link>
            <Link to="/agents" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Verified Agents</Link>
            <Link to="/calculator" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">EMI Calculator</Link>
            <Link to="/compare" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Compare Properties ({compareList.length})</Link>
            <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Market News</Link>
            <Link to="/rera-disclaimer" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">RERA Compliance</Link>

            <div style={{ height: '1px', background: 'var(--border-light)', margin: '6px 0' }} />
            
            <Link 
              to="/add-property" 
              onClick={() => setMobileMenuOpen(false)} 
              className="btn btn-primary"
              style={{ minHeight: '44px', justifyContent: 'center', fontWeight: 700 }}
            >
              + Post Free Property Ad
            </Link>
          </div>
        </>
      )}

      <style>{`
        .mobile-menu-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          min-height: 44px;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--primary);
          cursor: pointer;
        }
        .mobile-nav-link {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-main);
          text-decoration: none;
          min-height: 44px;
          display: flex;
          align-items: center;
          transition: background 0.15s ease;
        }
        .mobile-nav-link:hover, .mobile-nav-link:active {
          background: var(--bg-alt);
          color: var(--primary);
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 1024px) {
          .mobile-menu-toggle {
            display: flex !important;
          }
          .nav-action-desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
