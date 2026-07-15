const nodemailer = require('nodemailer');
const { EMAIL_PASSWORD, EMAIL_USER, EMAIL_PORT, EMAIL_HOST, EMAIL_SECURE } = require('../config/env');

const isEmailConfigured = () => Boolean(
  EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASSWORD
);

let transporter;
const getTransporter = () => {
  if (!isEmailConfigured()) {
    const error = new Error('Email service is not configured');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_SECURE, // false for 587, true for 465
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  },
  // Critical for cloud deployments like Render
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,   // 10 seconds
  socketTimeout: 15000,     // 15 seconds
  // TLS configuration for Gmail
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  },
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
  });
  return transporter;
};


const sendEmail = async (toOrOptions, subjectAttr, htmlAttr) => {
  let to, subject, html;

  if (typeof toOrOptions === 'object' && toOrOptions.to) {
    // Handle object signature
    ({ to, subject, html } = toOrOptions);
  } else {
    // Handle positional signature
    to = toOrOptions;
    subject = subjectAttr;
    html = htmlAttr;
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"HOCA Platform" <${EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    error.code = error.code || 'EMAIL_DELIVERY_FAILED';
    throw error;
  }
};

const verifyConnection = async () => {
  await getTransporter().verify();
  return true;
};

module.exports = {
  sendEmail,
  isEmailConfigured,
  verifyConnection
};
