const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Restaurant = require("../models/restaurant");
const Delivery = require("../models/deliveryModel");

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
};