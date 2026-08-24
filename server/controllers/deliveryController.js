const mongoose = require("mongoose");
const Delivery = require("../models/deliveryModel");
const Order = require("../models/orderModel");
const User = require("../models/User");

// =====================================================
// HELPER: VALIDATE OBJECT ID
// =====================================================
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// CREATE DELIVERY PARTNER
// ADMIN ONLY
// =====================================================
const createDeliveryController = async (req, res) => {
  try {
    const {
      user,
      name,
      phone,
      email,
      vehicleType,
      vehicleNumber,
    } = req.body;

    // Validation
    if (!user || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "User, name and phone are required",
      });
    }

    if (!isValidObjectId(user)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // =================================================
    // CHECK LINKED USER
    // =================================================
    const linkedUser = await User.findById(user);

    if (!linkedUser) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (linkedUser.role !== "delivery") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a delivery user",
      });
    }

    if (!linkedUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // =================================================
    // PREVENT DUPLICATE USER PROFILE
    // =================================================
    const existingByUser = await Delivery.findOne({
      user: user,
    });

    if (existingByUser) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery profile already exists for this user",
      });
    }

    // =================================================
    // PHONE UNIQUENESS
    // =================================================
    const existingByPhone = await Delivery.findOne({
      phone: phone,
    });

    if (existingByPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery partner already exists with this phone",
      });
    }

    // =================================================
    // EMAIL UNIQUENESS
    // =================================================
    const normalizedEmail = email
      ? email.toLowerCase().trim()
      : undefined;

    if (normalizedEmail) {
      const existingByEmail =
        await Delivery.findOne({
          email: normalizedEmail,
        });

      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery partner already exists with this email",
        });
      }
    }

    // =================================================
    // CREATE DELIVERY PROFILE
    // =================================================
    const delivery = await Delivery.create({
      user: user,
      name: name.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      vehicleType: vehicleType || "BIKE",
      vehicleNumber: vehicleNumber
        ? vehicleNumber.trim()
        : undefined,

      // New delivery partner starts unavailable
      isAvailable: false,

      // Profile active by default
      isActive: true,
    });

    // =================================================
    // POPULATE USER
    // =================================================
    await delivery.populate(
      "user",
      "name email phone role approvalStatus isActive"
    );

    return res.status(201).json({
      success: true,
      message:
        "Delivery partner created successfully",
      delivery,
    });
  } catch (error) {
    console.error(
      "Create Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Create Delivery API",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL DELIVERY PARTNERS
// ADMIN ONLY
// =====================================================
const getAllDeliveryController = async (
  req,
  res
) => {
  try {
    const deliveries =
      await Delivery.find()
        .populate(
          "user",
          "name email phone role approvalStatus isActive"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      totalDeliveries:
        deliveries.length,
      message:
        "All delivery partners fetched successfully",
      deliveries,
    });
  } catch (error) {
    console.error(
      "Get All Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Get All Delivery API",
      error: error.message,
    });
  }
};

// =====================================================
// GET AVAILABLE DELIVERY PARTNERS
// RESTAURANT / ADMIN
// =====================================================
const getAvailableDeliveryController = async (
  req,
  res
) => {
  try {
    const deliveries =
      await Delivery.find({
        isActive: true,
        isAvailable: true,
      })
        .populate(
          "user",
          "name email phone role approvalStatus isActive"
        )
        .sort({
          name: 1,
        });

    // =================================================
    // ONLY RETURN DELIVERY PARTNERS WHOSE USER
    // ACCOUNT IS ALSO ACTIVE
    // =================================================
    const availableDeliveries =
      deliveries.filter(
        (delivery) => {
          return (
            delivery.user &&
            delivery.user.role === "delivery" &&
            delivery.user.isActive === true
          );
        }
      );

    return res.status(200).json({
      success: true,
      totalDeliveries:
        availableDeliveries.length,
      message:
        "Available delivery partners fetched successfully",
      deliveries:
        availableDeliveries,
    });
  } catch (error) {
    console.error(
      "Get Available Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Get Available Delivery API",
      error: error.message,
    });
  }
};

