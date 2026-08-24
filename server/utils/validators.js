const mongoose = require("mongoose");

// ==========================================
// OBJECT ID VALIDATOR
// ==========================================
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// EMAIL VALIDATOR
// ==========================================
const isValidEmail = (email) => {
  if (typeof email !== "string") return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim().toLowerCase()
  );
};

// ==========================================
// PHONE VALIDATOR
// ==========================================
const isValidPhone = (phone) => {
  if (typeof phone !== "string") return false;

  const normalizedPhone = phone.replace(/\s+/g, "");

  return /^[6-9]\d{9}$/.test(normalizedPhone);
};

// ==========================================
// PINCODE VALIDATOR — INDIA
// ==========================================
const isValidPincode = (pincode) => {
  if (typeof pincode !== "string") return false;

  return /^\d{6}$/.test(pincode.trim());
};

// ==========================================
// PASSWORD VALIDATOR
// ==========================================
const isValidPassword = (password) => {
  if (typeof password !== "string") return false;

  return password.length >= 8;
};

// ==========================================
// POSITIVE NUMBER VALIDATOR
// ==========================================
const isPositiveNumber = (value) => {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
};

// ==========================================
// POSITIVE INTEGER VALIDATOR
// ==========================================
const isPositiveInteger = (value) => {
  return Number.isInteger(value) && value > 0;
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
  isValidObjectId,
  isValidEmail,
  isValidPhone,
  isValidPincode,
  isValidPassword,
  isPositiveNumber,
  isPositiveInteger,
};