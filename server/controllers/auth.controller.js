const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/user");
const Restaurant = require("../models/restaurant");
const Delivery = require("../models/deliveryModel");
const {
  sendEmail,
} = require("../utils/email");

// ===============================
// HELPERS
// ===============================

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const sanitizeUser = (user) => {
  const userObject = user.toObject
    ? user.toObject()
    : { ...user };

  delete userObject.password;

  return userObject;
};

// ===============================
// REGISTER USER
// ===============================

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = "customer",

      // Restaurant fields
      restaurantName,
      ownerName,
      address,
      city,
      state,
      pincode,
      cuisine,

      // Delivery fields
      vehicleType,
      vehicleNumber,
    } = req.body;

    // ===============================
    // BASIC VALIDATION
    // ===============================

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters.",
      });
    }

    // ===============================
    // ROLE VALIDATION
    // ===============================

    const allowedRoles = [
      "customer",
      "restaurant",
      "delivery",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role.",
      });
    }

    // ===============================
    // RESTAURANT VALIDATION
    // ===============================

    if (role === "restaurant") {
      if (
        !restaurantName ||
        !ownerName ||
        !phone ||
        !address ||
        !city ||
        !state ||
        !pincode
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Restaurant name, owner name, phone, address, city, state and pincode are required.",
        });
      }
    }

    // ===============================
    // DELIVERY VALIDATION
    // ===============================

    if (role === "delivery") {
      if (!phone) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number is required for delivery registration.",
        });
      }
    }

    // ===============================
    // CHECK EXISTING EMAIL
    // ===============================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    // ===============================
    // CHECK EXISTING PHONE
    // ===============================

    if (phone) {
      const existingPhone = await User.findOne({
        phone: phone.trim(),
      });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this phone number already exists.",
        });
      }
    }

    // ===============================
    // HASH PASSWORD
    // ===============================

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // ===============================
    // APPROVAL STATUS
    // ===============================

    const approvalStatus =
      role === "customer"
        ? "APPROVED"
        : "PENDING";

    const isActive =
      role === "customer";

    // ===============================
    // CREATE USER
    // ===============================

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone
        ? phone.trim()
        : undefined,
      role,
      approvalStatus,
      isActive,
    });

    // ===============================
    // CREATE RESTAURANT PROFILE
    // ===============================

    if (role === "restaurant") {
      try {
        const restaurant =
          await Restaurant.create({
            owner: user._id,

            name: restaurantName.trim(),

            ownerName: ownerName.trim(),

            email: normalizedEmail,

            phone: phone.trim(),

            address: address.trim(),

            city: city.trim(),

            state: state.trim(),

            pincode: pincode.trim(),

            cuisine:
              Array.isArray(cuisine)
                ? cuisine
                : cuisine
                ? [cuisine]
                : [],

            approvalStatus: "PENDING",

            isActive: false,
          });

        return res.status(201).json({
          success: true,

          message:
            "Restaurant registration submitted successfully. Waiting for admin approval.",

          user: sanitizeUser(user),

          restaurant,
        });
      } catch (restaurantError) {
        // Rollback user if restaurant creation fails
        await User.findByIdAndDelete(
          user._id
        );

        console.error(
          "Restaurant Registration Error:",
          restaurantError
        );

        // SHOW ACTUAL DATABASE ERROR
        return res.status(500).json({
          success: false,
          message:
            restaurantError.message ||
            "Restaurant profile creation failed.",

          error:
            process.env.NODE_ENV === "production"
              ? undefined
              : restaurantError.name,
        });
      }
    }

    // ===============================
    // CREATE DELIVERY PROFILE
    // ===============================

    if (role === "delivery") {
      try {
        const delivery =
          await Delivery.create({
            user: user._id,

            name: name.trim(),

            phone: phone.trim(),

            email: normalizedEmail,

            vehicleType:
              vehicleType || "BIKE",

            vehicleNumber: vehicleNumber
              ? vehicleNumber
                  .trim()
                  .toUpperCase()
              : undefined,

            isAvailable: false,

            isActive: false,
          });

        return res.status(201).json({
          success: true,

          message:
            "Delivery registration submitted successfully. Waiting for admin approval.",

          user: sanitizeUser(user),

          delivery,
        });
      } catch (deliveryError) {
        // Rollback user if delivery creation fails
        await User.findByIdAndDelete(
          user._id
        );

        console.error(
          "Delivery Registration Error:",
          deliveryError
        );

        return res.status(500).json({
          success: false,

          message:
            deliveryError.message ||
            "Delivery profile creation failed.",
        });
      }
    }

    // ===============================
    // CUSTOMER RESPONSE
    // ===============================

    return res.status(201).json({
      success: true,

      message:
        "User registered successfully.",

      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Register Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Registration failed.",
    });
  }
};

