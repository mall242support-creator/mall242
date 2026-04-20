const Contact = require('../models/Contact');
const { sendEmail } = require('../config/brevo');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message, orderNumber } = req.body;

  const contact = await Contact.create({
    name,
    email,
    phone,
    subject,
    message,
    orderNumber,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Send notification email to admin
  await sendEmail({
    to: process.env.ADMIN_EMAIL || 'admin@mall242.com',
    subject: `New Contact Form Submission: ${subject}`,
    htmlContent: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Order Number:</strong> ${orderNumber || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  });

  // Send auto-reply to user
  await sendEmail({
    to: email,
    subject: 'We received your message - Mall242 Support',
    htmlContent: `
      <h2>Thank you for contacting us, ${name}!</h2>
      <p>We have received your message and will get back to you within 24 hours.</p>
      <p>Your reference number: ${contact._id}</p>
      <p>Best regards,<br>Mall242 Support Team</p>
    `,
  });

  logger.logRequest(req, `Contact form submitted by ${email}`);

  res.json({
    success: true,
    message: 'Your message has been sent successfully!',
  });
});

// @desc    Get all contact messages (admin)
// @route   GET /api/admin/contact
// @access  Private (Admin only)
const getContactMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  const messages = await Contact.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Contact.countDocuments(query);

  res.json({
    success: true,
    count: messages.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    messages,
  });
});

// @desc    Get single contact message
// @route   GET /api/admin/contact/:id
// @access  Private (Admin only)
const getContactMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const message = await Contact.findById(id);
  if (!message) {
    throw new NotFoundError('Message not found');
  }

  // Mark as read if not already
  if (message.status === 'pending') {
    message.status = 'read';
    await message.save();
  }

  res.json({
    success: true,
    message,
  });
});

// @desc    Reply to contact message
// @route   POST /api/admin/contact/:id/reply
// @access  Private (Admin only)
const replyToContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reply, closeTicket } = req.body;

  const contact = await Contact.findById(id);
  if (!contact) {
    throw new NotFoundError('Message not found');
  }

  // Send reply email
  await sendEmail({
    to: contact.email,
    subject: `Re: ${contact.subject} - Mall242 Support`,
    htmlContent: `
      <h2>Reply from Mall242 Support</h2>
      <p>Dear ${contact.name},</p>
      <p>${reply}</p>
      <p>Best regards,<br>Mall242 Support Team</p>
    `,
  });

  contact.status = closeTicket ? 'closed' : 'replied';
  contact.adminNote = reply;
  contact.repliedAt = new Date();
  contact.repliedBy = req.user._id;
  await contact.save();

  logger.logRequest(req, `Replied to contact message ${id} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Reply sent successfully',
  });
});

// @desc    Delete contact message
// @route   DELETE /api/admin/contact/:id
// @access  Private (Admin only)
const deleteContactMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const message = await Contact.findById(id);
  if (!message) {
    throw new NotFoundError('Message not found');
  }

  await message.deleteOne();

  res.json({
    success: true,
    message: 'Message deleted successfully',
  });
});

module.exports = {
  submitContactForm,
  getContactMessages,
  getContactMessage,
  replyToContact,
  deleteContactMessage,
};