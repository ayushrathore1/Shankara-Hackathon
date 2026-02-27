import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CareerJourneyProvider } from "./context/CareerJourneyContext";

// Common Components
import Navbar from "./components/common/Navbar";
import LandingHeader from "./components/common/LandingHeader";
import Footer from "./components/common/Footer";
import Loader from "./components/common/Loader";
import ScrollToTop from "./components/common/ScrollToTop";
import SmoothScroll from "./components/common/SmoothScroll";

// Public Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Protected Pages
import DashboardPage from "./pages/DashboardPage";
import VaultPage from "./pages/VaultPage";
import VaultDetailPage from "./pages/VaultDetailPage";
import CoursePage from "./pages/CoursePage";
import VisualizationsPage from "./pages/VisualizationsPage"; // Disabled - redirects to dashboard
import AnalyzerPage from "./pages/AnalyzerPage";
import LearningPathsPage from "./pages/LearningPathsPage";
import CareerExplorerPage from "./pages/CareerExplorerPage";
import CareerJourneyPage from "./pages/CareerJourneyPage";
import LearningPlanPage from "./pages/LearningPlanPage";
import ProfilePage from "./pages/ProfilePage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CharchaPage from "./pages/CharchaPage";
import YouTubeTrackerPage from "./pages/YouTubeTrackerPage";
import LearningPlayerPage from "./pages/LearningPlayerPage";
import PostDetail from "./components/charcha/PostDetail";

// Blog and Opportunity Pages (Public with auth for writing)
import BlogsPage from "./pages/BlogsPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import VibeCodingGuidePage from "./pages/VibeCodingGuidePage";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import OpportunityDetailPage from "./pages/OpportunityDetailPage";

// Standalone Public Articles
import JaipurInternshipsGuide from "./pages/JaipurInternshipsGuide";

// Gamification
import AchievementsPage from "./pages/AchievementsPage";
import GoalOnboardingPage from "./pages/GoalOnboardingPage";
import PublicProfilePage from "./pages/PublicProfilePage";

// Development mode: localhost OR explicit dev mode
const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  import.meta.env.DEV === true;

// Protected Route Wrapper - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader isLoading={true} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Auth Route Wrapper - redirects to dashboard if already authenticated
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader isLoading={true} />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Home Redirect - logged-in users go to dashboard, guests see landing
const HomeRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader isLoading={true} />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <HomePage />;
};

// Conditional Header Component
const ConditionalHeader = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Standalone pages with NO header/navbar
  const standalonePages = [
    "/resources/jaipur-internships-guide",
    "/jaipur-internships-guide",
    "/onboarding",
    "/login",
    "/signup",
  ];
  const isStandalonePage = standalonePages.some((path) =>
    location.pathname.startsWith(path),
  );

  // If it's a standalone page, don't show any header
  if (isStandalonePage) {
    return null;
  }

  // Public pages that use full navbar even when not authenticated (like home but with nav)
  const publicPagesWithNav = ["/blogs", "/opportunities"];
  const isPublicWithNav = publicPagesWithNav.some((path) =>
    location.pathname.startsWith(path),
  );

  // Landing pages that use minimal header in production
  const landingPaths = [
    "/",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/cookie-policy",
  ];
  const isLandingPage = landingPaths.includes(location.pathname);

  // In development, always show full Navbar
  if (isDevelopment) {
    return <Navbar />;
  }

  // Public pages with nav always show Navbar
  if (isPublicWithNav) {
    return <Navbar />;
  }

  // In production:
  // - Show LandingHeader for landing pages when not authenticated
  // - Show Navbar for authenticated users or internal pages
  if (isLandingPage && !isAuthenticated) {
    return <LandingHeader />;
  }

  return <Navbar />;
};

// Conditional Footer Component - Hide on standalone pages
const ConditionalFooter = () => {
  const location = useLocation();

  // Standalone pages with NO footer (for waitlist/coming soon mode)
  const standalonePages = [
    "/resources/jaipur-internships-guide",
    "/jaipur-internships-guide",
  ];
  const isStandalonePage = standalonePages.some((path) =>
    location.pathname.startsWith(path),
  );

  // If it's a standalone page, don't show footer
  if (isStandalonePage) {
    return null;
  }

  return <Footer />;
};

