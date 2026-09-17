const { Resend } = require("resend");

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const verifyEmailConfig = async () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not configured."
    );
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }

  return true;
};

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

  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not configured."
    );
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }

  const { data, error } =
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text:
        text ||
        "Please view this email in an HTML-compatible email client.",
      ...(html ? { html } : {}),
    });

  if (error) {
    console.error(
      "Resend Email Error:",
      error.message || error
    );

    throw new Error(
      "Failed to send email."
    );
  }

  console.log(
    `Email sent successfully: ${data?.id || "accepted"}`
  );

  return data;
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
};
