const express = require('express');
const router = express.Router();
const { getHeroSlides } = require('../controllers/heroController');

// Public route - get active hero slides
router.get('/', getHeroSlides);

module.exports = router;