import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, safeLogAuthError } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import IndstateLogo from '../components/common/IndstateLogo';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { fetchProfile, exitDemoMode } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isSubscribed = true;

    const processOAuthCallback = async () => {
      try {
        // 1. Check for error in query params or hash
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const hashParams = window.location.hash.startsWith('#')
            ? new URLSearchParams(window.location.hash.substring(1))
            : null;

          const errorDesc =
            searchParams.get('error_description') ||
            hashParams?.get('error_description') ||
            searchParams.get('error') ||
            hashParams?.get('error');

          if (errorDesc) {
            safeLogAuthError('AuthCallback', { message: errorDesc });
            if (isSubscribed) {
              setErrorMessage(errorDesc.replace(/\+/g, ' '));
            }
            return;
          }
        }

        // 2. Retrieve session from Supabase (detectSessionInUrl: true handles token parsing)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          safeLogAuthError('AuthCallback:getSession', sessionError);
          if (isSubscribed) {
            setErrorMessage(sessionError.message || 'Failed to complete sign-in.');
          }
          return;
        }

        if (session?.user) {
          exitDemoMode();
          if (fetchProfile) {
            await fetchProfile(session.user);
          }
          if (isSubscribed) {
            navigate('/dashboard', { replace: true });
          }
        } else {
          // If session is still propagating, listen to auth state change once
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession?.user && isSubscribed) {
              exitDemoMode();
              if (fetchProfile) {
                await fetchProfile(newSession.user);
              }
              subscription?.unsubscribe();
              navigate('/dashboard', { replace: true });
            }
          });

          // Timeout fallback in case no session is returned after 5 seconds
          setTimeout(() => {
            if (isSubscribed) {
              navigate('/login', { replace: true });
            }
          }, 5000);
        }
      } catch (err) {
        safeLogAuthError('AuthCallback:catch', err);
        if (isSubscribed) {
          setErrorMessage('Unable to complete authentication. Please try again.');
        }
      }
    };

    processOAuthCallback();

    return () => {
      isSubscribed = false;
    };
  }, [navigate, fetchProfile, exitDemoMode]);

  return (
    <div 
      style={{ 
        minHeight: '75vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-page)',
        padding: '24px'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          padding: '36px 28px',
          textAlign: 'center',
          animation: 'fadeIn 0.25s ease'
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <IndstateLogo height={42} />
        </div>

        {errorMessage ? (
          <div>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#DC2626',
                marginBottom: '14px'
              }}
            >
              <AlertCircle size={26} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
              Sign-in could not be completed
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              {errorMessage}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <div>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(235, 94, 40, 0.1)',
                color: 'var(--saffron)',
                marginBottom: '16px'
              }}
            >
              <Loader2 size={28} className="spin-slow" />
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
              Completing secure sign-in...
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Connecting with INDSTATE verified platform. You will be redirected in just a moment.
            </p>
            <div 
              style={{ 
                marginTop: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px', 
                fontSize: '12px', 
                color: 'var(--rera-green)' 
              }}
            >
              <ShieldCheck size={14} />
              <span>100% RERA Verified Authentication</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
