import React from 'react';
import IndstateLogo from '../common/IndstateLogo';

export default function AuthLoadingScreen({ message = 'Verifying secure session...' }) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '24px'
      }}
    >
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        <IndstateLogo height={48} />
        
        {/* Sleek branded loader */}
        <div style={{ position: 'relative', width: '40px', height: '40px', marginTop: '10px' }}>
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid rgba(15, 27, 61, 0.1)',
              borderTopColor: 'var(--saffron)',
              animation: 'spin 0.8s linear infinite'
            }}
          />
        </div>

        <p 
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--primary)',
            letterSpacing: '0.5px'
          }}
        >
          {message}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
