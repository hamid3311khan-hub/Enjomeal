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
