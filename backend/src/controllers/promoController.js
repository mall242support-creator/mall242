const PromoPopup = require('../models/PromoPopup');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Get active promo popup (public)
// @route   GET /api/promo/active
// @access  Public
const getActivePromo = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const promo = await PromoPopup.findOne({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    promo: promo || null,
  });
});

// @desc    Get all promos (admin)
// @route   GET /api/admin/promos
// @access  Private (Admin only)
const getAllPromos = asyncHandler(async (req, res) => {
  const promos = await PromoPopup.find().sort({ createdAt: -1 });
  
  res.json({
    success: true,
    promos,
  });
});

// @desc    Create promo (admin)
// @route   POST /api/admin/promos
// @access  Private (Admin only)
const createPromo = asyncHandler(async (req, res) => {
  const promo = await PromoPopup.create(req.body);
  
  logger.logRequest(req, `Promo created: ${promo.title} by admin ${req.user.email}`);
  
  res.status(201).json({
    success: true,
    message: 'Promo created successfully',
    promo,
  });
});

// @desc    Update promo (admin)
// @route   PUT /api/admin/promos/:id
// @access  Private (Admin only)
const updatePromo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const promo = await PromoPopup.findById(id);
  if (!promo) {
    throw new NotFoundError('Promo not found');
  }
  
  const updated = await PromoPopup.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  
  logger.logRequest(req, `Promo updated: ${updated.title} by admin ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Promo updated successfully',
    promo: updated,
  });
});

// @desc    Delete promo (admin)
// @route   DELETE /api/admin/promos/:id
// @access  Private (Admin only)
const deletePromo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const promo = await PromoPopup.findById(id);
  if (!promo) {
    throw new NotFoundError('Promo not found');
  }
  
  await promo.deleteOne();
  
  logger.logRequest(req, `Promo deleted: ${promo.title} by admin ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Promo deleted successfully',
  });
});

// Make sure all functions are exported
module.exports = {
  getActivePromo,
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
};