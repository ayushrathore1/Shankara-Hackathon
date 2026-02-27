const mongoose = require('mongoose');

/**
 * Referral Model
 * Tracks referral invitations and rewards
 */
const ReferralSchema = new mongoose.Schema({
  // Who sent the referral
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Unique referral code for this user
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  // Who signed up via this referral
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referredEmail: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'signed_up', 'activated', 'rewarded'],
    default: 'pending'
  },

  // Rewards
  reward: {
    xp: { type: Number, default: 100 },
    premiumDays: { type: Number, default: 3 },
    claimed: { type: Boolean, default: false },
    claimedAt: Date
  },

  // Timestamps
  signedUpAt: Date,
  activatedAt: Date  // When referred user completes onboarding
}, {
  timestamps: true
});

ReferralSchema.index({ referrer: 1, status: 1 });
ReferralSchema.index({ referralCode: 1 });

// Static: Generate unique referral code
ReferralSchema.statics.generateCode = function(userId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MEDHA-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Static: Get referral stats for a user
ReferralSchema.statics.getStats = async function(userId) {
  const referrals = await this.find({ referrer: userId }).lean();
  return {
    totalReferred: referrals.length,
    signedUp: referrals.filter(r => r.status !== 'pending').length,
    activated: referrals.filter(r => ['activated', 'rewarded'].includes(r.status)).length,
    totalXPEarned: referrals.filter(r => r.reward.claimed).reduce((sum, r) => sum + r.reward.xp, 0),
    totalPremiumDays: referrals.filter(r => r.reward.claimed).reduce((sum, r) => sum + r.reward.premiumDays, 0)
  };
};

module.exports = mongoose.model('Referral', ReferralSchema);
