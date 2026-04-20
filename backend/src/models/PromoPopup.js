const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  buttonText: {
    type: String,
    default: 'Shop Now',
  },
  buttonLink: {
    type: String,
    default: '/products',
  },
  discountCode: {
    type: String,
    default: '',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  showOncePerSession: {
    type: Boolean,
    default: true,
  },
  delaySeconds: {
    type: Number,
    default: 3,
  },
  backgroundColor: {
    type: String,
    default: '#00A9B0',
  },
  textColor: {
    type: String,
    default: '#ffffff',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PromoPopup', promoSchema);