// =====================================================
// GET ASSIGNED ORDERS
// DELIVERY PARTNER / ADMIN
// =====================================================
const getAssignedOrdersController = async (
  req,
  res
) => {
  try {
    let delivery;

    // =================================================
    // DELIVERY PARTNER
    // OWN PROFILE ONLY
    // =================================================
    if (req.user.role === "delivery") {
      delivery =
        await Delivery.findOne({
          user: req.user.id,
        });
    }

    // =================================================
    // ADMIN
    // CAN REQUEST A SPECIFIC DELIVERY PARTNER
    // =================================================
    if (req.user.role === "admin") {
      const {
        deliveryPartnerId,
      } = req.params;

      if (
        !isValidObjectId(
          deliveryPartnerId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery partner ID",
        });
      }

      delivery =
        await Delivery.findById(
          deliveryPartnerId
        );
    }

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery profile not found",
      });
    }

    if (!delivery.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Delivery partner account is inactive",
      });
    }

    // =================================================
    // FETCH ASSIGNED ORDERS
    // =================================================
    const orders =
      await Order.find({
        deliveryPartner:
          delivery._id,
      })
        .populate(
          "user",
          "name email phone"
        )
        .populate("restaurant")
        .populate("items.food")
        .populate(
          "deliveryPartner"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      message:
        "Assigned orders fetched successfully",
      totalOrders:
        orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Get Assigned Orders Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Get Assigned Orders API",
      error: error.message,
    });
  }
};
// =====================================================
// GET SINGLE DELIVERY PARTNER
// ADMIN / DELIVERY PARTNER
// =====================================================
const getSingleDeliveryController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID",
      });
    }

    const delivery =
      await Delivery.findById(id).populate(
        "user",
        "name email phone role approvalStatus isActive"
      );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery partner not found",
      });
    }

    // =================================================
    // DELIVERY PARTNER CAN SEE OWN PROFILE ONLY
    // =================================================
    if (
      req.user.role === "delivery" &&
      delivery.user &&
      delivery.user._id.toString() !==
        req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only view your own profile.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Delivery partner fetched successfully",
      delivery,
    });
  } catch (error) {
    console.error(
      "Get Single Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Get Single Delivery API",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE DELIVERY PARTNER
// ADMIN ONLY
// =====================================================
const updateDeliveryController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID",
      });
    }

    const {
      name,
      phone,
      email,
      vehicleType,
      vehicleNumber,
    } = req.body;

    const delivery =
      await Delivery.findById(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery partner not found",
      });
    }

    // =================================================
    // UPDATE NAME
    // =================================================
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot be empty",
        });
      }

      delivery.name = name.trim();
    }

    // =================================================
    // PHONE UNIQUENESS
    // =================================================
    if (
      phone !== undefined &&
      phone !== delivery.phone
    ) {
      if (!phone.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Phone cannot be empty",
        });
      }

      const existingPhone =
        await Delivery.findOne({
          phone: phone.trim(),
          _id: { $ne: id },
        });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number already exists",
        });
      }

      delivery.phone =
        phone.trim();
    }

    // =================================================
    // EMAIL UNIQUENESS
    // =================================================
    if (email !== undefined) {
      const normalizedEmail =
        email
          ? email.toLowerCase().trim()
          : undefined;

      if (
        normalizedEmail &&
        normalizedEmail !==
          delivery.email
      ) {
        const existingEmail =
          await Delivery.findOne({
            email: normalizedEmail,
            _id: { $ne: id },
          });

        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message:
              "Email already exists",
          });
        }
      }

      delivery.email =
        normalizedEmail;
    }

    // =================================================
    // VEHICLE TYPE
    // =================================================
    if (vehicleType !== undefined) {
      delivery.vehicleType =
        vehicleType;
    }

    // =================================================
    // VEHICLE NUMBER
    // =================================================
    if (
      vehicleNumber !== undefined
    ) {
      delivery.vehicleNumber =
        vehicleNumber
          ? vehicleNumber
              .trim()
          : undefined;
    }

    await delivery.save();

    // =================================================
    // POPULATE USER
    // =================================================
    await delivery.populate(
      "user",
      "name email phone role approvalStatus isActive"
    );

    return res.status(200).json({
      success: true,
      message:
        "Delivery partner updated successfully",
      delivery,
    });
  } catch (error) {
    console.error(
      "Update Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Update Delivery API",
      error: error.message,
    });
  }
};
// =====================================================
// DELETE DELIVERY PARTNER
// ADMIN ONLY
// =====================================================
const deleteDeliveryController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID",
      });
    }

    const delivery =
      await Delivery.findById(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery partner not found",
      });
    }

    // =================================================
    // DON'T DELETE WHILE ACTIVE ORDER IS ASSIGNED
    // =================================================
    const activeOrders =
      await Order.countDocuments({
        deliveryPartner:
          delivery._id,
        orderStatus: {
          $in: [
            "READY",
            "OUT_FOR_DELIVERY",
          ],
        },
      });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery partner cannot be deleted while an active order is assigned",
      });
    }

    await Delivery.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Delivery partner deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Delete Delivery API",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE OWN AVAILABILITY
