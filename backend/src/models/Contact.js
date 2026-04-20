const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  orderNumber: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'read', 'replied', 'closed'],
    default: 'pending'
  },
  adminNote: { type: String },
  repliedAt: Date,
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);