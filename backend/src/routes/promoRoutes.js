const express = require('express');
const router = express.Router();
const { getActivePromo } = require('../controllers/promoController');

// Public route
router.get('/active', getActivePromo);

module.exports = router;