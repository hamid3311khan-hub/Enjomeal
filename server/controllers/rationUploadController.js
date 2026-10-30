const cloudinary = require("../config/cloudinary");

const uploadRationItemImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "enjomeal/ration-requests",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Ration Image Upload Error:", error);
          return res.status(500).json({
            success: false,
            message: "Ration image upload failed",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Ration item image uploaded successfully",
          image: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("Ration Upload Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading ration image",
    });
  }
};

module.exports = { uploadRationItemImage };
