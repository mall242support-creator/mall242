const User = require('../models/User');
const Referral = require('../models/Referral');
const Reward = require('../models/Reward');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/generateToken');
const { asyncHandler, BadRequestError, UnauthorizedError, NotFoundError } = require('../middleware/errorHandler');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../config/brevo');
const logger = require('../utils/logger');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, referralCode, subscribeNewsletter } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new BadRequestError('User already exists with this email');
  }

  const user = await User.create({
    name,
    email,
    password,
    preferences: { newsletter: subscribeNewsletter || true },
  });

  user.referralCode = user.generateReferralCode();
  
  if (referralCode) {
    const referringUser = await User.findOne({ referralCode });
    if (referringUser) {
      user.referredBy = referringUser._id;
      referringUser.referralCount += 1;
      referringUser.updateRewardTier();
      await referringUser.save();
      
      await Referral.create({
        referrer: referringUser._id,
        referredUser: user._id,
        referralCode,
        referredEmail: email,
        status: 'signed_up',
        signedUpAt: new Date(),
      });
      
      if (referringUser.rewardTier >= 1) {
        const rewardTier = referringUser.rewardTier;
        const reward = Reward.getRewardByTier(rewardTier);
        if (reward) {
          await Reward.createReward(referringUser._id, rewardTier, reward.type, reward.value, {}, 'referral');
        }
      }
    }
  }

  await user.save();

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  try {
    await sendWelcomeEmail(user);
  } catch (emailError) {
    console.error('Welcome email failed:', emailError.message);
  }

  logger.logAuth(email, 'register', true);

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      isVIP: user.vipStatus,
    },
    message: 'Registration successful',
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    logger.logAuth(email, 'login', false, { reason: 'User not found' });
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordMatch = await user.matchPassword(password);
  
  if (!isPasswordMatch) {
    logger.logAuth(email, 'login', false, { reason: 'Invalid password' });
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated. Please contact support.');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);
  const cookieOptions = {};
  if (rememberMe) {
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
  }
  setTokenCookie(res, token, cookieOptions);

  logger.logAuth(email, 'login', true);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      rewardTier: user.rewardTier,
      vipStatus: user.vipStatus,
      earlyAccessGranted: user.earlyAccessGranted,
      createdAt: user.createdAt,
    },
    message: 'Login successful',
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  logger.logAuth(req.user?.email, 'logout', true);
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('referredBy', 'name email referralCode');

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const referralStats = await Referral.getReferralStats(user._id);
  const activeRewards = await Reward.getActiveRewards(user._id);

  res.json({
    success: true,
    data: { ...user.toObject(), referralStats, activeRewards },
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, preferences } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (preferences) {
    user.preferences = { ...user.preferences, ...preferences };
  }

  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferences: user.preferences,
    },
    message: 'Profile updated successfully',
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  logger.logAuth(user.email, 'change_password', true);

  res.json({ success: true, message: 'Password changed successfully' });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch (emailError) {
    console.error('Password reset email failed:', emailError.message);
  }

  logger.logAuth(email, 'forgot_password', true);

  res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  logger.logAuth(user.email, 'reset_password', true);

  res.json({ success: true, message: 'Password reset successful' });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Email verified successfully' });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.isEmailVerified) {
    return res.json({ success: true, message: 'If your email is not verified, a new link has been sent' });
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  res.json({ success: true, message: 'Verification email sent' });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};