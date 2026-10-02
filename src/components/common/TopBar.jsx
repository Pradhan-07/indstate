import React from 'react';
import { Phone, Mail, ShieldCheck, User, LogIn, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { triggerCallNotification } from '../../services/leadNotificationService';

export default function TopBar() {
  const { user, isLoading, setIsAuthModalOpen, setAuthMode, logout } = useAuth();

  return (
    <div className="top-bar">
      <div className="container">
        <div className="top-bar-inner">
          <div className="top-bar-left">
            <a 
              href="https://wa.me/916207211360" 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => {
                triggerCallNotification({
                  source: 'Header: TopBar Helpline Link',
                  context: 'Visitor clicked Helpline No. WhatsApp in top header'
                });
              }}
              className="top-bar-item"
              title="Chat on WhatsApp"
            >
              <Phone size={13} className="text-saffron" />
              <span>Helpline No.: <strong>+91 6207 211 360</strong></span>
            </a>
            <a 
              href="mailto:ind.state.build@gmail.com" 
              className="top-bar-item"
              title="Send an email"
            >
              <Mail size={13} />
              <span>ind.state.build@gmail.com</span>
            </a>
            <span className="top-bar-rera-chip">
              <ShieldCheck size={13} />
              <span>100% RERA Verified Marketplace</span>
            </span>
          </div>

          <div className="top-bar-right">
            <span className="top-bar-item" style={{ color: '#E6BA9A' }}>
              🇮🇳 India Edition (INR ₹)
            </span>
            
            {isLoading ? (
              <span className="top-bar-item" style={{ opacity: 0.6, fontSize: '11px' }}>
                Connecting...
              </span>
            ) : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to="/dashboard" className="top-bar-item" style={{ fontWeight: 600 }}>
                  <User size={13} />
                  <span>{user.name} ({user.role})</span>
                </Link>
                <button
                  onClick={logout}
                  style={{ color: '#94A3B8', fontSize: '12px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
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
                className="top-bar-item"
                style={{ fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <LogIn size={13} />
                <span>Sign In / Register</span>
              </button>
            )}

            <Link
              to="/add-property"
              style={{
                background: 'var(--saffron)',
                color: '#FFFFFF',
                padding: '3px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <PlusCircle size={13} />
              <span>Post Free Property Ad</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
