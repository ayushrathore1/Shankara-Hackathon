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
import { MedhaFlowProvider } from "./context/MedhaFlowContext";

// MedhaFlow Career Discovery Pages
import FlowLandingPage from "./pages/flow/FlowLandingPage";
import FlowNamePage from "./pages/flow/FlowNamePage";
import FlowQuizPage from "./pages/flow/FlowQuizPage";
import FlowResultsPage from "./pages/flow/FlowResultsPage";
import FlowPreviewPage from "./pages/flow/FlowPreviewPage";
import FlowRoadmapPage from "./pages/flow/FlowRoadmapPage";

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
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Core Protected Pages
import DashboardPage from "./pages/DashboardPage";
import LearningPathsPage from "./pages/LearningPathsPage";
import LearningPlanPage from "./pages/LearningPlanPage";
import LearningPlayerPage from "./pages/LearningPlayerPage";
import ProfilePage from "./pages/ProfilePage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

// Development mode
const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  import.meta.env.DEV === true;

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader isLoading={true} />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Auth Route Wrapper
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader isLoading={true} />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

// Home Redirect
const HomeRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader isLoading={true} />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <HomePage />;
};

// Conditional Header
const ConditionalHeader = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const standalonePages = [
    "/login", "/signup", "/career-discovery",
    "/name", "/quiz", "/results", "/preview", "/roadmap",
  ];
  if (standalonePages.some(p => location.pathname.startsWith(p))) return null;

  if (isDevelopment) return <Navbar />;

  const landingPaths = ["/about", "/contact", "/privacy-policy", "/terms", "/cookie-policy"];
  if (landingPaths.includes(location.pathname) && !isAuthenticated) return <LandingHeader />;

  return <Navbar />;
};

// Conditional Footer
const ConditionalFooter = () => {
  const location = useLocation();
  const standalonePages = [
    "/career-discovery", "/name", "/quiz", "/results", "/preview", "/roadmap",
  ];
  if (standalonePages.some(p => location.pathname.startsWith(p))) return null;
  return <Footer />;
};

function AppContent() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
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
            {/* Auth Routes */}
            <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
            <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* 1. Career Discovery — Auth required */}
            <Route path="/career-discovery" element={<FlowLandingPage />} />
            <Route path="/name" element={<ProtectedRoute><FlowNamePage /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><FlowQuizPage /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><FlowResultsPage /></ProtectedRoute>} />
            <Route path="/preview/:slug" element={<ProtectedRoute><FlowPreviewPage /></ProtectedRoute>} />

            {/* 2. Roadmap */}
            <Route path="/roadmap/:slug" element={<FlowRoadmapPage />} />

            {/* 3. Learning Plan */}
            <Route path="/learning-paths" element={<ProtectedRoute><LearningPathsPage /></ProtectedRoute>} />
            <Route path="/career/learning-plan/:keyword" element={<ProtectedRoute><LearningPlanPage /></ProtectedRoute>} />
            <Route path="/learn/:phaseId?/:resourceIndex?" element={<ProtectedRoute><LearningPlayerPage /></ProtectedRoute>} />

            {/* 4. Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

            {/* Profile */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Home — Primary Landing */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Catch all — redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
        <MedhaFlowProvider>
          <Router>
            <AppContent />
          </Router>
        </MedhaFlowProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
