const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  subtitle: {
    type: String,
    maxlength: [200, 'Subtitle cannot exceed 200 characters'],
  },
  image: {
    type: String,
    required: [true, 'Please add an image URL'],
  },
  mobileImage: {
    type: String,
  },
  ctaText: {
    type: String,
    default: 'Shop Now',
  },
  ctaLink: {
    type: String,
    default: '/products',
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  buttonColor: {
    type: String,
    default: '#FFC72C',
  },
  textColor: {
    type: String,
    default: 'white',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('HeroSlide', heroSlideSchema);