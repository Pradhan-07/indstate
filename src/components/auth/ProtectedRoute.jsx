import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';

/**
 * Reusable Protected Route Auth Guard
 * - Preserves target path in ?redirect query param
 * - Renders branded loading screen while checking persistent session
 * - Restores redirect destination after login
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen message="Checking authorization..." />;
  }

  if (!isAuthenticated) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  return children;
}
