const SibApiV3Sdk = require('@sendinblue/client');
const logger = require('../utils/logger');

// Initialize Brevo API client
let apiInstance = null;
let transactionalEmailsApi = null;

const initBrevo = () => {
  if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'your_brevo_api_key_here') {
    logger.warn('BREVO_API_KEY not set or is placeholder. Email service will use test mode.');
    return null;
  }

  try {
    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    transactionalEmailsApi = apiInstance;
    logger.info('✅ Brevo email service initialized');
    return transactionalEmailsApi;
  } catch (error) {
    logger.error(`Brevo initialization failed: ${error.message}`);
    return null;
  }
};

// Professional Email Template
const getEmailTemplate = (content, title, buttonText = null, buttonLink = null) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Mall242</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      background-color: #f4f6f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #00A9B0 0%, #008c92 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      max-width: 160px;
      margin-bottom: 16px;
    }
    .header-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    .content {
      padding: 40px 32px;
      background: #ffffff;
    }
    .footer {
      background: #f8f9fa;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      color: #6c757d;
      font-size: 12px;
      margin: 8px 0;
    }
    .social-links {
      margin: 16px 0 8px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #00A9B0;
      text-decoration: none;
      font-size: 20px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #FFC72C 0%, #e5b300 100%);
      color: #1a1a2e;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      transition: all 0.3s ease;
    }
    .button-teal {
      background: linear-gradient(135deg, #00A9B0 0%, #008c92 100%);
      color: #ffffff;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
      margin: 24px 0;
    }
    .order-summary {
      background: #f8f9fa;
      border-radius: 16px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .order-item:last-child {
      border-bottom: none;
    }
    .code-box {
      background: #00A9B0;
      color: white;
      border-radius: 12px;
      padding: 16px;
      font-family: monospace;
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 2px;
      margin: 16px 0;
    }
    .text-center { text-align: center; }
    .text-muted { color: #6c757d; font-size: 14px; }
    @media (max-width: 480px) {
      .content { padding: 24px 20px; }
      .header-title { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="email-container">
      <div class="header">
        <img src="${process.env.FRONTEND_URL || 'https://mall242.com'}/mall242logo.jpeg" alt="Mall242" class="logo" style="max-width: 150px;">
        <h1 class="header-title">${title}</h1>
      </div>
      <div class="content">
        ${content}
        ${buttonText && buttonLink ? `<div class="text-center"><a href="${buttonLink}" class="button">${buttonText}</a></div>` : ''}
      </div>
      <div class="footer">
        <div class="social-links">
          <a href="#">📘</a>
          <a href="#">📸</a>
          <a href="#">🐦</a>
          <a href="#">💬</a>
        </div>
        <p>Mall242 - Bahamas' Premier Digital Mall</p>
        <p>123 Bay Street, Nassau, Bahamas</p>
        <p>📧 ${process.env.BREVO_SENDER_EMAIL || 'hello@mall242.com'} | 📞 +1-242-555-0123</p>
        <p>© ${new Date().getFullYear()} Mall242. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async (options) => {
  if (!transactionalEmailsApi) {
    initBrevo();
    if (!transactionalEmailsApi) {
      console.error('❌ Brevo not initialized.');
      return { success: false, error: 'Email service not configured' };
    }
  }

  try {
    const { to, toName, subject, htmlContent, textContent } = options;
    console.log(`📧 Sending email to: ${to} | Subject: ${subject}`);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to, name: toName || to.split('@')[0] }];
    sendSmtpEmail.sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'hello@mall242.com',
      name: process.env.BREVO_SENDER_NAME || 'Mall242',
    };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    if (textContent) sendSmtpEmail.textContent = textContent;

    const response = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent successfully to ${to}`);
    return { success: true, messageId: response.body.messageId };
  } catch (error) {
    console.error(`❌ Email send failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = async (user) => {
  const content = `
    <h2 style="color: #1a1a2e; margin-bottom: 16px;">Welcome to Mall242, ${user.name}! 👋</h2>
    <p style="margin-bottom: 16px;">Thank you for joining the Bahamas' premier digital marketplace. We're excited to have you on board!</p>
    
    <div style="background: linear-gradient(135deg, #f0f7f7 0%, #ffffff 100%); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="font-size: 14px; color: #6c757d; margin-bottom: 8px;">Your Exclusive Referral Code</p>
      <div class="code-box">${user.referralCode}</div>
      <p style="font-size: 14px; margin-top: 12px;">Share this code with friends and earn amazing rewards!</p>
    </div>
    
    <h3 style="margin: 24px 0 16px;">✨ What you can do:</h3>
    <ul style="margin-bottom: 24px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">🛍️ Shop thousands of products from top brands</li>
      <li style="margin-bottom: 8px;">👑 Earn VIP rewards by referring friends</li>
      <li style="margin-bottom: 8px;">🎁 Get early access to exclusive deals</li>
      <li style="margin-bottom: 8px;">🚚 Free shipping on orders over $50</li>
    </ul>
  `;
  
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: '🎉 Welcome to Mall242! Start Your Shopping Journey',
    htmlContent: getEmailTemplate(content, 'Welcome to Mall242!', 'Start Shopping', `${process.env.FRONTEND_URL}/products`),
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const content = `
    <h2 style="color: #1a1a2e; margin-bottom: 16px;">Reset Your Password 🔐</h2>
    <p style="margin-bottom: 16px;">Hello ${user.name},</p>
    <p style="margin-bottom: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
    
    <div style="background: #e8f4f8; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
      <p style="font-size: 12px; margin-bottom: 8px;">Or copy this link:</p>
      <p style="font-size: 12px; word-break: break-all; color: #00A9B0;">${resetUrl}</p>
    </div>
    
    <p class="text-muted" style="color: #e74c3c;">⚠️ This link expires in 10 minutes for security reasons.</p>
    <p class="text-muted">If you didn't request this, please ignore this email.</p>
  `;
  
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: '🔐 Reset Your Mall242 Password',
    htmlContent: getEmailTemplate(content, 'Reset Password', 'Reset Password', resetUrl),
  });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items.map(item => `
    <div class="order-item">
      <div><strong>${item.name}</strong> x ${item.quantity}</div>
      <div><strong>$${(item.price * item.quantity).toFixed(2)}</strong></div>
    </div>
  `).join('');
  
  const content = `
    <h2 style="color: #1a1a2e; margin-bottom: 16px;">Thank You for Your Order! 🎉</h2>
    <p>Hi ${user.name}, we've received your order and it's now being processed.</p>
    
    <div style="background: #00A9B0; color: white; padding: 16px; border-radius: 16px; text-align: center; margin: 24px 0;">
      <p style="font-size: 12px;">Order Number</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${order.orderNumber}</p>
    </div>
    
    <div class="order-summary">
      <h3 style="margin-bottom: 16px;">Order Summary</h3>
      ${itemsHtml}
      <div class="divider" style="margin: 16px 0;"></div>
      <div class="order-item">
        <span>Subtotal</span>
        <span>$${order.subtotal.toFixed(2)}</span>
      </div>
      <div class="order-item">
        <span>Shipping</span>
        <span>${order.shippingCost === 0 ? 'Free' : `$${order.shippingCost.toFixed(2)}`}</span>
      </div>
      <div class="order-item">
        <span>Tax (7.5%)</span>
        <span>$${order.tax.toFixed(2)}</span>
      </div>
      <div class="order-item" style="border-top: 2px solid #00A9B0; margin-top: 8px; padding-top: 16px;">
        <strong>Total</strong>
        <strong style="color: #00A9B0; font-size: 20px;">$${order.total.toFixed(2)}</strong>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: `✅ Order Confirmed #${order.orderNumber}`,
    htmlContent: getEmailTemplate(content, 'Order Confirmed!', 'Track Order', `${process.env.FRONTEND_URL}/orders/${order._id}`),
  });
};

module.exports = {
  initBrevo,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};