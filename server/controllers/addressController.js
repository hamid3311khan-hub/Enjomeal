const mongoose = require("mongoose");
const Address = require("../models/addressModel");

// ===============================
// ADD ADDRESS
// CUSTOMER ONLY
// ===============================
const addAddressController = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      phone,
      address,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    // Validation
    if (
      !name ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, phone, address, city, state and pincode are required",
      });
    }

    // If new address is default, remove default from old addresses
    if (isDefault === true) {
      await Address.updateMany(
        { user: userId },
        { $set: { isDefault: false } }
      );
    }

    // First address automatically becomes default
    const addressCount = await Address.countDocuments({
      user: userId,
    });

    const makeDefault =
      addressCount === 0 ? true : isDefault === true;

    const newAddress = await Address.create({
      user: userId,
      name,
      phone,
      address,
      city,
      state,
      pincode,
      landmark: landmark || "",
      addressType: addressType || "HOME",
      isDefault: makeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Add Address API",
      error: error.message,
    });
  }
};

// ===============================
// GET MY ADDRESSES
// CUSTOMER ONLY
// ===============================
const getMyAddressesController = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await Address.find({
      user: userId,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      totalAddresses: addresses.length,
      addresses,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get My Addresses API",
      error: error.message,
    });
  }
};

// ===============================
// GET SINGLE ADDRESS
// CUSTOMER ONLY
// ===============================
const getSingleAddressController = async (req, res) => {
  try {
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findById(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Owner check
    if (
      address.user.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. This address does not belong to you.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address fetched successfully",
      address,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Single Address API",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE ADDRESS
// CUSTOMER ONLY
// ===============================
const updateAddressController = async (req, res) => {
  try {
    const { addressId } = req.params;

    const {
      name,
      phone,
      address,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const existingAddress = await Address.findById(
      addressId
    );

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Owner check
    if (
      existingAddress.user.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can update only your own address.",
      });
    }

    // Set other addresses as non-default
    if (isDefault === true) {
      await Address.updateMany(
        {
          user: req.user.id,
          _id: { $ne: addressId },
        },
        { $set: { isDefault: false } }
      );
    }

    if (name !== undefined) existingAddress.name = name;
    if (phone !== undefined) existingAddress.phone = phone;
    if (address !== undefined)
      existingAddress.address = address;
    if (city !== undefined) existingAddress.city = city;
    if (state !== undefined)
      existingAddress.state = state;
    if (pincode !== undefined)
      existingAddress.pincode = pincode;
    if (landmark !== undefined)
      existingAddress.landmark = landmark;
    if (addressType !== undefined)
      existingAddress.addressType = addressType;
    if (isDefault !== undefined)
      existingAddress.isDefault = isDefault;

    await existingAddress.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: existingAddress,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Update Address API",
      error: error.message,
    });
  }
};

// ===============================
// DELETE ADDRESS
// CUSTOMER ONLY
// ===============================
const deleteAddressController = async (req, res) => {
  try {
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findById(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Owner check
    if (
      address.user.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can delete only your own address.",
      });
    }

    const wasDefault = address.isDefault;

    await Address.findByIdAndDelete(addressId);

    // If default address was deleted,
    // make newest remaining address default
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        user: req.user.id,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Delete Address API",
      error: error.message,
    });
  }
};

// ===============================
// SET DEFAULT ADDRESS
// CUSTOMER ONLY
// ===============================
const setDefaultAddressController = async (req, res) => {
  try {
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findById(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Owner check
    if (
      address.user.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can set default only for your own address.",
      });
    }

    // Remove default from all user's addresses
    await Address.updateMany(
      { user: req.user.id },
      { $set: { isDefault: false } }
    );

    // Set selected address as default
    address.isDefault = true;

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message:
        "Error in Set Default Address API",
      error: error.message,
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  addAddressController,
  getMyAddressesController,
  getSingleAddressController,
  updateAddressController,
  deleteAddressController,
  setDefaultAddressController,
};