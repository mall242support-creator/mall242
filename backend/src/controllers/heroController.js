const HeroSlide = require('../models/HeroSlide');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Get all hero slides (public)
// @route   GET /api/hero
// @access  Public
const getHeroSlides = asyncHandler(async (req, res) => {
  const slides = await HeroSlide.find({ isActive: true }).sort('displayOrder');
  
  res.json({
    success: true,
    slides,
  });
});

// @desc    Get all hero slides (admin)
// @route   GET /api/admin/hero
// @access  Private (Admin only)
const getAllHeroSlides = asyncHandler(async (req, res) => {
  const slides = await HeroSlide.find().sort('displayOrder');
  
  res.json({
    success: true,
    slides,
  });
});

// @desc    Get single hero slide
// @route   GET /api/admin/hero/:id
// @access  Private (Admin only)
const getHeroSlideById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const slide = await HeroSlide.findById(id);
  if (!slide) {
    throw new NotFoundError('Hero slide not found');
  }

  res.json({
    success: true,
    slide,
  });
});

// @desc    Create hero slide
// @route   POST /api/admin/hero
// @access  Private (Admin only)
const createHeroSlide = asyncHandler(async (req, res) => {
  const { title, subtitle, image, mobileImage, ctaText, ctaLink, displayOrder, isActive, buttonColor, textColor } = req.body;

  if (!title || !image) {
    throw new BadRequestError('Title and image are required');
  }

  const slide = await HeroSlide.create({
    title,
    subtitle,
    image,
    mobileImage,
    ctaText: ctaText || 'Shop Now',
    ctaLink: ctaLink || '/products',
    displayOrder: displayOrder || 0,
    isActive: isActive !== undefined ? isActive : true,
    buttonColor: buttonColor || '#FFC72C',
    textColor: textColor || 'white',
  });

  logger.logRequest(req, `Hero slide created: ${title} by admin ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Hero slide created successfully',
    slide,
  });
});

// @desc    Update hero slide
// @route   PUT /api/admin/hero/:id
// @access  Private (Admin only)
const updateHeroSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, image, mobileImage, ctaText, ctaLink, displayOrder, isActive, buttonColor, textColor } = req.body;

  const slide = await HeroSlide.findById(id);
  if (!slide) {
    throw new NotFoundError('Hero slide not found');
  }

  const updatedSlide = await HeroSlide.findByIdAndUpdate(id, {
    title,
    subtitle,
    image,
    mobileImage,
    ctaText,
    ctaLink,
    displayOrder,
    isActive,
    buttonColor,
    textColor,
  }, {
    new: true,
    runValidators: true,
  });

  logger.logRequest(req, `Hero slide updated: ${title} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Hero slide updated successfully',
    slide: updatedSlide,
  });
});

// @desc    Delete hero slide
// @route   DELETE /api/admin/hero/:id
// @access  Private (Admin only)
const deleteHeroSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const slide = await HeroSlide.findById(id);
  if (!slide) {
    throw new NotFoundError('Hero slide not found');
  }

  await slide.deleteOne();

  logger.logRequest(req, `Hero slide deleted: ${slide.title} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Hero slide deleted successfully',
  });
});

// @desc    Reorder hero slides
// @route   PUT /api/admin/hero/reorder
// @access  Private (Admin only)
const reorderHeroSlides = asyncHandler(async (req, res) => {
  const { slides } = req.body;

  for (const slide of slides) {
    await HeroSlide.findByIdAndUpdate(slide.id, { displayOrder: slide.displayOrder });
  }

  logger.logRequest(req, `Hero slides reordered by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Hero slides reordered successfully',
  });
});

module.exports = {
  getHeroSlides,
  getAllHeroSlides,
  getHeroSlideById,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
};