const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/Otp");
const asyncHandler = require("../middleware/async");
const EventService = require("../services/EventService");
const UserEvent = require("../models/UserEvent");
const { sendOTPEmail, generateOTP, sendPasswordResetEmail } = require("../services/emailService");
const {
  syncUserToCharcha,
  getCharchaToken,
  isCharchaConfigured,
} = require("../services/charchaService");

// @desc    Register user (Step 1: create unverified user + send OTP)
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "Please provide a name and email",
    });
  }

  const normalizedEmail = email.toLowerCase();

  // Check if user exists with this email
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    // If user exists but is NOT verified yet, resend OTP
    if (!existingUser.isOtpVerified && !existingUser.googleId && !existingUser.githubId) {
      // Update name in case they changed it
      existingUser.name = name;
      await existingUser.save();

      // Send OTP
      await sendOTPForEmail(normalizedEmail, res);
      return;
    }

    // Check if user signed up via OAuth
    if (existingUser.googleId) {
      return res.status(400).json({
        success: false,
        message:
          "An account with this email already exists. Please sign in with Google.",
        authMethod: "google",
      });
    }
    if (existingUser.githubId) {
      return res.status(400).json({
        success: false,
        message:
          "An account with this email already exists. Please sign in with GitHub.",
        authMethod: "github",
      });
    }
    return res.status(400).json({
      success: false,
      message: "User already exists with this email. Please sign in.",
    });
  }

  // Create new unverified user (no password yet)
  await User.create({
    name,
    email: normalizedEmail,
    isOtpVerified: false,
  });

  // Send OTP
  await sendOTPForEmail(normalizedEmail, res);
});

// Helper: generate and send OTP for a given email, respond with success
async function sendOTPForEmail(email, res) {
  // Rate limiting: Check if OTP was sent in last 60 seconds
  const recentOtp = await Otp.findOne({
    email,
    createdAt: { $gt: new Date(Date.now() - 60000) },
  });

  if (recentOtp) {
    const waitTime = Math.ceil(
      (60000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000,
    );
    return res.status(429).json({
      success: false,
      message: `Please wait ${waitTime} seconds before requesting another OTP`,
      waitTime,
    });
  }

  // Delete any existing OTPs for this email
  await Otp.deleteMany({ email });

  // Generate new OTP
  const otp = generateOTP();

  // Store OTP in database
  await Otp.create({ email, otp });

  // Send OTP email
  try {
    await sendOTPEmail(email, otp);
    res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
      email,
      needsOtp: true,
    });
  } catch (error) {
    await Otp.deleteMany({ email });
    return res.status(500).json({
      success: false,
      message: "Failed to send verification email. Please try again.",
    });
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide an email and password",
    });
  }

  // Check for user
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials. Please check your email and password, or sign up.",
    });
  }

  // Check if user is OTP-verified
  if (!user.isOtpVerified && !user.googleId && !user.githubId) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email first. Go to Sign Up to complete verification.",
      needsVerification: true,
    });
  }

  // Check if user only has OAuth authentication (no password set)
  if (!user.password) {
    if (user.googleId) {
      return res.status(400).json({
        success: false,
        message:
          "This account was created with Google. Please sign in with Google, or set a password from your dashboard.",
        authMethod: "google",
        needsPassword: true,
      });
    }
    if (user.githubId) {
      return res.status(400).json({
        success: false,
        message:
          "This account was created with GitHub. Please sign in with GitHub, or set a password from your dashboard.",
        authMethod: "github",
        needsPassword: true,
      });
    }
    // OTP-verified user who never set a password
    return res.status(400).json({
      success: false,
      message: "You haven't set a password yet. Please sign in with OTP and set a password.",
      needsPassword: true,
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Get Charcha token (SSO integration)
  let charchaToken = null;
  if (isCharchaConfigured()) {
    const charchaResult = await getCharchaToken(user);
    if (charchaResult.success) {
      charchaToken = charchaResult.token;
    }
  }

  sendTokenResponse(user, 200, res, charchaToken);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const userData = user.toObject();
  userData.hasPassword = !!user.password;
  delete userData.password; // Don't send password hash

  // ─── Record daily login event (once per day) ───
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const alreadyLogged = await UserEvent.findOne({
      user: req.user.id,
      eventType: 'daily_login',
      timestamp: { $gte: todayStart }
    }).lean();
    if (!alreadyLogged) {
      await EventService.dailyLogin(req.user.id, 0);
    }
  } catch (evtErr) {
    // Don't block auth for event recording failures
    console.error('Daily login event error:', evtErr.message);
  }

  res.status(200).json({
    success: true,
    data: userData,
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    avatarIndex: req.body.avatarIndex,
    subscribedNewsletter: req.body.subscribedNewsletter,
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(
    (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key],
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update password (for users who already have a password)
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      message: "Password is incorrect",
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Set password (for users who don't have one yet — OTP-verified or Google users)
// @route   POST /api/auth/set-password
// @access  Private
exports.setPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  const user = await User.findById(req.user.id).select("+password");

  // Only block if user has a real password AND is NOT an OAuth/OTP-only user.
  // OAuth users (Google/GitHub) may have a corrupted password hash from a
  // previous pre-save hook bug, so we allow them to set/overwrite.
  const isOAuthUser = !!(user.googleId || user.githubId);
  const isOtpOnlyUser = !user.googleId && !user.githubId && user.isOtpVerified;

  if (user.password && !isOAuthUser && !isOtpOnlyUser) {
    return res.status(400).json({
      success: false,
      message: "Password is already set. Use update password instead.",
    });
  }

  user.password = password;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Send OTP for email login
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Please provide an email",
    });
  }

  const normalizedEmail = email.toLowerCase();

  // Check if user exists
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No account found with this email. Please sign up first.",
    });
  }

  await sendOTPForEmail(normalizedEmail, res);
});

