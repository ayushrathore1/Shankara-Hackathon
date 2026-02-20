const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy - only initialize if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0]?.value?.toLowerCase();

          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          if (email) {
            user = await User.findOne({ email });
          }

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.avatarUrl = profile.photos[0]?.value;
            if (!user.isOtpVerified) {
              user.isOtpVerified = true; // Google-verified email
            }
            await user.save();
            return done(null, user);
          }

          // Create new user via Google OAuth
          user = await User.create({
            name: profile.displayName || profile.name?.givenName || "User",
            email,
            googleId: profile.id,
            avatarUrl: profile.photos[0]?.value,
            isOtpVerified: true, // Google-verified email
          });

          return done(null, user);
        } catch (err) {
          done(err, null);
        }
      },
    ),
  );
  console.log("✅ Google OAuth: Configured");
} else {
  console.log(
    "⚠️ Google OAuth: Not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)",
  );
}

module.exports = passport;
