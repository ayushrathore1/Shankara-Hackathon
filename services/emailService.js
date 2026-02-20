const nodemailer = require('nodemailer');

// Create transporter with SMTP settings
const createTransporter = () => {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured. Email sending will fail.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} - Success status
 */
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: email,
    subject: 'Your CodeLearnn Login Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 480px; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; border: 1px solid #2a2a3e;">
                <tr>
                  <td style="padding: 40px 32px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <span style="font-size: 28px; font-weight: bold; color: #ffffff;">
                        <span style="color: #00d4ff;">&lt;</span>CodeLearnn<span style="color: #7c3aed;">/&gt;</span>
                      </span>
                    </div>
                    
                    <!-- Title -->
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 16px 0;">
                      Your Verification Code
                    </h1>
                    
                    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 32px 0;">
                      Enter this code to sign in to your CodeLearnn account. It expires in 10 minutes.
                    </p>
                    
                    <!-- OTP Code -->
                    <div style="background: linear-gradient(135deg, #1e1e2e 0%, #252538 100%); border: 1px solid #3a3a4e; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                      <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00d4ff;">
                        ${otp}
                      </span>
                    </div>
                    
                    <p style="color: #6b6b7b; font-size: 13px; line-height: 1.5; text-align: center; margin: 0;">
                      If you didn't request this code, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <div style="border-top: 1px solid #2a2a3e; padding-top: 24px; text-align: center;">
                      <p style="color: #4a4a5a; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} CodeLearnn. Learn like an engineer.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Your CodeLearnn verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send waitlist welcome email
 * @param {string} email - Recipient email
 * @param {string} referralCode - User's unique referral code
 * @returns {Promise<boolean>} - Success status
 */