// @desc    Verify OTP and login (also completes signup verification for new users)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and verification code",
    });
  }

  const normalizedEmail = email.toLowerCase();

  // Find OTP record
  const otpRecord = await Otp.findOne({ email: normalizedEmail });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "Verification code expired. Please request a new one.",
    });
  }

  // Check max attempts (5 attempts allowed)
  if (otpRecord.attempts >= 5) {
    await Otp.deleteMany({ email: normalizedEmail });
    return res.status(429).json({
      success: false,
      message:
        "Too many failed attempts. Please request a new verification code.",
    });
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    return res.status(400).json({
      success: false,
      message: "Invalid verification code",
      attemptsRemaining: 5 - otpRecord.attempts,
    });
  }

  // OTP is valid - delete it
  await Otp.deleteMany({ email: normalizedEmail });

  // Get user
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No account found with this email. Please sign up first.",
    });
  }

  // If user is not yet OTP-verified, mark them as verified now
  if (!user.isOtpVerified) {
    user.isOtpVerified = true;
    await user.save();
  }

  // Get Charcha token (SSO integration)
  let charchaToken = null;
  if (isCharchaConfigured()) {
    const charchaResult = await getCharchaToken(user);
    if (charchaResult.success) {
      charchaToken = charchaResult.token;
    }
  }

  sendTokenResponse(user, 200, res, charchaToken);
});

// @desc    Forgot password — send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Please provide an email address",
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal whether user exists — always show success
    return res.status(200).json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Build reset URL (frontend page)
  const isProduction = process.env.NODE_ENV === "production";
  const frontendUrl = isProduction
    ? "https://codelearnn.com"
    : "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password email error:", err);
    // Clear the token on failure
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: "Failed to send reset email. Please try again later.",
    });
  }
});

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  // Hash the token from URL to match the one stored in DB
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token. Please request a new password reset.",
    });
  }

  // Set new password and clear reset fields
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // If user wasn't OTP-verified yet, mark them verified now
  if (!user.isOtpVerified) {
    user.isOtpVerified = true;
  }

  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
    message: "Logged out successfully",
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, charchaToken = null) => {
  // Create token
  const token = user.getSignedJwtToken();

  const responseData = {
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarIndex: user.avatarIndex,
      subscribedNewsletter: user.subscribedNewsletter,
      isOtpVerified: user.isOtpVerified,
      hasPassword: !!user.password,
      googleId: user.googleId || null,
      githubId: user.githubId || null,
    },
  };

  // Include Charcha token if available
  if (charchaToken) {
    responseData.charchaToken = charchaToken;
  }

  res.status(statusCode).json(responseData);
};
