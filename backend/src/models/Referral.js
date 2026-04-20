const mongoose = require('mongoose');

// Referral Schema
const referralSchema = new mongoose.Schema({
  // Referrer (who shared the link)
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Referred user (who signed up)
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  
  // Referral tracking
  referralCode: {
    type: String,
    required: true,
    index: true,
  },
  
  // Referred email (captured before signup)
  referredEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true,
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['clicked', 'signed_up', 'completed_purchase', 'reward_claimed'],
    default: 'clicked',
    index: true,
  },
  
  // Timestamps for each stage
  clickedAt: {
    type: Date,
    default: Date.now,
  },
  signedUpAt: Date,
  completedPurchaseAt: Date,
  rewardClaimedAt: Date,
  
  // Purchase tracking
  firstPurchaseAmount: {
    type: Number,
    default: 0,
  },
  firstPurchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  
  // Reward information
  rewardTier: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: null,
  },
  rewardClaimed: {
    type: Boolean,
    default: false,
  },
  rewardValue: String,
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  source: {
    type: String,
    enum: ['whatsapp', 'facebook', 'twitter', 'email', 'direct', 'other'],
    default: 'direct',
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
  
}, {
  timestamps: true,
});

// Index for expiration
referralSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for referrer + referredEmail uniqueness (prevent duplicate tracking)
referralSchema.index({ referrer: 1, referredEmail: 1 }, { unique: true, partialFilterExpression: { referredEmail: { $ne: null } } });

// Method to mark as signed up
referralSchema.methods.markSignedUp = function(userId) {
  this.referredUser = userId;
  this.status = 'signed_up';
  this.signedUpAt = new Date();
  return this.save();
};

// Method to mark as completed purchase
referralSchema.methods.markCompletedPurchase = function(orderId, orderAmount) {
  this.status = 'completed_purchase';
  this.completedPurchaseAt = new Date();
  this.firstPurchaseOrderId = orderId;
  this.firstPurchaseAmount = orderAmount;
  return this.save();
};

// Method to mark reward claimed
referralSchema.methods.markRewardClaimed = function(rewardValue) {
  this.status = 'reward_claimed';
  this.rewardClaimedAt = new Date();
  this.rewardClaimed = true;
  this.rewardValue = rewardValue;
  return this.save();
};

// Check if referral is still valid
referralSchema.methods.isValid = function() {
  return this.expiresAt > new Date() && this.status !== 'reward_claimed';
};

// Get reward tier based on referrer's total referrals
referralSchema.statics.getRewardTier = function(referralCount) {
  if (referralCount >= 10) return 4;
  if (referralCount >= 5) return 3;
  if (referralCount >= 3) return 2;
  if (referralCount >= 1) return 1;
  return 0;
};

// Get reward details by tier
referralSchema.statics.getRewardByTier = function(tier) {
  const rewards = {
    1: { name: 'Early Access', description: 'Get early access to launch deals', value: 'early_access' },
    2: { name: '15% Off Code', description: 'Exclusive discount code for you and your friends', value: '15_percent_off' },
    3: { name: 'Giveaway Entry', description: 'Enter to win a $500 shopping spree', value: 'giveaway_entry' },
    4: { name: 'VIP Status', description: 'Unlock VIP benefits for life', value: 'vip_status' },
  };
  return rewards[tier] || null;
};

// Get user's referral stats
referralSchema.statics.getReferralStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { referrer: userId } },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: 1 },
        totalSignups: { $sum: { $cond: [{ $eq: ['$status', 'signed_up'] }, 1, 0] } },
        totalCompleted: { $sum: { $cond: [{ $eq: ['$status', 'completed_purchase'] }, 1, 0] } },
        totalRewards: { $sum: { $cond: [{ $eq: ['$rewardClaimed', true] }, 1, 0] } },
        totalEarnings: { $sum: '$firstPurchaseAmount' },
      },
    },
  ]);
  
  return stats[0] || {
    totalClicks: 0,
    totalSignups: 0,
    totalCompleted: 0,
    totalRewards: 0,
    totalEarnings: 0,
  };
};

// Get recent referrals
referralSchema.statics.getRecentReferrals = async function(userId, limit = 10) {
  return this.find({ referrer: userId })
    .populate('referredUser', 'name email createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Referral', referralSchema);