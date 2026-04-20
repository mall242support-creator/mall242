const mongoose = require('mongoose');

// Reward Schema
const rewardSchema = new mongoose.Schema({
  // User who earned the reward
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Reward tier (1-4)
  tier: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4],
  },
  
  // Reward type
  rewardType: {
    type: String,
    required: true,
    enum: ['early_access', 'discount_code', 'giveaway_entry', 'vip_status', 'shopping_spree', 'free_shipping'],
  },
  
  // Reward value (could be discount code, entry ID, etc.)
  rewardValue: {
    type: String,
    required: true,
  },
  
  // Reward details
  rewardDetails: {
    discountPercent: Number,
    discountCode: String,
    maxDiscount: Number,
    minPurchase: Number,
    expiryDays: Number,
    entryId: String,
    giveawayName: String,
  },
  
  // Status
  isRedeemed: {
    type: Boolean,
    default: false,
  },
  redeemedAt: Date,
  redeemedVia: {
    type: String,
    enum: ['checkout', 'profile', 'email', 'other'],
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    required: true,
  },
  
  // Notification tracking
  notificationSent: {
    type: Boolean,
    default: false,
  },
  notificationSentAt: Date,
  
  // Metadata
  source: {
    type: String,
    enum: ['referral', 'promotion', 'birthday', 'vip', 'other'],
    default: 'referral',
  },
  notes: String,
  
}, {
  timestamps: true,
});

// Index for expiration cleanup
rewardSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for user + unredeemed rewards
rewardSchema.index({ user: 1, isRedeemed: 1, expiresAt: 1 });

// Method to redeem reward
rewardSchema.methods.redeem = async function(redeemedVia = 'profile') {
  if (this.isRedeemed) {
    throw new Error('Reward has already been redeemed');
  }
  
  if (this.expiresAt < new Date()) {
    throw new Error('Reward has expired');
  }
  
  this.isRedeemed = true;
  this.redeemedAt = new Date();
  this.redeemedVia = redeemedVia;
  
  return this.save();
};

// Method to check if reward is valid
rewardSchema.methods.isValid = function() {
  return !this.isRedeemed && this.expiresAt > new Date();
};

// Get reward description
rewardSchema.methods.getDescription = function() {
  const descriptions = {
    early_access: 'Early access to launch deals and promotions',
    discount_code: `${this.rewardDetails?.discountPercent || 0}% off your next purchase`,
    giveaway_entry: `Entry into ${this.rewardDetails?.giveawayName || 'monthly shopping spree'} giveaway`,
    vip_status: 'Lifetime VIP membership with exclusive benefits',
    shopping_spree: `$${this.rewardDetails?.maxDiscount || 500} shopping spree`,
    free_shipping: 'Free shipping on your next order',
  };
  return descriptions[this.rewardType] || 'Reward';
};

// Static method to create reward for user
rewardSchema.statics.createReward = async function(userId, tier, rewardType, rewardValue, rewardDetails = {}, source = 'referral') {
  // Calculate expiry based on reward type
  let expiryDays = 30; // default 30 days
  if (rewardType === 'early_access') expiryDays = 90;
  if (rewardType === 'vip_status') expiryDays = 365;
  if (rewardType === 'discount_code') expiryDays = 60;
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);
  
  const reward = new this({
    user: userId,
    tier,
    rewardType,
    rewardValue,
    rewardDetails: {
      expiryDays,
      ...rewardDetails,
    },
    expiresAt,
    source,
  });
  
  return reward.save();
};

// Static method to get user's active rewards
rewardSchema.statics.getActiveRewards = async function(userId) {
  const now = new Date();
  return this.find({
    user: userId,
    isRedeemed: false,
    expiresAt: { $gt: now },
  }).sort({ tier: -1, createdAt: 1 });
};

// Static method to get user's reward history
rewardSchema.statics.getRewardHistory = async function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to check if user has early access
rewardSchema.statics.hasEarlyAccess = async function(userId) {
  const now = new Date();
  const reward = await this.findOne({
    user: userId,
    rewardType: 'early_access',
    isRedeemed: false,
    expiresAt: { $gt: now },
  });
  return !!reward;
};

// Static method to get available discount code
rewardSchema.statics.getAvailableDiscount = async function(userId, minPurchase = 0) {
  const now = new Date();
  const reward = await this.findOne({
    user: userId,
    rewardType: 'discount_code',
    isRedeemed: false,
    expiresAt: { $gt: now },
    'rewardDetails.minPurchase': { $lte: minPurchase },
  }).sort({ 'rewardDetails.discountPercent': -1 });
  
  if (reward) {
    return {
      code: reward.rewardValue,
      discountPercent: reward.rewardDetails.discountPercent,
      maxDiscount: reward.rewardDetails.maxDiscount,
      minPurchase: reward.rewardDetails.minPurchase,
      expiresAt: reward.expiresAt,
    };
  }
  return null;
};

module.exports = mongoose.model('Reward', rewardSchema);