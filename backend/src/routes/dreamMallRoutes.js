const express = require('express');
const router = express.Router();
const {
  saveDreamMallPreferences,
  getMyDreamMall,
  updateDreamMallPreferences,
  getPersonalizedRecommendations,
  getQuizCategories,
  getQuizBrands,
  getDealTypes,
  deleteDreamMallPreferences,
} = require('../controllers/dreamMallController');
const { protect, optionalAuth } = require('../middleware/auth');

// Public routes (quiz data)
router.get('/categories', getQuizCategories);
router.get('/brands', getQuizBrands);
router.get('/deal-types', getDealTypes);

// Protected routes (require authentication for saving preferences)
router.post('/save', optionalAuth, saveDreamMallPreferences);
router.get('/my-preferences', protect, getMyDreamMall);
router.put('/update', protect, updateDreamMallPreferences);
router.get('/recommendations', protect, getPersonalizedRecommendations);
router.delete('/preferences', protect, deleteDreamMallPreferences);

module.exports = router;