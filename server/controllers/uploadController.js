const cloudinary = require("../config/cloudinary");

const uploadFoodImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "enjomeal/foods",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);

          return res.status(500).json({
            success: false,
            message: "Image upload failed",
            error: error.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Food image uploaded successfully",
          image: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("Upload Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error uploading food image",
      error: error.message,
    });
  }
};

module.exports = {
  uploadFoodImageController,
};
