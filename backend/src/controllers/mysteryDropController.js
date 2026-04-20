const { MysteryDrop, MysteryDropSignup } = require('../models/MysteryDrop');
const User = require('../models/User');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const { sendMysteryRevealEmail } = require('../config/brevo');
const logger = require('../utils/logger');

// ============ PUBLIC ROUTES ============

// @desc    Get all mystery drops (public)
// @route   GET /api/mystery-drops
// @access  Public
const getAllMysteryDrops = asyncHandler(async (req, res) => {
  const { isVIP = false } = req.query;
  
  const upcoming = await MysteryDrop.getUpcoming(6);
  const revealed = await MysteryDrop.getRevealed(10);
  
  const formatDrop = (drop) => {
    return drop.getRevealInfo(isVIP === 'true');
  };
  
  res.json({
    success: true,
    upcoming: upcoming.map(formatDrop),
    revealed: revealed.map(formatDrop),
  });
});

// @desc    Get single mystery drop (public)
// @route   GET /api/mystery-drops/:id
// @access  Public
const getMysteryDrop = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isVIP = false } = req.query;
  
  const mysteryDrop = await MysteryDrop.findById(id);
  if (!mysteryDrop) {
    throw new NotFoundError('Mystery drop not found');
  }
  
  let isUserVIP = isVIP === 'true';
  if (req.user && req.user.vipStatus) {
    isUserVIP = true;
  }
  
  res.json({
    success: true,
    mysteryDrop: mysteryDrop.getRevealInfo(isUserVIP),
  });
});

