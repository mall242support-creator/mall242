const mongoose = require('mongoose');

// Mystery Drop Signup Schema (for email signups)
const mysteryDropSignupSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  mysteryDrop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MysteryDrop',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  revealedAt: {
    type: Date,
    default: null,
  },
  hintRevealed: {
    type: Boolean,
    default: false,
  },
  ipAddress: String,
  userAgent: String,
  notified: {
    type: Boolean,
    default: false,
  },
  notifiedAt: Date,
}, {
  timestamps: true,
});

// Index for email + mysteryDrop uniqueness
mysteryDropSignupSchema.index({ email: 1, mysteryDrop: 1 }, { unique: true });

// Mystery Drop Campaign Schema
const mysteryDropSchema = new mongoose.Schema({
  // Brand Information
  brandName: {
    type: String,
    required: true,
  },
  brandSlug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  
  // Campaign Details
  clue: {
    type: String,
    required: true,
    maxlength: [200, 'Clue cannot exceed 200 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  
  // Images
  blurredImageUrl: {
    type: String,
    required: true,
  },
  revealImageUrl: {
    type: String,
    required: true,
  },
  brandLogoUrl: String,
  bannerUrl: String,
  
  // Timing
  revealDate: {
    type: Date,
    required: true,
    index: true,
  },
  isRevealed: {
    type: Boolean,
    default: false,
    index: true,
  },
  revealedAt: Date,
  
  // Email drip campaign
  emailHint: {
    type: String,
    maxlength: [300, 'Email hint cannot exceed 300 characters'],
  },
  emailSubject: String,
  emailTemplate: String,
  
  // Early Access for VIPs
  vipEarlyAccess: {
    type: Boolean,
    default: true,
  },
  vipEarlyAccessHours: {
    type: Number,
    default: 24,
  },
  
  // Deal Information (after reveal)
  deals: [{
    title: String,
    description: String,
    discountPercent: Number,
    discountCode: String,
    validUntil: Date,
    productLink: String,
  }],
  
  // Statistics
  signupCount: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  revealCount: {
    type: Number,
    default: 0,
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: String,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for signups
mysteryDropSchema.virtual('signups', {
  ref: 'MysteryDropSignup',
  localField: '_id',
  foreignField: 'mysteryDrop',
  count: true,
});

// Generate slug from brand name
mysteryDropSchema.pre('save', function(next) {
  if (this.isModified('brandName') && !this.brandSlug) {
    this.brandSlug = this.brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Auto-reveal if reveal date has passed
mysteryDropSchema.methods.checkAndReveal = async function() {
  const now = new Date();
  if (!this.isRevealed && this.revealDate <= now) {
    this.isRevealed = true;
    this.revealedAt = now;
    await this.save();
    
    // Trigger email notifications to signups
    await this.notifySignups();
    return true;
  }
  return false;
};

// Notify all signups about reveal
mysteryDropSchema.methods.notifySignups = async function() {
  const Signup = mongoose.model('MysteryDropSignup');
  const signups = await Signup.find({ 
    mysteryDrop: this._id, 
    notified: false 
  });
  
  // This would integrate with Brevo email service
  // Will implement in email controller
  console.log(`Would notify ${signups.length} signups about ${this.brandName}`);
  
  return signups.length;
};

// Get reveal info (with VIP early access check)
mysteryDropSchema.methods.getRevealInfo = function(isVIP = false) {
  const now = new Date();
  const revealTime = new Date(this.revealDate);
  
  if (this.isRevealed) {
    return {
      isRevealed: true,
      brandName: this.brandName,
      brandSlug: this.brandSlug,
      revealImageUrl: this.revealImageUrl,
      brandLogoUrl: this.brandLogoUrl,
      deals: this.deals,
      revealedAt: this.revealedAt,
    };
  }
  
  // Check VIP early access
  if (isVIP && this.vipEarlyAccess) {
    const vipRevealTime = new Date(revealTime);
    vipRevealTime.setHours(vipRevealTime.getHours() - this.vipEarlyAccessHours);
    
    if (now >= vipRevealTime) {
      return {
        isRevealed: true,
        brandName: this.brandName,
        brandSlug: this.brandSlug,
        revealImageUrl: this.revealImageUrl,
        brandLogoUrl: this.brandLogoUrl,
        deals: this.deals,
        revealedAt: vipRevealTime,
        isVIPEarlyAccess: true,
      };
    }
  }
  
  // Not revealed yet
  return {
    isRevealed: false,
    clue: this.clue,
    blurredImageUrl: this.blurredImageUrl,
    revealDate: this.revealDate,
    signupCount: this.signupCount,
    emailHint: this.emailHint,
  };
};

// Increment signup count
mysteryDropSchema.methods.incrementSignupCount = async function() {
  this.signupCount += 1;
  return this.save();
};

// Add these static methods to backend/src/models/MysteryDrop.js

// Get upcoming mystery drops
mysteryDropSchema.statics.getUpcoming = async function(limit = 6) {
  const now = new Date();
  return this.find({
    isActive: true,
    isRevealed: false,
    revealDate: { $gt: now },
  })
    .sort({ revealDate: 1 })
    .limit(limit);
};

// Get revealed mystery drops
mysteryDropSchema.statics.getRevealed = async function(limit = 10) {
  return this.find({
    isActive: true,
    isRevealed: true,
  })
    .sort({ revealedAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('MysteryDrop', mysteryDropSchema);
module.exports.MysteryDropSignup = mongoose.model('MysteryDropSignup', mysteryDropSignupSchema);