function AppContent() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load

    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <ScrollToTop />
      <SmoothScroll />
      <Loader isLoading={loading} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="min-h-screen flex flex-col"
      >
        <ConditionalHeader />

        <AnimatePresence mode="wait">
          <Routes>
            {/* Auth Routes - only these are public */}
            <Route
              path="/login"
              element={
                <AuthRoute>
                  <LoginPage />
                </AuthRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <AuthRoute>
                  <SignupPage />
                </AuthRoute>
              }
            />

            {/* OAuth Callback Route */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Password Reset Routes (public) */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Onboarding */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <GoalOnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Standalone Public Articles - No navbar, accessible without auth */}
            {/* These are special pages open during waitlist/coming soon phase */}
            <Route
              path="/resources/jaipur-internships-guide"
              element={<JaipurInternshipsGuide />}
            />
            <Route
              path="/jaipur-internships-guide"
              element={<JaipurInternshipsGuide />}
            />

            {/* Admin Login Route - Hidden from public navbar */}
            <Route
              path="/admin"
              element={
                <AuthRoute>
                  <LoginPage />
                </AuthRoute>
              }
            />

            {/* Home: logged-in → dashboard, guest → landing */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Public info pages - still accessible but redirect logged-in users */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />

            {/* Public Profile */}
            <Route path="/u/:slug" element={<PublicProfilePage />} />

            {/* Content pages — protected */}
            <Route path="/blogs" element={<ProtectedRoute><BlogsPage /></ProtectedRoute>} />
            <Route path="/blogs/:slug" element={<ProtectedRoute><BlogDetailPage /></ProtectedRoute>} />
            <Route path="/opportunities" element={<ProtectedRoute><OpportunitiesPage /></ProtectedRoute>} />
            <Route path="/opportunities/:slug" element={<ProtectedRoute><OpportunityDetailPage /></ProtectedRoute>} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vault"
              element={
                <ProtectedRoute>
                  <VaultPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vault/course/:slug"
              element={
                <ProtectedRoute>
                  <CoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vault/:id"
              element={
                <ProtectedRoute>
                  <VaultDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Learning Paths - New core page */}
            <Route
              path="/learning-paths"
              element={
                <ProtectedRoute>
                  <LearningPathsPage />
                </ProtectedRoute>
              }
            />

            {/* Learning Guides - Public, no auth required */}
            <Route 
              path="/learning-guides/vibe-coding" 
              element={<VibeCodingGuidePage />} 
            />
            <Route
              path="/learning-paths"
              element={
                <ProtectedRoute>
                  <LearningPathsPage />
                </ProtectedRoute>
              }
            />

            {/* Visualizations - Disabled, redirect to dashboard */}
            <Route
              path="/visualizations"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/visualizations/:id"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/analyzer"
              element={
                <ProtectedRoute>
                  <AnalyzerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career"
              element={
                <ProtectedRoute>
                  <CareerExplorerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career-explorer"
              element={
                <ProtectedRoute>
                  <CareerExplorerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-career-journey"
              element={
                <ProtectedRoute>
                  <CareerJourneyPage />
                </ProtectedRoute>
              }
            />

            {/* Learning Player — Course-like video player */}
            <Route
              path="/learn/:phaseId?/:resourceIndex?"
              element={
                <ProtectedRoute>
                  <LearningPlayerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career/learning-plan/:keyword"
              element={
                <ProtectedRoute>
                  <LearningPlanPage />
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

            {/* YouTube Watch Tracker */}
            <Route
              path="/youtube-tracker"
              element={
                <ProtectedRoute>
                  <YouTubeTrackerPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/charcha"
              element={
                <ProtectedRoute>
                  <CharchaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/charcha/post/:idOrSlug"
              element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              }
            />

            {/* Legacy redirect */}
            <Route
              path="/resources"
              element={<Navigate to="/vault" replace />}
            />

            {/* Achievements */}
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <AchievementsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all — smart redirect based on auth */}
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </AnimatePresence>

        <ConditionalFooter />
      </motion.div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CareerJourneyProvider>
          <Router>
            <AppContent />
          </Router>
        </CareerJourneyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
