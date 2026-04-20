const User = require('../models/User');
const Referral = require('../models/Referral');
const Reward = require('../models/Reward');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const { sendReferralRewardEmail } = require('../config/brevo');
const logger = require('../utils/logger');

// @desc    Get user's referral stats
// @route   GET /api/referrals/stats
// @access  Private
const getReferralStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Referral.getReferralStats(userId);
  const activeRewards = await Reward.getActiveRewards(userId);
  const rewardHistory = await Reward.getRewardHistory(userId, 10);

  // Get next reward tier info
  const nextTier = {
    0: { tier: 1, referralsNeeded: 1, reward: 'Early Access' },
    1: { tier: 2, referralsNeeded: 2, reward: '15% Off Code' },
    2: { tier: 3, referralsNeeded: 2, reward: 'Giveaway Entry' },
    3: { tier: 4, referralsNeeded: 5, reward: 'VIP Status' },
    4: { tier: null, referralsNeeded: 0, reward: null },
  };

  const currentTier = req.user.rewardTier;
  const nextReward = nextTier[currentTier];

  res.json({
    success: true,
    data: {
      referralCode: req.user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register?ref=${req.user.referralCode}`,
      stats,
      activeRewards,
      rewardHistory,
      currentTier,
      nextReward,
      isVIP: req.user.vipStatus,
      earlyAccessGranted: req.user.earlyAccessGranted,
    },
  });
});

// @desc    Track referral click
// @route   POST /api/referrals/track-click
// @access  Public
const trackReferralClick = asyncHandler(async (req, res) => {
  const { referralCode, source } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.get('user-agent');

  // Find referrer by referral code
  const referrer = await User.findOne({ referralCode });
  if (!referrer) {
    // Don't reveal that referral code is invalid
    return res.json({ success: true });
  }

  // Create referral record
  await Referral.create({
    referrer: referrer._id,
    referralCode,
    status: 'clicked',
    clickedAt: new Date(),
    ipAddress,
    userAgent,
    source: source || 'direct',
  });

  logger.logRequest(req, `Referral click tracked for code: ${referralCode}`);

  res.json({ success: true });
});

// @desc    Get referral leaderboard
// @route   GET /api/referrals/leaderboard
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const { period = 'month', limit = 10 } = req.query;

  let startDate;
  const now = new Date();

  if (period === 'week') {
    startDate = new Date(now.setDate(now.getDate() - 7));
  } else if (period === 'month') {
    startDate = new Date(now.setMonth(now.getMonth() - 1));
  } else if (period === 'all') {
    startDate = new Date(0);
  } else {
    startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  const leaderboard = await User.aggregate([
    {
      $match: {
        referralCount: { $gt: 0 },
        isActive: true,
      },
    },
    {
      $lookup: {
        from: 'referrals',
        localField: '_id',
        foreignField: 'referrer',
        as: 'referrals',
      },
    },
    {
      $addFields: {
        periodReferrals: {
          $size: {
            $filter: {
              input: '$referrals',
              as: 'ref',
              cond: { $gte: ['$$ref.createdAt', startDate] },
            },
          },
        },
      },
    },
    {
      $sort: { periodReferrals: -1, referralCount: -1 },
    },
    {
      $limit: parseInt(limit, 10),
    },
    {
      $project: {
        name: 1,
        referralCount: 1,
        periodReferrals: 1,
        rewardTier: 1,
        vipStatus: 1,
      },
    },
  ]);

  // Add prize information
  const prizes = ['$1,000 Shopping Spree', '$500 Shopping Spree', '$250 Shopping Spree', '$100 Gift Card', '$50 Gift Card'];
  
  const leaderboardWithPrizes = leaderboard.map((user, index) => ({
    ...user,
    rank: index + 1,
    prize: index < prizes.length ? prizes[index] : null,
  }));

  res.json({
    success: true,
    period,
    leaderboard: leaderboardWithPrizes,
  });
});

// @desc    Claim a reward
// @route   POST /api/referrals/claim-reward/:rewardId
// @access  Private
const claimReward = asyncHandler(async (req, res) => {
  const { rewardId } = req.params;
  const userId = req.user._id;

  const reward = await Reward.findOne({ _id: rewardId, user: userId });

  if (!reward) {
    throw new NotFoundError('Reward not found');
  }

  if (!reward.isValid()) {
    throw new BadRequestError('Reward has expired or already been redeemed');
  }

  await reward.redeem('profile');

  logger.logRequest(req, `Reward claimed: ${reward.rewardValue} by user ${userId}`);

  res.json({
    success: true,
    message: 'Reward claimed successfully',
    reward: {
      type: reward.rewardType,
      value: reward.rewardValue,
      description: reward.getDescription(),
    },
  });
});

// @desc    Get available rewards
// @route   GET /api/referrals/rewards
// @access  Private
const getAvailableRewards = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rewards = await Reward.getActiveRewards(userId);

  const formattedRewards = rewards.map(reward => ({
    id: reward._id,
    type: reward.rewardType,
    value: reward.rewardValue,
    description: reward.getDescription(),
    expiresAt: reward.expiresAt,
  }));

  res.json({
    success: true,
    rewards: formattedRewards,
  });
});

// @desc    Get user's referral history
// @route   GET /api/referrals/history
// @access  Private
const getReferralHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const referrals = await Referral.find({ referrer: userId })
    .populate('referredUser', 'name email createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Referral.countDocuments({ referrer: userId });

  res.json({
    success: true,
    count: referrals.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    referrals,
  });
});

// @desc    Get reward tiers information
// @route   GET /api/referrals/tiers
// @access  Public
const getRewardTiers = asyncHandler(async (req, res) => {
  const tiers = [
    {
      tier: 1,
      referralsNeeded: 1,
      name: 'Early Access',
      description: 'Get early access to launch deals',
      icon: 'bi-clock',
      benefits: ['Shop before public launch', 'Limited time offers'],
    },
    {
      tier: 2,
      referralsNeeded: 3,
      name: '15% Off Code',
      description: 'Exclusive discount code for you and your friends',
      icon: 'bi-tag',
      benefits: ['15% off your next purchase', 'Shareable with friends'],
    },
    {
      tier: 3,
      referralsNeeded: 5,
      name: 'Giveaway Entry',
      description: 'Enter to win a $500 shopping spree',
      icon: 'bi-gift',
      benefits: ['Monthly drawing entry', 'Multiple entries possible'],
    },
    {
      tier: 4,
      referralsNeeded: 10,
      name: 'VIP Status',
      description: 'Unlock VIP benefits for life',
      icon: 'bi-gem',
      benefits: ['Free shipping on all orders', 'Early access to sales', 'Exclusive VIP discounts', 'Birthday rewards'],
    },
  ];

  res.json({
    success: true,
    tiers,
  });
});

// @desc    Check if user has early access
// @route   GET /api/referrals/early-access
// @access  Private
const checkEarlyAccess = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const hasEarlyAccess = req.user.earlyAccessGranted || req.user.vipStatus;
  const hasVIPEarlyAccess = req.user.vipStatus;

  res.json({
    success: true,
    hasEarlyAccess,
    hasVIPEarlyAccess,
    launchDate: process.env.LAUNCH_DATE || '2024-12-01',
  });
});

// @desc    Generate share links
// @route   GET /api/referrals/share-links
// @access  Private
const getShareLinks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const referralCode = req.user.referralCode;
  const baseUrl = process.env.FRONTEND_URL;
  const referralLink = `${baseUrl}/register?ref=${referralCode}`;

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Join Mall242 using my referral link and get exclusive rewards! ${referralLink}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join Mall242 using my referral link and get exclusive rewards!`)}&url=${encodeURIComponent(referralLink)}`,
    email: `mailto:?subject=${encodeURIComponent('Join me on Mall242!')}&body=${encodeURIComponent(`Hi! I've been shopping at Mall242 and thought you might like it too. Use my referral link to join and get exclusive rewards: ${referralLink}`)}`,
    copy: referralLink,
  };

  res.json({
    success: true,
    shareLinks,
    referralCode,
    referralLink,
  });
});

module.exports = {
  getReferralStats,
  trackReferralClick,
  getLeaderboard,
  claimReward,
  getAvailableRewards,
  getReferralHistory,
  getRewardTiers,
  checkEarlyAccess,
  getShareLinks,
};