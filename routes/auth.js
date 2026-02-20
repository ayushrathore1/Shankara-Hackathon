const express = require("express");
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  setPassword,
  forgotPassword,
  resetPassword,
  logout,
  sendOTP,
  verifyOTP,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  getCharchaToken,
  isCharchaConfigured,
} = require("../services/charchaService");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/set-password", protect, setPassword);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.get("/logout", logout);
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.put("/updatepassword", protect, updatePassword);

// Google OAuth routes
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message:
        "Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.",
    });
  }
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

router.get("/google/callback", async (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  passport.authenticate(
    "google",
    { session: false },
    async (err, user, info) => {
      // Handle authentication errors
      if (err) {
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      // Handle auth failures
      if (!user) {
        if (info?.waitlistRedirect) {
          return res.redirect(
            `${frontendUrl}/?waitlist_redirect=true#waitlist`,
          );
        }
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      // Generate JWT token for the authenticated user
      const token = user.getSignedJwtToken();

      // Get Charcha token (SSO integration)
      let charchaToken = "";
      if (isCharchaConfigured()) {
        try {
          const charchaResult = await getCharchaToken(user);
          if (charchaResult.success) {
            charchaToken = charchaResult.token;
          }
        } catch (charchaErr) {
          console.error(
            "Charcha token error during OAuth:",
            charchaErr.message,
          );
        }
      }

      // Redirect to frontend with tokens
      let redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
      if (charchaToken) {
        redirectUrl += `&charchaToken=${charchaToken}`;
      }
      res.redirect(redirectUrl);
    },
  )(req, res, next);
});

module.exports = router;
