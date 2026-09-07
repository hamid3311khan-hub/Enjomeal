const Update = require(
  "../models/updateModel"
);

// ===============================
// CREATE UPDATE
// ADMIN ONLY
// ===============================
const createUpdateController =
  async (req, res) => {
    try {
      const {
        title,
        description,
        youtubeUrl,
        image,
        isActive,
      } = req.body;

      // Validation
      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message:
            "Title and description are required",
        });
      }

      const update = await Update.create({
        title,
        description,
        youtubeUrl: youtubeUrl || "",
        image: image || "",
        isActive:
          isActive === undefined
            ? true
            : isActive,
        createdBy: req.user.id,
      });

      return res.status(201).json({
        success: true,
        message:
          "Update created successfully",
        update,
      });
    } catch (error) {
      console.error(
        "Create update error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create update",
        error: error.message,
      });
    }
  };

// ===============================
// GET ACTIVE UPDATES
// CUSTOMER / PUBLIC
// ===============================
const getActiveUpdatesController =
  async (req, res) => {
    try {
      const updates = await Update.find({
        isActive: true,
      })
        .sort({
          createdAt: -1,
        })
        .populate(
          "createdBy",
          "name email"
        );

      return res.status(200).json({
        success: true,
        count: updates.length,
        updates,
      });
    } catch (error) {
      console.error(
        "Get active updates error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch updates",
        error: error.message,
      });
    }
  };
// ===============================
// GET ALL UPDATES
// ADMIN ONLY
// ===============================
const getAllUpdatesController =
  async (req, res) => {
    try {
      const updates = await Update.find()
        .sort({
          createdAt: -1,
        })
        .populate(
          "createdBy",
          "name email"
        );

      return res.status(200).json({
        success: true,
        count: updates.length,
        updates,
      });
    } catch (error) {
      console.error(
        "Get all updates error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch all updates",
        error: error.message,
      });
    }
  };

// ===============================
// UPDATE / EDIT UPDATE
// ADMIN ONLY
// ===============================
const updateUpdateController =
  async (req, res) => {
    try {
      const { updateId } = req.params;

      const update =
        await Update.findById(updateId);

      if (!update) {
        return res.status(404).json({
          success: false,
          message:
            "Update not found",
        });
      }

      const {
        title,
        description,
        youtubeUrl,
        image,
        isActive,
      } = req.body;

      if (title !== undefined) {
        update.title = title;
      }

      if (description !== undefined) {
        update.description =
          description;
      }

      if (youtubeUrl !== undefined) {
        update.youtubeUrl =
          youtubeUrl;
      }

      if (image !== undefined) {
        update.image = image;
      }

      if (isActive !== undefined) {
        update.isActive = isActive;
      }

      await update.save();

      return res.status(200).json({
        success: true,
        message:
          "Update modified successfully",
        update,
      });
    } catch (error) {
      console.error(
        "Update edit error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update",
        error: error.message,
      });
    }
  };

// ===============================
// DELETE UPDATE
// ADMIN ONLY
// ===============================
const deleteUpdateController =
  async (req, res) => {
    try {
      const { updateId } = req.params;

      const update =
        await Update.findById(updateId);

      if (!update) {
        return res.status(404).json({
          success: false,
          message:
            "Update not found",
        });
      }

      await Update.findByIdAndDelete(
        updateId
      );

      return res.status(200).json({
        success: true,
        message:
          "Update deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete update error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete update",
        error: error.message,
      });
    }
  };

// ===============================
// EXPORT CONTROLLERS
// ===============================
module.exports = {
  createUpdateController,
  getActiveUpdatesController,
  getAllUpdatesController,
  updateUpdateController,
  deleteUpdateController,
};
