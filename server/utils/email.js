// =====================================================
// BREVO HTTP EMAIL SERVICE
// =====================================================

// =====================================================
// VERIFY BREVO CONFIGURATION
// =====================================================

const verifyEmailConfig = async () => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error(
      "BREVO_API_KEY is not configured."
    );
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }

  const response = await fetch(
    "https://api.brevo.com/v3/account",
    {
      method: "GET",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Brevo configuration verification failed: ${errorText}`
    );
  }

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

  if (!process.env.BREVO_API_KEY) {
    throw new Error(
      "BREVO_API_KEY is not configured."
    );
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }

  const payload = {
    sender: {
      email: process.env.EMAIL_FROM,
      name:
        process.env.EMAIL_FROM_NAME ||
        "EnjoMeal",
    },

    to: [
      {
        email: to,
      },
    ],

    subject,

    textContent:
      text ||
      "Please view this email in an HTML-compatible email client.",

    ...(html
      ? { htmlContent: html }
      : {}),
  };

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",

      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  const responseText =
    await response.text();

  if (!response.ok) {
    console.error(
      "Brevo Email Error:",
      responseText
    );

    throw new Error(
      `Brevo email sending failed: ${responseText}`
    );
  }

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    result = {
      messageId: null,
      raw: responseText,
    };
  }

  console.log(
    `Email sent successfully via Brevo: ${
      result.messageId || "OK"
    }`
  );

  return result;
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  sendEmail,
  verifyEmailConfig,
};