const sendWaitlistEmail = async (email, referralCode) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email service not configured, skipping waitlist email');
    return false;
  }

  const referralLink = `https://codelearnn.com/?ref=${referralCode}`;
  const websiteUrl = 'https://codelearnn.com';
  const twitterUrl = 'https://x.com/ayushrathore_27';
  const linkedinUrl = 'https://www.linkedin.com/in/ayushrathore1';
  const unsubscribeLink = `${websiteUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: email,
    subject: "You're on the list! Welcome to CodeLearnn 🚀",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 600px; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; border: 1px solid #2a2a3e;">
                <tr>
                  <td style="padding: 40px 32px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <span style="font-size: 28px; font-weight: bold; color: #ffffff;">
                        <span style="color: #00d4ff;">&lt;</span>CodeLearnn<span style="color: #7c3aed;">/&gt;</span>
                      </span>
                    </div>
                    
                    <!-- Title -->
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: left; margin: 0 0 24px 0;">
                      Hey there! 👋
                    </h1>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                      You just joined the CodeLearnn waitlist, and we couldn't be more excited to have you here.
                    </p>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                      You're officially on the list for early access when we launch in <strong>February 2026</strong>. But here's the best part: the first 500 students get <strong>lifetime free access to all PRO features</strong>.
                    </p>

                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                      You're one step closer to ditching random tutorials and building real engineering skills that matter.
                    </p>
                    
                    <hr style="border: 0; border-top: 1px solid #2a2a3e; margin: 32px 0;" />
                    
                    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.05em;">
                      WHAT HAPPENS NEXT?
                    </h2>

                    <div style="margin-bottom: 24px;">
                      <h3 style="color: #00d4ff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">1. We're building for you</h3>
                      <p style="color: #94a3b8; font-size: 15px; margin: 0 0 0 0;">We'll keep you updated as we add new learning paths, visualizations, and features.</p>
                    </div>

                    <div style="margin-bottom: 24px;">
                      <h3 style="color: #00d4ff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">2. Early access in Feb 2026</h3>
                      <p style="color: #94a3b8; font-size: 15px; margin: 0 0 0 0;">You'll get an email with your personal access link before anyone else.</p>
                    </div>

                    <div style="margin-bottom: 32px;">
                      <h3 style="color: #00d4ff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">3. Shape the product</h3>
                      <p style="color: #94a3b8; font-size: 15px; margin: 0 0 0 0;">Your feedback will help us build the best learning OS for engineering students.</p>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #2a2a3e; margin: 32px 0;" />

                    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.05em;">
                      WANT TO SKIP THE LINE?
                    </h2>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      Share CodeLearnn with 3 friends and get priority access when we launch.
                    </p>
                    
                    <div style="background-color: #1e1e2e; padding: 16px; border-radius: 8px; border: 1px solid #3a3a4e; text-align: center; margin-bottom: 32px;">
                      <a href="${referralLink}" style="color: #00d4ff; font-family: monospace; text-decoration: none; font-size: 14px; word-break: break-all;">
                        ${referralLink}
                      </a>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #2a2a3e; margin: 32px 0;" />
                    
                    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.05em;">
                      IN THE MEANTIME...
                    </h2>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                      We're not going to spam you with daily emails. But we will send you:
                    </p>
                    
                    <ul style="color: #94a3b8; font-size: 15px; line-height: 1.6; padding-left: 20px; type: disc;">
                      <li style="margin-bottom: 8px;">Sneak peeks at new features as we build them</li>
                      <li style="margin-bottom: 8px;">Free learning resources and career guides</li>
                      <li style="margin-bottom: 8px;">Your early access link when we launch (Feb 2026)</li>
                    </ul>

                    <hr style="border: 0; border-top: 1px solid #2a2a3e; margin: 32px 0;" />
                    
                    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.05em;">
                      HELP US BUILD WHAT YOU NEED
                    </h2>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                      We want to build CodeLearnn around YOUR needs. Mind answering one quick question?
                    </p>
                    
                    <p style="color: #ffffff; font-weight: 600; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; background-color: rgba(124, 58, 237, 0.1); padding: 16px; border-left: 3px solid #7c3aed; border-radius: 4px;">
                      What's your biggest struggle when learning to code right now?
                    </p>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                      Just reply to this email and let us know.
                    </p>
                    
                    <!-- Signature -->
                    <div style="margin-top: 40px;">
                      <p style="color: #ffffff; font-weight: 600; margin: 0 0 4px 0;">CodeLearnn</p>
                      <p style="color: #94a3b8; font-size: 14px; margin: 0;">The Learning Operating System for Engineering Students</p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <div style="border-top: 1px solid #2a2a3e; padding-top: 24px; text-align: center;">
                      <p style="margin-bottom: 16px;">
                        <a href="${websiteUrl}" style="color: #94a3b8; text-decoration: none; font-size: 13px; margin: 0 10px;">Website</a>
                        <a href="${twitterUrl}" style="color: #94a3b8; text-decoration: none; font-size: 13px; margin: 0 10px;">Twitter</a>
                        <a href="${linkedinUrl}" style="color: #94a3b8; text-decoration: none; font-size: 13px; margin: 0 10px;">LinkedIn</a>
                      </p>
                      <p style="color: #4a4a5a; font-size: 12px; margin: 0 0 8px 0;">
                        You're receiving this because you joined the CodeLearnn waitlist.
                      </p>
                      <a href="${unsubscribeLink}" style="color: #4a4a5a; font-size: 12px; text-decoration: underline;">Unsubscribe</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
      CodeLearnn - The Learning Operating System

      Hey there! 👋

      You just joined the CodeLearnn waitlist, and we couldn't be more excited to have you here.

      You're officially on the list for early access when we launch in February 2026. But here's the best part: the first 500 students get lifetime free access to all PRO features.

      You're one step closer to ditching random tutorials and building real engineering skills that matter.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      WHAT HAPPENS NEXT?

      1. We're building for you
        We'll keep you updated as we add new learning paths, visualizations, and features.

      2. Early access in Feb 2026
        You'll get an email with your personal access link before anyone else.

      3. Shape the product
        Your feedback will help us build the best learning OS for engineering students.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      WANT TO SKIP THE LINE?

      Share CodeLearnn with 3 friends and get priority access when we launch.

      Get your referral link: ${referralLink}

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      IN THE MEANTIME...

      We're not going to spam you with daily emails. But we will send you:

      - Sneak peeks at new features as we build them
      - Free learning resources and career guides  
      - Your early access link when we launch (Feb 2026)

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      HELP US BUILD WHAT YOU NEED

      We want to build CodeLearnn around YOUR needs. Mind answering one quick question?

      What's your biggest struggle when learning to code right now?

      Just reply to this email and let us know.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      CodeLearnn
      The Learning Operating System for Engineering Students

      Website: ${websiteUrl}
      Twitter: ${twitterUrl}
      LinkedIn: ${linkedinUrl}

      You're receiving this because you joined the CodeLearnn waitlist.
      Unsubscribe: ${unsubscribeLink}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Waitlist welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Waitlist email send error:', error);
    // Don't throw, just return false so waitlist signup doesn't fail
    return false;
  }
};

/**
 * Send admin notification for new waitlist signup
 * @param {string} userEmail - New user's email
 * @returns {Promise<boolean>} - Success status
 */
const sendAdminNotification = async (userEmail) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    return false;
  }

  const adminEmail = 'rathoreayush512@gmail.com';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: adminEmail,
    subject: 'New Waitlist Signup! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>New User Joined Waitlist</h2>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr />
        <p style="font-size: 12px; color: #666;">CodeLearnn Admin Notification</p>
      </div>
    `,
    text: `New User Joined Waitlist\n\nEmail: ${userEmail}\nTime: ${new Date().toLocaleString()}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Admin notification sent for ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Admin notification error:', error);
    return false;
  }
};

/**
 * Send early access invitation email
 * @param {string} email - Recipient email
 * @param {string} name - User's name (optional)
 * @returns {Promise<boolean>} - Success status
 */
const sendEarlyAccessEmail = async (email, name = '') => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email service not configured, skipping early access email');
    return false;
  }

  const websiteUrl = 'https://codelearnn.com';
  const loginUrl = `${websiteUrl}/login`;
  const twitterUrl = 'https://x.com/ayushrathore_27';
  const linkedinUrl = 'https://www.linkedin.com/in/ayushrathore1';
  const feedbackEmail = 'rathoreayush512@gmail.com';
  const greeting = name ? `Hey ${name}` : 'Hey there';
  
  // CodeLearnn Brand Colors (matching dashboard)
  const brandLime = '#c8fa3c';      // Primary lime/yellow-green accent
  const brandDark = '#0a0a0a';      // Deep dark background
  const brandCardBg = '#111111';    // Card background
  const brandBorder = '#1a1a1a';    // Subtle border
  const brandText = '#e5e5e5';      // Primary text
  const brandMuted = '#737373';     // Muted text
  const brandTeal = '#2dd4bf';      // Secondary accent (teal)

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: email,
    subject: "⚡ Your Early Access to CodeLearnn is Ready!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: ${brandDark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${brandDark};">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: ${brandCardBg}; border-radius: 12px; border: 1px solid ${brandBorder};">
                <tr>
                  <td style="padding: 48px 40px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 40px;">
                      <span style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                        <span style="color: ${brandLime};">&lt;</span>CodeLearnn<span style="color: ${brandLime};">/&gt;</span>
                      </span>
                    </div>
                    
                    <!-- Early Access Badge -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <span style="display: inline-block; background-color: rgba(200, 250, 60, 0.1); border: 1px solid rgba(200, 250, 60, 0.3); padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; color: ${brandLime}; text-transform: uppercase; letter-spacing: 1.5px;">
                        ⚡ CodeLearnn OS 2.0 • Early Access Open
                      </span>
                    </div>
                    
                    <!-- Greeting -->
                    <p style="color: ${brandText}; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                      ${greeting}! 👋
                    </p>
                    
                    <p style="color: ${brandText}; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                      <strong>Thank you for joining the CodeLearnn waitlist!</strong> We're thrilled to give you <span style="color: ${brandLime}; font-weight: 600;">exclusive early access</span> to our platform.
                    </p>
                    
                    <p style="color: ${brandMuted}; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">
                      You're one of the first to experience CodeLearnn – the only learning OS that transforms scattered YouTube videos and courses into structured, career-ready roadmaps—validated by AI, built for engineering students.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin-bottom: 24px;">
                      <a href="${loginUrl}" style="display: inline-block; background-color: ${brandLime}; color: #0a0a0a; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                        ⚡ Get Early Access →
                      </a>
                    </div>
                    
                    <p style="color: ${brandMuted}; font-size: 13px; text-align: center; margin: 0 0 40px 0;">
                      Use OTP login with: <span style="color: ${brandText};">${email}</span>
                    </p>
                    
                    <!-- Divider -->
                    <div style="border-top: 1px solid ${brandBorder}; margin: 32px 0;"></div>
                    
                    <!-- Dashboard Preview Card -->
                    <div style="background-color: ${brandDark}; border: 1px solid ${brandBorder}; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                      <div style="display: flex; margin-bottom: 16px;">
                        <span style="color: ${brandMuted}; font-size: 12px; font-family: monospace;">● ● career_dashboard.tsx</span>
                        <span style="color: ${brandTeal}; font-size: 12px; margin-left: auto;">v2.0</span>
                      </div>
                      <div style="color: ${brandText}; font-size: 14px; margin-bottom: 8px;">
                        <span style="background-color: rgba(45, 212, 191, 0.1); color: ${brandTeal}; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 8px;">ACTIVE</span>
                      </div>
                      <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 8px 0 4px 0;">Full Stack Dev</p>
                      <p style="color: ${brandMuted}; font-size: 13px; margin: 0;">Your personalized learning path awaits</p>
                    </div>
                    
                    <!-- Divider -->
                    <div style="border-top: 1px solid ${brandBorder}; margin: 32px 0;"></div>
                    
                    <h2 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.02em;">
                      💡 We Need Your Feedback
                    </h2>
                    
                    <p style="color: ${brandMuted}; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
                      As an early access user, your feedback is <span style="color: ${brandText};">incredibly valuable</span> to us. Please explore the platform and share your thoughts:
                    </p>
                    
                    <ul style="color: ${brandMuted}; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0 0 24px 0;">
                      <li style="margin-bottom: 6px;">What features you love</li>
                      <li style="margin-bottom: 6px;">What could be improved</li>
                      <li style="margin-bottom: 6px;">Any bugs you encounter</li>
                      <li style="margin-bottom: 6px;">Features you'd like to see</li>
                    </ul>
                    
                    <div style="background-color: rgba(200, 250, 60, 0.05); padding: 16px; border-left: 3px solid ${brandLime}; border-radius: 4px; margin-bottom: 32px;">
                      <p style="color: ${brandText}; font-size: 14px; margin: 0;">
                        📧 Send feedback to: <a href="mailto:${feedbackEmail}" style="color: ${brandLime}; text-decoration: none;">${feedbackEmail}</a>
                      </p>
                    </div>
                    
                    <!-- Divider -->
                    <div style="border-top: 1px solid ${brandBorder}; margin: 32px 0;"></div>
                    
                    <h2 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 20px 0;">
                      🎁 What You Get
                    </h2>
                    
                    <div style="margin-bottom: 12px;">
                      <span style="color: ${brandLime}; font-size: 14px;">●</span>
                      <span style="color: ${brandText}; font-size: 14px; margin-left: 10px;">Free for first 500 students</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="color: ${brandLime}; font-size: 14px;">●</span>
                      <span style="color: ${brandText}; font-size: 14px; margin-left: 10px;">AI-curated learning paths</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="color: ${brandLime}; font-size: 14px;">●</span>
                      <span style="color: ${brandText}; font-size: 14px; margin-left: 10px;">Career-ready roadmaps</span>
                    </div>
                    <div style="margin-bottom: 32px;">
                      <span style="color: ${brandLime}; font-size: 14px;">●</span>
                      <span style="color: ${brandText}; font-size: 14px; margin-left: 10px;">Shape the future of the platform</span>
                    </div>
                    
                    <!-- Signature -->
                    <div style="margin-top: 40px;">
                      <p style="color: ${brandMuted}; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                        Thank you for being part of this journey!
                      </p>
                      <p style="color: #ffffff; font-weight: 600; margin: 0 0 4px 0;">– Team CodeLearnn</p>
                      <p style="color: ${brandMuted}; font-size: 13px; margin: 0;">The Learning OS for Engineering Students</p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <div style="border-top: 1px solid ${brandBorder}; padding-top: 24px; text-align: center;">
                      <p style="margin-bottom: 16px;">
                        <a href="${websiteUrl}" style="color: ${brandMuted}; text-decoration: none; font-size: 13px; margin: 0 12px;">Website</a>
                        <a href="${twitterUrl}" style="color: ${brandMuted}; text-decoration: none; font-size: 13px; margin: 0 12px;">Twitter</a>
                        <a href="${linkedinUrl}" style="color: ${brandMuted}; text-decoration: none; font-size: 13px; margin: 0 12px;">LinkedIn</a>
                      </p>
                      <p style="color: #404040; font-size: 11px; margin: 0;">
                        © ${new Date().getFullYear()} CodeLearnn. Learn like an engineer.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
      <CodeLearnn/>
      
      CodeLearnn OS 2.0 • Early Access Open

      ${greeting}! 👋

      Thank you for joining the CodeLearnn waitlist! We're thrilled to give you exclusive early access to our platform.

      You're one of the first to experience CodeLearnn – the only learning OS that transforms scattered YouTube videos and courses into structured, career-ready roadmaps—validated by AI, built for engineering students.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      GET EARLY ACCESS

      Visit: ${loginUrl}
      Use OTP login with: ${email}

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      WE NEED YOUR FEEDBACK

      As an early access user, your feedback is incredibly valuable to us. Please explore the platform and share:

      • What features you love
      • What could be improved
      • Any bugs you encounter
      • Features you'd like to see

      Send feedback to: ${feedbackEmail}

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      WHAT YOU GET

      ● Free for first 500 students
      ● AI-curated learning paths
      ● Career-ready roadmaps
      ● Shape the future of the platform

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      Thank you for being part of this journey!

      – Team CodeLearnn
      The Learning OS for Engineering Students

      Website: ${websiteUrl}
      Twitter: ${twitterUrl}
      LinkedIn: ${linkedinUrl}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Early access email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Early access email send error:', error);
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetUrl - Password reset URL with token
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetEmail = async (email, resetUrl) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: email,
    subject: 'Reset Your CodeLearnn Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 480px; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; border: 1px solid #2a2a3e;">
                <tr>
                  <td style="padding: 40px 32px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <span style="font-size: 28px; font-weight: bold; color: #ffffff;">
                        <span style="color: #00d4ff;">&lt;</span>CodeLearnn<span style="color: #7c3aed;">/&gt;</span>
                      </span>
                    </div>

                    <!-- Title -->
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 16px 0;">
                      Reset Your Password
                    </h1>

                    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 32px 0;">
                      We received a request to reset your password. Click the button below to choose a new password. This link expires in <strong style="color: #ffffff;">30 minutes</strong>.
                    </p>

                    <!-- Reset Button -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 10px; font-size: 16px; font-weight: 600;">
                        Reset Password
                      </a>
                    </div>

                    <p style="color: #6b6b7b; font-size: 13px; line-height: 1.5; text-align: center; margin: 0 0 16px 0;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="color: #00d4ff; font-size: 12px; word-break: break-all; text-align: center; margin: 0 0 24px 0;">
                      ${resetUrl}
                    </p>

                    <p style="color: #6b6b7b; font-size: 13px; line-height: 1.5; text-align: center; margin: 0;">
                      If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <div style="border-top: 1px solid #2a2a3e; padding-top: 24px; text-align: center;">
                      <p style="color: #4a4a5a; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} CodeLearnn. Learn like an engineer.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Reset Your CodeLearnn Password\n\nWe received a request to reset your password. Visit this link to choose a new password:\n\n${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you didn't request a password reset, you can safely ignore this email.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Password reset email error:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send distraction alert email
 * @param {string} email - Recipient email
 * @param {Object} data - Alert data { userName, distractionCount, threshold }
 * @returns {Promise<boolean>} - Success status
 */
const sendDistractionAlertEmail = async (email, data) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  const { userName, distractionCount, threshold } = data;
  const dashboardUrl = 'https://codelearnn.com/dashboard';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: email,
    subject: `Hey ${userName} — time to refocus! 🎯`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 480px; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; border: 1px solid #2a2a3e;">
                <tr>
                  <td style="padding: 40px 32px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <span style="font-size: 28px; font-weight: bold; color: #ffffff;">
                        <span style="color: #00d4ff;">&lt;</span>CodeLearnn<span style="color: #7c3aed;">/&gt;</span>
                      </span>
                    </div>

                    <div style="text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 48px;">🎯</span>
                    </div>

                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; text-align: center; margin: 0 0 16px 0;">
                      Time to Refocus, ${userName}!
                    </h1>

                    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 24px 0;">
                      We noticed you've watched <strong style="color: #ff6b6b;">${distractionCount} distraction videos</strong> today
                      (your alert threshold is ${threshold}). No judgment — it happens to everyone!
                    </p>

                    <div style="background: linear-gradient(135deg, #1e1e2e 0%, #252538 100%); border: 1px solid #3a3a4e; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                      <p style="color: #c8fa3c; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">💪 Quick Tip</p>
                      <p style="color: #a0a0b0; font-size: 14px; margin: 0;">Try the Pomodoro technique: 25 min of focused learning, then a 5 min break for fun videos. You've got this!</p>
                    </div>

                    <div style="text-align: center; margin-bottom: 24px;">
                      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #c8fa3c 0%, #a3d635 100%); color: #0a0a0a; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600;">
                        🎓 Back to Learning
                      </a>
                    </div>

                    <p style="color: #6b6b7b; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">
                      You can adjust or disable distraction alerts in your account settings.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <div style="border-top: 1px solid #2a2a3e; padding-top: 24px; text-align: center;">
                      <p style="color: #4a4a5a; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} CodeLearnn. Learn like an engineer.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Hey ${userName} — time to refocus!\n\nYou've watched ${distractionCount} distraction videos today (threshold: ${threshold}).\n\nTip: Try the Pomodoro technique — 25 min focused, 5 min break.\n\nBack to learning: ${dashboardUrl}\n\nYou can adjust alerts in settings.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Distraction alert email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Distraction alert email error:', error);
    return false;
  }
};

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendOTPEmail,
  sendWaitlistEmail,
  sendAdminNotification,
  sendEarlyAccessEmail,
  sendPasswordResetEmail,
  sendDistractionAlertEmail,
  generateOTP
};