// @desc    Sign up for mystery drop reveal
// @route   POST /api/mystery-drops/signup
// @access  Public
const signupForReveal = asyncHandler(async (req, res) => {
  const { email, mysteryDropId } = req.body;
  const userId = req.user?._id;
  
  const mysteryDrop = await MysteryDrop.findById(mysteryDropId);
  if (!mysteryDrop) {
    throw new NotFoundError('Mystery drop not found');
  }
  
  const existingSignup = await MysteryDropSignup.findOne({
    email,
    mysteryDrop: mysteryDropId,
  });
  
  if (existingSignup) {
    return res.json({
      success: true,
      message: 'You are already signed up for this reveal!',
      alreadySignedUp: true,
    });
  }
  
  const signup = await MysteryDropSignup.create({
    email,
    mysteryDrop: mysteryDropId,
    user: userId || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  await mysteryDrop.incrementSignupCount();
  
  logger.logRequest(req, `New mystery drop signup for ${mysteryDrop.brandName}: ${email}`);
  
  if (mysteryDrop.isRevealed) {
    try {
      await sendMysteryRevealEmail(email, email.split('@')[0], mysteryDrop);
      signup.notified = true;
      signup.notifiedAt = new Date();
      await signup.save();
    } catch (emailError) {
      logger.error(`Failed to send reveal email: ${emailError.message}`);
    }
    
    return res.json({
      success: true,
      message: 'You have been signed up! The brand has already been revealed. Check your email!',
      isRevealed: true,
    });
  }
  
  res.json({
    success: true,
    message: 'You have been signed up! You will be notified when the brand is revealed.',
    hint: mysteryDrop.emailHint,
  });
});

// ============ ADMIN ROUTES ============

// @desc    Get all mystery drops (admin)
// @route   GET /api/admin/mystery-drops
// @access  Private (Admin only)
const getAllMysteryDropsAdmin = asyncHandler(async (req, res) => {
  const mysteryDrops = await MysteryDrop.find().sort({ revealDate: -1 });
  
  res.json({
    success: true,
    mysteryDrops,
  });
});

// @desc    Create mystery drop (admin)
// @route   POST /api/admin/mystery-drops
// @access  Private (Admin only)
const createMysteryDropAdmin = asyncHandler(async (req, res) => {
  const {
    brandName,
    clue,
    description,
    blurredImageUrl,
    revealImageUrl,
    brandLogoUrl,
    bannerUrl,
    revealDate,
    emailHint,
    emailSubject,
    emailTemplate,
    vipEarlyAccess,
    vipEarlyAccessHours,
    deals,
    isActive,
    isFeatured,
  } = req.body;

  const existingDrop = await MysteryDrop.findOne({ brandName });
  if (existingDrop) {
    throw new BadRequestError('A mystery drop with this brand name already exists');
  }

  const mysteryDrop = await MysteryDrop.create({
    brandName,
    clue,
    description,
    blurredImageUrl,
    revealImageUrl,
    brandLogoUrl,
    bannerUrl,
    revealDate: new Date(revealDate),
    emailHint,
    emailSubject,
    emailTemplate,
    vipEarlyAccess: vipEarlyAccess !== undefined ? vipEarlyAccess : true,
    vipEarlyAccessHours: vipEarlyAccessHours || 24,
    deals: deals || [],
    isActive: isActive !== undefined ? isActive : true,
    isFeatured: isFeatured || false,
    createdBy: req.user._id,
  });

  logger.logRequest(req, `Mystery drop created: ${brandName} by admin ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Mystery drop created successfully',
    mysteryDrop,
  });
});

// @desc    Update mystery drop (admin)
// @route   PUT /api/admin/mystery-drops/:id
// @access  Private (Admin only)
const updateMysteryDropAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const mysteryDrop = await MysteryDrop.findById(id);
  if (!mysteryDrop) {
    throw new NotFoundError('Mystery drop not found');
  }
  
  const updated = await MysteryDrop.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  
  logger.logRequest(req, `Mystery drop updated: ${updated.brandName} by admin ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Mystery drop updated successfully',
    mysteryDrop: updated,
  });
});

// @desc    Delete mystery drop (admin)
// @route   DELETE /api/admin/mystery-drops/:id
// @access  Private (Admin only)
const deleteMysteryDropAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const mysteryDrop = await MysteryDrop.findById(id);
  if (!mysteryDrop) {
    throw new NotFoundError('Mystery drop not found');
  }
  
  // Delete all signups for this drop
  await MysteryDropSignup.deleteMany({ mysteryDrop: id });
  await mysteryDrop.deleteOne();
  
  logger.logRequest(req, `Mystery drop deleted: ${mysteryDrop.brandName} by admin ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Mystery drop deleted successfully',
  });
});

// @desc    Reveal mystery drop early (admin)
// @route   POST /api/admin/mystery-drops/:id/reveal
// @access  Private (Admin only)
const revealMysteryDropAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const mysteryDrop = await MysteryDrop.findById(id);
  if (!mysteryDrop) {
    throw new NotFoundError('Mystery drop not found');
  }
  
  if (mysteryDrop.isRevealed) {
    throw new BadRequestError('Mystery drop is already revealed');
  }
  
  mysteryDrop.isRevealed = true;
  mysteryDrop.revealedAt = new Date();
  await mysteryDrop.save();
  
  // Notify all signups
  const signups = await MysteryDropSignup.find({ mysteryDrop: id, notified: false });
  for (const signup of signups) {
    try {
      await sendMysteryRevealEmail(signup.email, signup.email.split('@')[0], mysteryDrop);
      signup.notified = true;
      signup.notifiedAt = new Date();
      await signup.save();
    } catch (error) {
      logger.error(`Failed to send reveal email to ${signup.email}: ${error.message}`);
    }
  }
  
  logger.logRequest(req, `Mystery drop revealed: ${mysteryDrop.brandName} by admin ${req.user.email}`);
  
  res.json({
    success: true,
    message: `Mystery drop revealed successfully. ${signups.length} users were notified.`,
    mysteryDrop,
  });
});

// @desc    Get mystery drop signups (admin)
// @route   GET /api/admin/mystery-drops/:id/signups
// @access  Private (Admin only)
const getMysteryDropSignupsAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  
  const signups = await MysteryDropSignup.find({ mysteryDrop: id })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
  const total = await MysteryDropSignup.countDocuments({ mysteryDrop: id });
  
  res.json({
    success: true,
    count: signups.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    signups,
  });
});

// @desc    Export mystery drop signups to CSV
// @route   GET /api/admin/mystery-drops/:id/export
// @access  Private (Admin only)
const exportMysteryDropSignups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const mysteryDrop = await MysteryDrop.findById(id);
  if (!mysteryDrop) {
    throw new NotFoundError('Mystery drop not found');
  }
  
  const signups = await MysteryDropSignup.find({ mysteryDrop: id })
    .populate('user', 'name email');
  
  let csv = 'Email,Name,Signup Date,Notified\n';
  for (const signup of signups) {
    csv += `"${signup.email}","${signup.user?.name || 'Guest'}","${signup.createdAt.toISOString()}","${signup.notified ? 'Yes' : 'No'}"\n`;
  }
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=mystery-drop-${mysteryDrop.brandSlug}-signups.csv`);
  res.send(csv);
});

module.exports = {
  // Public
  getAllMysteryDrops,
  getMysteryDrop,
  signupForReveal,
  // Admin
  getAllMysteryDropsAdmin,
  createMysteryDropAdmin,
  updateMysteryDropAdmin,
  deleteMysteryDropAdmin,
  revealMysteryDropAdmin,
  getMysteryDropSignupsAdmin,
  exportMysteryDropSignups,
};