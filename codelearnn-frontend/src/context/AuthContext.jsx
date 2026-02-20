import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { setCharchaToken, removeCharchaToken } from "../services/charchaApi";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Return safe defaults if context is not available (e.g., during HMR)
  if (!context) {
    return {
      user: null,
      loading: true,
      error: null,
      login: async () => ({ success: false, message: "Auth not initialized" }),
      register: async () => ({
        success: false,
        message: "Auth not initialized",
      }),
      signup: async () => ({ success: false, message: "Auth not initialized" }),
      sendLoginOTP: async () => ({
        success: false,
        message: "Auth not initialized",
      }),
      verifyLoginOTP: async () => ({
        success: false,
        message: "Auth not initialized",
      }),
      setUserPassword: async () => ({
        success: false,
        message: "Auth not initialized",
      }),
      logout: () => {},
      updateUser: () => {},
      isAuthenticated: false,
      needsPassword: false,
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.data);
        } catch (_) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          removeCharchaToken(); // Also clear Charcha token
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const { token, user, charchaToken } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      // Store Charcha token if available (SSO integration)
      if (charchaToken) {
        setCharchaToken(charchaToken);
      }

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      const needsPassword = err.response?.data?.needsPassword || false;
      setError(message);
      throw { success: false, message, needsPassword };
    }
  };

  // Register: Step 1 — sends name + email, backend creates unverified user + sends OTP
  const register = async (name, email) => {
    try {
      setError(null);
      const response = await authAPI.register({ name, email });
      // Backend returns { success: true, needsOtp: true, email }
      return { success: true, needsOtp: true, email: response.data.email };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      setError(message);
      throw { success: false, message };
    }
  };

  const sendLoginOTP = async (email) => {
    try {
      setError(null);
      const response = await authAPI.sendOTP(email);
      return { success: true, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send OTP";
      const waitTime = err.response?.data?.waitTime || null;
      setError(message);
      throw { success: false, message, waitTime };
    }
  };

  const verifyLoginOTP = async (email, otp) => {
    try {
      setError(null);
      const response = await authAPI.verifyOTP(email, otp);
      const { token, user, charchaToken } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      // Store Charcha token if available (SSO integration)
      if (charchaToken) {
        setCharchaToken(charchaToken);
      }

      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || "Verification failed";
      const attemptsRemaining = err.response?.data?.attemptsRemaining;
      setError(message);
      throw { success: false, message, attemptsRemaining };
    }
  };

  // Set password for users who don't have one (OTP-verified or Google users)
  const setUserPassword = async (password) => {
    try {
      setError(null);
      const response = await authAPI.setPassword(password);
      const { token, user: updatedUser } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to set password";
      setError(message);
      throw { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    removeCharchaToken(); // Also clear Charcha token (SSO)
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    signup: register, // Alias for register
    sendLoginOTP,
    verifyLoginOTP,
    setUserPassword,
    logout,
    updateUser,
    isAuthenticated: !!user,
    needsPassword: !!user && user.hasPassword === false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
