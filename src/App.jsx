import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PropertyProvider } from './context/PropertyContext';
import { AuthProvider } from './context/AuthContext';
import { ChatbotProvider } from './context/ChatbotContext';

// Common Components
import TopBar from './components/common/TopBar';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import FooterWordmarkTransition from './components/common/FooterWordmarkTransition';
import CompareFloatingBar from './components/common/CompareFloatingBar';
import QuickPreviewModal from './components/common/QuickPreviewModal';
import AuthModal from './components/common/AuthModal';
import FloatingChatbot from './components/chatbot/FloatingChatbot';
import CustomCursor from './components/common/CustomCursor';
import IntroAnimation from './components/common/IntroAnimation';

// Pages
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import AgentsPage from './pages/AgentsPage';
import AgentProfilePage from './pages/AgentProfilePage';
import AddPropertyPage from './pages/AddPropertyPage';
import DashboardPage from './pages/DashboardPage';
import ComparePage from './pages/ComparePage';
import CalculatorPage from './pages/CalculatorPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import RERADisclaimerPage from './pages/RERADisclaimerPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth Pages & Guards
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';

/**
 * Scroll to top on route navigation
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/**
 * Fast, subtle page transition (< 250ms fade)
 */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition-wrapper" style={{ flexGrow: 1 }}>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agent/:id" element={<AgentProfilePage />} />
        
        {/* Protected User Routes */}
        <Route 
          path="/add-property" 
          element={
            <ProtectedRoute>
              <AddPropertyPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        {/* Dedicated Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Public Informational Routes */}
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/rera-disclaimer" element={<RERADisclaimerPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = React.useState(true);
  const [isReadyForContent, setIsReadyForContent] = React.useState(false);

  return (
    <BrowserRouter>
      {/* 3-Second Brand Intro Animation */}
      {showIntro && (
        <IntroAnimation 
          onExitStart={() => setIsReadyForContent(true)}
          onComplete={() => {
            setIsReadyForContent(true);
            setShowIntro(false);
          }} 
        />
      )}

      <ScrollToTop />
      <AuthProvider>
        <PropertyProvider>
          <ChatbotProvider>
            {isReadyForContent && (
              <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              {/* Header Navigation */}
              <TopBar />
              <Navbar />

              {/* Main Routing View with Smooth Transition */}
              <AnimatedRoutes />

              {/* Footer Wordmark Transition + Footer */}
              <FooterWordmarkTransition />
              <Footer />

              {/* Global Interactive Overlays */}
              <CompareFloatingBar />
              <QuickPreviewModal />
              <AuthModal />
              <FloatingChatbot />
              <CustomCursor />
            </div>
            )}
          </ChatbotProvider>
        </PropertyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
