const nodemailer = require("nodemailer");

// =====================================================
// SMTP CONFIGURATION
// =====================================================

const smtpPort = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",

  port: smtpPort,

  secure:
    String(process.env.SMTP_SECURE).toLowerCase() ===
    "true",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// =====================================================
// VERIFY SMTP CONFIGURATION
// =====================================================

const verifyEmailConfig = async () => {
  if (!process.env.SMTP_USER) {
    throw new Error(
      "SMTP_USER is not configured."
    );
  }

  if (!process.env.SMTP_PASS) {
    throw new Error(
      "SMTP_PASS is not configured."
    );
  }

  if (!process.env.SMTP_HOST) {
    throw new Error(
      "SMTP_HOST is not configured."
    );
  }

  await transporter.verify();

  return true;
};

// =====================================================
// SEND EMAIL
// =====================================================

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!to) {
    throw new Error(
      "Email recipient is required."
    );
  }

  if (!subject) {
    throw new Error(
      "Email subject is required."
    );
  }

  const mailOptions = {
    from:
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER,

    to,

    subject,

    text:
      text ||
      "Please view this email in an HTML-compatible email client.",

    ...(html ? { html } : {}),
  };

  const info =
    await transporter.sendMail(
      mailOptions
    );

  console.log(
    `Email sent successfully: ${info.messageId}`
  );

  return info;
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  sendEmail,
  verifyEmailConfig,
};
