const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

// Import controller functions
const {
  getAllMysteryDrops,
  getMysteryDrop,
  signupForReveal,
  getAllMysteryDropsAdmin,
  createMysteryDropAdmin,
  updateMysteryDropAdmin,
  deleteMysteryDropAdmin,
  revealMysteryDropAdmin,
  getMysteryDropSignupsAdmin,
  exportMysteryDropSignups,
} = require('../controllers/mysteryDropController');

// ============ PUBLIC ROUTES ============
router.get('/', getAllMysteryDrops);
router.get('/:id', getMysteryDrop);
router.post('/signup', signupForReveal);

// ============ ADMIN ROUTES ============
router.use(protect, adminOnly);

router.get('/admin/all', getAllMysteryDropsAdmin);
router.post('/admin/create', createMysteryDropAdmin);
router.put('/admin/:id', updateMysteryDropAdmin);
router.delete('/admin/:id', deleteMysteryDropAdmin);
router.post('/admin/:id/reveal', revealMysteryDropAdmin);
router.get('/admin/:id/signups', getMysteryDropSignupsAdmin);
router.get('/admin/:id/export', exportMysteryDropSignups);

module.exports = router;