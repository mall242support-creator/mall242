const express = require('express');
const router = express.Router();
const {
  getReferralStats,
  trackReferralClick,
  getLeaderboard,
  claimReward,
  getAvailableRewards,
  getReferralHistory,
  getRewardTiers,
  checkEarlyAccess,
  getShareLinks,
} = require('../controllers/referralController');
const { protect, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/tiers', getRewardTiers);
router.post('/track-click', trackReferralClick);

// Protected routes (require authentication)
router.use(protect);
router.get('/stats', getReferralStats);
router.get('/rewards', getAvailableRewards);
router.get('/history', getReferralHistory);
router.get('/share-links', getShareLinks);
router.get('/early-access', checkEarlyAccess);
router.post('/claim-reward/:rewardId', claimReward);

module.exports = router;