const User = require('../models/User');
const YouTubeWatchHistory = require('../models/YouTubeWatchHistory');
const UserCareerJourney = require('../models/UserCareerJourney');

/**
 * weeklyDigestJob — Sends automated weekly progress summary emails.
 *
 * Gathers stats from YouTubeWatchHistory and UserCareerJourney,
 * then sends a personalized progress digest email to users who opt in.
 *
 * Intended to be called by a cron scheduler (e.g., node-cron) every Monday at 9 AM.
 *
 * Usage:
 *   const { runWeeklyDigest } = require('./jobs/weeklyDigestJob');
 *   cron.schedule('0 9 * * 1', runWeeklyDigest);
 */
async function runWeeklyDigest() {
  console.log('📊 Starting weekly digest job...');

  try {
    // Find users who opted in to weekly progress emails
    const users = await User.find({
      'notifications.email.weeklyProgress': true,
      isVerified: true,
    }).select('_id name email').lean();

    console.log(`Found ${users.length} users opted in to weekly digests`);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const digest = await gatherDigestData(user._id);
        if (!digest) continue; // No data to send

        await sendDigestEmail(user.email, user.name || 'Learner', digest);
        sent++;
      } catch (err) {
        console.error(`Digest failed for ${user.email}: ${err.message}`);
        failed++;
      }
    }

    console.log(`✅ Weekly digest complete: ${sent} sent, ${failed} failed`);
    return { sent, failed, total: users.length };
  } catch (error) {
    console.error('Weekly digest job error:', error.message);
    throw error;
  }
}

/**
 * Gather all stats for one user's weekly digest.
 */
async function gatherDigestData(userId) {
  const [watchHistory, journey] = await Promise.all([
    YouTubeWatchHistory.findOne({ user: userId }).lean(),
    UserCareerJourney.findOne({ user: userId, status: 'active' }).lean(),
  ]);

  // Skip if no meaningful data
  if (!watchHistory && !journey) return null;

  const stats = watchHistory?.stats || {};

  return {
    // YouTube watch stats
    totalWatchMinutes: stats.totalWatchTimeMinutes || 0,
    productiveMinutes: stats.productiveMinutes || 0,
    distractionMinutes: stats.distractionMinutes || 0,
    focusScore: stats.focusScore || 0,
    currentStreak: stats.currentStreak || 0,
    longestStreak: stats.longestStreak || 0,
    videosWatched: stats.videosWatched || 0,
    autoTrackedCount: stats.autoTrackedCount || 0,

    // Journey progress
    journeyTitle: journey?.career?.title || null,
    journeyProgress: journey?.stats?.overallProgress || 0,
    phasesCompleted: journey?.stats?.phasesCompleted || 0,
    totalPhases: journey?.roadmap?.phases?.length || 0,
    resourcesCompleted: journey?.stats?.resourcesCompleted || 0,
    xpEarned: journey?.stats?.xpEarned || 0,
  };
}

/**
 * Send the weekly digest email using emailService.
 */
async function sendDigestEmail(email, userName, digest) {
  const nodemailer = require('nodemailer');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not configured, skipping digest email');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const focusEmoji = digest.focusScore >= 80 ? '🔥' : digest.focusScore >= 50 ? '👍' : '🎯';
  const dashboardUrl = 'https://codelearnn.com/dashboard';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: email,
    subject: `${focusEmoji} Your Weekly Progress — ${digest.focusScore}% Focus Score`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 520px; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; border: 1px solid #2a2a3e;">
                <tr>
                  <td style="padding: 40px 32px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <span style="font-size: 28px; font-weight: bold; color: #ffffff;">
                        <span style="color: #00d4ff;">&lt;</span>CodeLearnn<span style="color: #7c3aed;">/&gt;</span>
                      </span>
                    </div>

                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; text-align: center; margin: 0 0 8px 0;">
                      Weekly Progress for ${userName}
                    </h1>
                    <p style="color: #6b6b7b; font-size: 13px; text-align: center; margin: 0 0 32px;">
                      Here's what you accomplished this week
                    </p>

                    <!-- Focus Score -->
                    <div style="background: linear-gradient(135deg, #1e1e2e, #252538); border: 1px solid #3a3a4e; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
                      <p style="color: #c8fa3c; font-size: 48px; font-weight: 700; margin: 0;">${digest.focusScore}%</p>
                      <p style="color: #a0a0b0; font-size: 14px; margin: 4px 0 0;">Focus Score</p>
                    </div>

                    <!-- Stats Grid -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                      <tr>
                        <td width="50%" style="padding: 6px;">
                          <div style="background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px; padding: 16px; text-align: center;">
                            <p style="color: #00d4ff; font-size: 24px; font-weight: 600; margin: 0;">${digest.productiveMinutes}</p>
                            <p style="color: #6b6b7b; font-size: 12px; margin: 4px 0 0;">Productive Min</p>
                          </div>
                        </td>
                        <td width="50%" style="padding: 6px;">
                          <div style="background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px; padding: 16px; text-align: center;">
                            <p style="color: #7c3aed; font-size: 24px; font-weight: 600; margin: 0;">${digest.currentStreak}</p>
                            <p style="color: #6b6b7b; font-size: 12px; margin: 4px 0 0;">Day Streak 🔥</p>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 6px;">
                          <div style="background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px; padding: 16px; text-align: center;">
                            <p style="color: #ff6b6b; font-size: 24px; font-weight: 600; margin: 0;">${digest.distractionMinutes}</p>
                            <p style="color: #6b6b7b; font-size: 12px; margin: 4px 0 0;">Distraction Min</p>
                          </div>
                        </td>
                        <td width="50%" style="padding: 6px;">
                          <div style="background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px; padding: 16px; text-align: center;">
                            <p style="color: #2dd4bf; font-size: 24px; font-weight: 600; margin: 0;">${digest.autoTrackedCount}</p>
                            <p style="color: #6b6b7b; font-size: 12px; margin: 4px 0 0;">Videos Tracked</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    ${digest.journeyTitle ? `
                    <!-- Journey Progress -->
                    <div style="background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 8px;">${digest.journeyTitle}</p>
                      <div style="background: #2a2a3e; border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 8px;">
                        <div style="background: linear-gradient(90deg, #c8fa3c, #2dd4bf); height: 100%; width: ${digest.journeyProgress}%; border-radius: 4px;"></div>
                      </div>
                      <p style="color: #6b6b7b; font-size: 12px; margin: 0;">${digest.journeyProgress}% complete • ${digest.phasesCompleted}/${digest.totalPhases} phases • ${digest.xpEarned} XP</p>
                    </div>
                    ` : ''}

                    <div style="text-align: center;">
                      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #c8fa3c 0%, #a3d635 100%); color: #0a0a0a; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                        View Full Dashboard →
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <div style="border-top: 1px solid #2a2a3e; padding-top: 20px; text-align: center;">
                      <p style="color: #4a4a5a; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} CodeLearnn. You can disable weekly emails in settings.</p>
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
    text: `Your Weekly CodeLearnn Progress\n\nFocus Score: ${digest.focusScore}%\nProductive: ${digest.productiveMinutes} min\nDistraction: ${digest.distractionMinutes} min\nStreak: ${digest.currentStreak} days\n${digest.journeyTitle ? `Journey: ${digest.journeyTitle} (${digest.journeyProgress}%)` : ''}\n\nView dashboard: ${dashboardUrl}`
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { runWeeklyDigest };