// DELIVERY PARTNER / ADMIN
// =====================================================
const updateDeliveryAvailabilityController =
  async (req, res) => {
    try {
      const { isAvailable } =
        req.body;

      if (
        typeof isAvailable !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isAvailable must be true or false",
        });
      }

      let delivery;

      // =================================================
      // DELIVERY PARTNER → OWN PROFILE
      // =================================================
      if (
        req.user.role ===
        "delivery"
      ) {
        delivery =
          await Delivery.findOne({
            user: req.user.id,
          });
      }

      // =================================================
      // ADMIN → SPECIFIC PROFILE
      // =================================================
      if (
        req.user.role === "admin"
      ) {
        const { id } =
          req.params;

        if (!isValidObjectId(id)) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid delivery ID",
          });
        }

        delivery =
          await Delivery.findById(
            id
          );
      }

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message:
            "Delivery profile not found",
        });
      }

      // =================================================
      // INACTIVE PARTNER CANNOT BE AVAILABLE
      // =================================================
      if (
        !delivery.isActive
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Delivery partner account is inactive",
        });
      }

      delivery.isAvailable =
        isAvailable;

      await delivery.save();

      return res.status(200).json({
        success: true,
        message: `Delivery partner is now ${
          isAvailable
            ? "available"
            : "unavailable"
        }`,
        delivery,
      });
    } catch (error) {
      console.error(
        "Update Delivery Availability Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Error in Update Delivery Availability API",
        error: error.message,
      });
    }
  };

// =====================================================
// UPDATE ACTIVE STATUS
// ADMIN ONLY
// =====================================================
const updateDeliveryActiveStatusController =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { isActive } =
        req.body;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery ID",
        });
      }

      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false",
        });
      }

      const delivery =
        await Delivery.findById(id);

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found",
        });
      }

      // =================================================
      // UPDATE DELIVERY PROFILE
      // =================================================
      delivery.isActive =
        isActive;

      // Inactive partner
      // automatically becomes unavailable
      if (!isActive) {
        delivery.isAvailable =
          false;
      }

      await delivery.save();

      // =================================================
      // KEEP USER ACCOUNT IN SYNC
      // =================================================
      if (delivery.user) {
        await User.findByIdAndUpdate(
          delivery.user,
          {
            isActive:
              isActive,
          }
        );
      }

      return res.status(200).json({
        success: true,
        message: `Delivery partner is now ${
          isActive
            ? "active"
            : "inactive"
        }`,
        delivery,
      });
    } catch (error) {
      console.error(
        "Update Delivery Active Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Error in Update Delivery Active Status API",
        error: error.message,
      });
    }
  };
  // =====================================================
// GET MY DELIVERY PROFILE
// DELIVERY PARTNER ONLY
// =====================================================

const getMyDeliveryProfileController = async (
  req,
  res
) => {
  try {
    const delivery =
      await Delivery.findOne({
        user: req.user.id,
      }).populate(
        "user",
        "name email phone role approvalStatus isActive"
      );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery profile not found",
      });
    }

    // Delivery account must be active
    if (!delivery.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Delivery partner account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Delivery profile fetched successfully",
      delivery,
    });
  } catch (error) {
    console.error(
      "Get My Delivery Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Get My Delivery Profile API",
      error: error.message,
    });
  }
};
  // =====================================================
// EXPORT
// =====================================================
module.exports = {
  createDeliveryController,
  getMyDeliveryProfileController,
  getAllDeliveryController,
  getAvailableDeliveryController,
  getAssignedOrdersController,
  getSingleDeliveryController,
  updateDeliveryController,
  deleteDeliveryController,
  updateDeliveryAvailabilityController,
  updateDeliveryActiveStatusController,
};