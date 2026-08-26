const mongoose = require("mongoose");
const Notification = require("../models/notificationModel");

// ===============================
// CREATE NOTIFICATION
// ADMIN / SYSTEM
// ===============================
const createNotificationController = async (req, res) => {
  try {
    const {
      user,
      title,
      message,
      type,
      order,
    } = req.body;

    // Validation
    if (!user || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "User, title and message are required",
      });
    }

    // Validate User ID
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Validate Order ID if provided
    if (order && !mongoose.Types.ObjectId.isValid(order)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const notification = await Notification.create({
      user,
      title,
      message,
      type: type || "GENERAL",
      order: order || null,
      isRead: false,
    });

    await notification.populate("user", "name email");

    if (notification.order) {
      await notification.populate("order");
    }
const io = req.app.get("io");

if (io) {
  const userId = notification.user._id.toString();

  io.to(`user:${userId}`).emit(
    "notification:new",
    {
      success: true,
      notification,
    }
  );
}
    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Create Notification API",
      error: error.message,
    });
  }
};

// ===============================
// GET MY NOTIFICATIONS
// ===============================
const getMyNotificationsController = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({
      user: userId,
    })
      .populate("order")
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      totalNotifications: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get My Notifications API",
      error: error.message,
    });
  }
};

// ===============================
// GET UNREAD NOTIFICATIONS
// ===============================
const getUnreadNotificationsController = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({
      user: userId,
      isRead: false,
    })
      .populate("order")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Unread notifications fetched successfully",
      totalUnread: notifications.length,
      notifications,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Unread Notifications API",
      error: error.message,
    });
  }
};

// ===============================
// GET SINGLE NOTIFICATION
// ===============================
const getSingleNotificationController = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(notificationId)
      .populate("user", "name email")
      .populate("order");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // User can access only own notification
    if (
      notification.user._id.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. This notification does not belong to you.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification fetched successfully",
      notification,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Single Notification API",
      error: error.message,
    });
  }
};

// ===============================
// MARK NOTIFICATION AS READ
// ===============================
const markNotificationAsReadController = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(
      notificationId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Only owner can mark as read
    if (
      notification.user.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. This notification does not belong to you.",
      });
    }

    notification.isRead = true;

    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Mark Notification As Read API",
      error: error.message,
    });
  }
};

// ===============================
// MARK ALL NOTIFICATIONS AS READ
// ===============================
const markAllNotificationsAsReadController = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      {
        user: userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Mark All Notifications As Read API",
      error: error.message,
    });
  }
};

// ===============================
// DELETE NOTIFICATION
// ===============================
const deleteNotificationController = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(
      notificationId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Only owner can delete
    if (
      notification.user.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. This notification does not belong to you.",
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Delete Notification API",
      error: error.message,
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  createNotificationController,
  getMyNotificationsController,
  getUnreadNotificationsController,
  getSingleNotificationController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController,
};
