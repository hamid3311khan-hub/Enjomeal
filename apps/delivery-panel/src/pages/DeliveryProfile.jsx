import { useEffect, useState } from "react";

const API_URL =
  "https://enjomeal-api.onrender.com/api/delivery";

function DeliveryProfile() {
  const [profile, setProfile] = useState(null);

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [aadhaar, setAadhaar] = useState(null);
  const [drivingLicence, setDrivingLicence] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token =
    localStorage.getItem("enjoMealDeliveryToken");

  // =====================================================
  // GET MY PROFILE
  // =====================================================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "Delivery login session not found."
        );
      }

      const response = await fetch(
        `${API_URL}/my-profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load delivery profile."
        );
      }

      setProfile(data.delivery);
    } catch (err) {
      console.error(
        "Delivery Profile Error:",
        err
      );

      setError(
        err.message ||
          "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =====================================================
  // FILE VALIDATION
  // =====================================================

  const validateFile = (file) => {
    if (!file) return true;

    if (!file.type.startsWith("image/")) {
      setError(
        "Only image files are allowed."
      );
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "File size must be 5 MB or less."
      );
      return false;
    }

    return true;
  };

  // =====================================================
  // PROFILE PHOTO
  // =====================================================

  const handleProfilePhotoChange = (
    event
  ) => {
    const file = event.target.files?.[0];

    setError("");
    setMessage("");

    if (!file) {
      setProfilePhoto(null);
      return;
    }

    if (!validateFile(file)) {
      event.target.value = "";
      return;
    }

    setProfilePhoto(file);
  };

  // =====================================================
  // AADHAAR
  // =====================================================

  const handleAadhaarChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setMessage("");

    if (!file) {
      setAadhaar(null);
      return;
    }

    if (!validateFile(file)) {
      event.target.value = "";
      return;
    }

    setAadhaar(file);
  };

  // =====================================================
  // DRIVING LICENCE
  // OPTIONAL
  // =====================================================

  const handleDrivingLicenceChange = (
    event
  ) => {
    const file = event.target.files?.[0];

    setError("");
    setMessage("");

    if (!file) {
      setDrivingLicence(null);
      return;
    }

    if (!validateFile(file)) {
      event.target.value = "";
      return;
    }

    setDrivingLicence(file);
  };
  // =====================================================
// UPLOAD KYC DOCUMENTS
// =====================================================

const handleUploadKYC = async (event) => {
  event.preventDefault();

  setMessage("");
  setError("");

  // ===================================================
  // REQUIRED FILE CHECK
  // ===================================================

  if (!profilePhoto) {
    setError("Profile photo is required.");
    return;
  }

  if (!aadhaar) {
    setError("Aadhaar document is required.");
    return;
  }

  // ===================================================
  // PREVENT MULTIPLE UPLOADS
  // ===================================================

  if (uploading) {
    return;
  }

  try {
    setUploading(true);

    const formData = new FormData();

    formData.append(
      "profilePhoto",
      profilePhoto
    );

    formData.append(
      "aadhaar",
      aadhaar
    );

    // Driving Licence is OPTIONAL
    if (drivingLicence) {
      formData.append(
        "drivingLicence",
        drivingLicence
      );
    }

    // =================================================
    // SEND TO BACKEND
    // =================================================

    const response = await fetch(
      `${API_URL}/my-profile/kyc`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "KYC upload failed."
      );
    }

    // =================================================
    // SUCCESS
    // =================================================

    setMessage(
      data.message ||
        "KYC documents uploaded successfully."
    );

    // Clear selected files
    setProfilePhoto(null);
    setAadhaar(null);
    setDrivingLicence(null);

    // Refresh profile
    await fetchProfile();

    // Reset file inputs
    event.target.reset();
  } catch (err) {
    console.error(
      "KYC Upload Error:",
      err
    );

    setError(
      err.message ||
        "Failed to upload KYC documents."
    );
  } finally {
    setUploading(false);
  }
};

// =====================================================
// DASHBOARD
// =====================================================

const goToDashboard = () => {
  window.location.href = "/";
};
  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ textAlign: "center" }}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PROFILE NOT FOUND
  // =====================================================

  if (!profile) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h2>Delivery Profile</h2>

          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={goToDashboard}
            style={secondaryButtonStyle}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const kycStatus =
    profile.kycStatus || "PENDING";

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* =================================================
            HEADER
        ================================================= */}

        <div style={headerStyle}>
          <div>
            <h1 style={{ margin: 0 }}>
              My Profile
            </h1>

            <p style={subtitleStyle}>
              EnjoMeal Delivery Partner
            </p>
          </div>

          <button
            type="button"
            onClick={goToDashboard}
            style={smallButtonStyle}
          >
            Dashboard
          </button>
        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div style={successStyle}>
            {message}
          </div>
        )}

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        {/* =================================================
            BASIC PROFILE
        ================================================= */}

        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            Personal Information
          </h2>

          <div style={profileInfoStyle}>
            <div>
              <strong>Name</strong>
              <span>
                {profile.name || "N/A"}
              </span>
            </div>

            <div>
              <strong>Phone</strong>
              <span>
                {profile.phone || "N/A"}
              </span>
            </div>

            <div>
              <strong>Email</strong>
              <span>
                {profile.email || "N/A"}
              </span>
            </div>

            <div>
              <strong>Vehicle Type</strong>
              <span>
                {profile.vehicleType || "N/A"}
              </span>
            </div>

            <div>
              <strong>Vehicle Number</strong>
              <span>
                {profile.vehicleNumber ||
                  "Not provided"}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            CURRENT PROFILE PHOTO
        ================================================= */}

        {profile.profilePhoto && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              Current Profile Photo
            </h2>

            <img
              src={profile.profilePhoto}
              alt="Delivery Partner"
              style={profileImageStyle}
            />
          </div>
        )}

        {/* =================================================
            KYC STATUS
        ================================================= */}

        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            KYC Verification
          </h2>

          <div
            style={{
              ...statusStyle,
              ...(kycStatus === "VERIFIED"
                ? verifiedStatusStyle
                : kycStatus === "REJECTED"
                ? rejectedStatusStyle
                : pendingStatusStyle),
            }}
          >
            KYC Status: {kycStatus}
          </div>

          <p style={infoTextStyle}>
            Profile photo and Aadhaar are required.
            Driving Licence is optional.
          </p>
        </div>

        {/* =================================================
            KYC UPLOAD FORM
        ================================================= */}

        <form onSubmit={handleUploadKYC}>
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              Upload / Update KYC
            </h2>

            {/* PROFILE PHOTO */}

            <label style={labelStyle}>
              Profile Photo *
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleProfilePhotoChange
              }
              disabled={uploading}
              style={fileInputStyle}
            />

            <p style={hintStyle}>
              Required • Image only • Maximum 5 MB
            </p>

            {/* AADHAAR */}

            <label style={labelStyle}>
              Aadhaar Document *
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleAadhaarChange}
              disabled={uploading}
              style={fileInputStyle}
            />

            <p style={hintStyle}>
              Required • Image only • Maximum 5 MB
            </p>

            {/* DRIVING LICENCE */}

            <label style={labelStyle}>
              Driving Licence
              <span
                style={{
                  fontWeight: "400",
                  color: "#777",
                  marginLeft: "6px",
                }}
              >
                (Optional)
              </span>
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleDrivingLicenceChange
              }
              disabled={uploading}
              style={fileInputStyle}
            />

            <p style={hintStyle}>
              Optional • Image only • Maximum 5 MB
            </p>

            {/* =================================================
                SECURITY NOTICE
            ================================================= */}

            <div style={securityStyle}>
              <strong>🔒 Privacy & Security</strong>

              <p style={{ marginBottom: 0 }}>
                Your Aadhaar and Driving Licence
                documents are private and are not
                shown to customers.
              </p>
            </div>

            {/* =================================================
                UPLOAD BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={uploading}
              style={{
                ...primaryButtonStyle,
                opacity: uploading ? 0.7 : 1,
                cursor: uploading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {uploading
                ? "Uploading..."
                : "Upload KYC Documents"}
            </button>
          </div>
        </form>

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={goToDashboard}
          style={secondaryButtonStyle}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f7fa",
  padding: "20px",
  boxSizing: "border-box",
};

const cardStyle = {
  width: "100%",
  maxWidth: "700px",
  margin: "0 auto",
  background: "#ffffff",
  padding: "25px",
  borderRadius: "14px",
  boxShadow:
    "0 4px 18px rgba(0,0,0,0.08)",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  marginBottom: "25px",
};

const subtitleStyle = {
  color: "#777",
  marginTop: "6px",
  marginBottom: 0,
};

const sectionStyle = {
  marginTop: "20px",
  padding: "18px",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "16px",
  fontSize: "19px",
};

const profileInfoStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
};

const profileInfoItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};

const profileImageStyle = {
  width: "130px",
  height: "130px",
  objectFit: "cover",
  borderRadius: "50%",
  border: "3px solid #e85d04",
  display: "block",
  margin: "0 auto",
};

const statusStyle = {
  padding: "12px",
  borderRadius: "8px",
  fontWeight: "700",
  textAlign: "center",
};

const pendingStatusStyle = {
  background: "#fff3cd",
  color: "#856404",
};

const verifiedStatusStyle = {
  background: "#e8f5e9",
  color: "#2e7d32",
};

const rejectedStatusStyle = {
  background: "#ffebee",
  color: "#c62828",
};

const infoTextStyle = {
  color: "#666",
  fontSize: "14px",
  marginBottom: 0,
};

const labelStyle = {
  display: "block",
  fontWeight: "700",
  marginTop: "18px",
  marginBottom: "7px",
};

const fileInputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxSizing: "border-box",
  background: "#fafafa",
};

const hintStyle = {
  fontSize: "12px",
  color: "#777",
  marginTop: "5px",
};

const securityStyle = {
  marginTop: "20px",
  padding: "13px",
  background: "#f1f8ff",
  borderRadius: "8px",
  color: "#24506b",
  fontSize: "13px",
};

const primaryButtonStyle = {
  width: "100%",
  padding: "13px",
  marginTop: "20px",
  border: "none",
  borderRadius: "8px",
  background: "#e85d04",
  color: "#ffffff",
  fontWeight: "700",
  fontSize: "15px",
};

const secondaryButtonStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "15px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#333",
  fontWeight: "600",
  cursor: "pointer",
};

const smallButtonStyle = {
  padding: "9px 13px",
  border: "none",
  borderRadius: "7px",
  background: "#333",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
};

const successStyle = {
  background: "#e8f5e9",
  color: "#2e7d32",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "15px",
  fontSize: "14px",
};

const errorStyle = {
  background: "#ffebee",
  color: "#c62828",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "15px",
  fontSize: "14px",
};

export default DeliveryProfile;