// ===============================
// FORGOT PASSWORD
// ===============================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
      role: {
        $in: ["customer", "restaurant"],
      },
    }).select(
      "+resetPasswordOTPHash +resetPasswordOTPExpires"
    );

    // Do not reveal whether account exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      });
    }

    // =================================================
    // GENERATE 6 DIGIT OTP
    // =================================================

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // =================================================
    // HASH OTP
    // =================================================

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // OTP valid for 10 minutes
    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    user.resetPasswordOTPHash =
      otpHash;

    user.resetPasswordOTPExpires =
      otpExpires;

    await user.save();

    // =================================================
    // SEND OTP EMAIL
    // =================================================

    await sendEmail({
      to: user.email,

      subject:
        "EnjoMeal Password Reset OTP",

      text: `Your EnjoMeal password reset OTP is ${otp}. This OTP will expire in 10 minutes.`,

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #e85d04;">
            EnjoMeal Password Reset
          </h2>

          <p>
            Hello ${user.name},
          </p>

          <p>
            We received a request to reset your EnjoMeal account password.
          </p>

          <p>
            Your verification OTP is:
          </p>

          <div style="
            font-size: 30px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>
            This OTP will expire in <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request a password reset,
            you can safely ignore this email.
          </p>

          <p>
            Regards,<br />
            EnjoMeal Team
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset OTP has been sent.",
    });
  } catch (error) {
    console.error(
      "Forgot Password Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request.",
    });
  }
};

// ===============================
// VERIFY PASSWORD RESET OTP
// ===============================

const verifyResetOTP = async (req, res) => {
  try {
    const {
      email,
      otp,
    } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Email and OTP are required.",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
      role: {
        $in: ["customer", "restaurant"],
      },
    }).select(
      "+resetPasswordOTPHash +resetPasswordOTPExpires"
    );

    if (
      !user ||
      !user.resetPasswordOTPHash ||
      !user.resetPasswordOTPExpires
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP.",
      });
    }

    // =================================================
    // CHECK EXPIRY
    // =================================================

    if (
      user.resetPasswordOTPExpires.getTime() <
      Date.now()
    ) {
      user.resetPasswordOTPHash = null;
      user.resetPasswordOTPExpires = null;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    // =================================================
    // HASH PROVIDED OTP
    // =================================================

    const otpHash = crypto
      .createHash("sha256")
      .update(String(otp).trim())
      .digest("hex");

    // =================================================
    // COMPARE OTP
    // =================================================

    const storedOTPHash =
      String(user.resetPasswordOTPHash);

    const otpValid =
      storedOTPHash.length === otpHash.length &&
      crypto.timingSafeEqual(
        Buffer.from(otpHash),
        Buffer.from(storedOTPHash)
      );

    if (!otpValid) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP.",
      });
    }

    // =================================================
    // CREATE SHORT-LIVED RESET TOKEN
    // =================================================

    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET is not configured"
      );
    }

    const resetToken = jwt.sign(
      {
        id: user._id.toString(),
        purpose: "PASSWORD_RESET",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error(
      "Verify Reset OTP Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify OTP.",
    });
  }
};

// ===============================
// RESET PASSWORD
// CUSTOMER / USER
// ===============================

const resetPassword = async (req, res) => {
  try {
    const {
      resetToken,
      newPassword,
    } = req.body;

    if (
      !resetToken ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token and new password are required.",
      });
    }

    // =================================================
    // PASSWORD VALIDATION
    // =================================================

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters.",
      });
    }

    // =================================================
    // VERIFY RESET TOKEN
    // =================================================

    let decoded;

    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET
      );
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message:
          "Reset session has expired. Please request a new OTP.",
      });
    }

    if (
      decoded.purpose !==
      "PASSWORD_RESET"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid password reset token.",
      });
    }

    // =================================================
    // FIND USER
    // =================================================

    const user =
      await User.findById(
        decoded.id
      ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account no longer exists.",
      });
    }

    // Public OTP reset is currently enabled
    // for customer and restaurant accounts.
    // Admin uses separate admin-only endpoint.
    // Delivery recovery is not enabled yet.
    if (
      !["customer", "restaurant"].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Password reset is not available for this account type.",
      });
    }

    // =================================================
    // HASH NEW PASSWORD
    // =================================================

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.password =
      hashedPassword;

    // =================================================
    // INVALIDATE OTP
    // =================================================

    user.resetPasswordOTPHash = null;
    user.resetPasswordOTPExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset Password Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reset password.",
    });
  }
};
// ===============================
// LOGIN USER
// ===============================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    // ===============================
    // FIND USER
    // ===============================

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    // ===============================
    // ACTIVE CHECK
    // ===============================

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });
    }

    // ===============================
    // APPROVAL CHECK
    // ===============================

    if (
      ["restaurant", "delivery"].includes(
        user.role
      ) &&
      user.approvalStatus !==
        "APPROVED"
    ) {
      return res.status(403).json({
        success: false,
        message: `Your ${user.role} account is ${user.approvalStatus.toLowerCase()}. Please wait for admin approval.`,
      });
    }

    // ===============================
    // PASSWORD CHECK
    // ===============================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    // ===============================
    // UPDATE LAST LOGIN
    // ===============================

    user.lastLoginAt =
      new Date();

    await user.save();

    // ===============================
    // JWT
    // ===============================

    const token =
      generateToken(user);

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      token,

      user:
        sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Login failed.",
    });
  }
};

// ===============================
// GET PROFILE
// ===============================

const profile = async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user.id
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch profile.",
    });
  }
};

// ===============================
// RESET USER PASSWORD
// ADMIN ONLY
// ===============================

const resetUserPassword = async (
  req,
  res
) => {
  try {
    const {
      userId,
    } = req.params;

    const {
      newPassword,
    } = req.body;

    if (
      !userId ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID and new password are required.",
      });
    }

    if (
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters.",
      });
    }

    const user =
      await User.findById(
        userId
      ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.password =
      hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully.",
    });
  } catch (error) {
    console.error(
      "Reset Password Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reset password.",
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  register,
  login,
  profile,
  resetUserPassword,

  forgotPassword,
  verifyResetOTP,
  resetPassword,
};
