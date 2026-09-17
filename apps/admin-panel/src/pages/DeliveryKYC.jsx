import React, { useEffect, useState } from "react";

const API = "https://enjomeal-api.onrender.com/api";

function DeliveryKYC() {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const deliveryId = window.location.pathname.split("/").pop();

  const fetchKYC = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/delivery/${deliveryId}/kyc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load KYC"
        );
      }

      setKyc(data.kyc);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    fetchKYC();
  }, []);

  const updateKYCStatus = async (status) => {
    let rejectionReason = "";

    if (status === "REJECTED") {
      rejectionReason = window.prompt(
        "Enter rejection reason:"
      );

      if (!rejectionReason || !rejectionReason.trim()) {
        return;
      }
    }

    const confirmMessage =
      status === "VERIFIED"
        ? "Are you sure you want to verify this KYC?"
        : "Are you sure you want to reject this KYC?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response = await fetch(
        `${API}/delivery/${deliveryId}/kyc-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            ...(status === "REJECTED" && {
              rejectionReason: rejectionReason.trim(),
            }),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update KYC"
        );
      }

      alert(
        status === "VERIFIED"
          ? "KYC verified successfully"
          : "KYC rejected successfully"
      );

      await fetchKYC();
    } catch (err) {
      setError(
        err.message || "Failed to update KYC status"
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <h3>Loading KYC...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <button
          style={styles.backButton}
          onClick={() => window.history.back()}
        >
          ← Back
        </button>

        <div style={styles.errorBox}>
          {error}
        </div>
      </div>
    );
  }

  if (!kyc) {
    return (
      <div style={styles.center}>
        <h3>KYC details not found</h3>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Delivery Partner KYC
          </h1>

          <p style={styles.subtitle}>
            Review identity documents and verification status
          </p>
        </div>

        <button
          style={styles.backButton}
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {/* BASIC INFORMATION */}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          Partner Information
        </h2>

        <div style={styles.infoGrid}>
          <div>
            <strong>Name</strong>
            <p>{kyc.name || "N/A"}</p>
          </div>

          <div>
            <strong>Phone</strong>
            <p>{kyc.phone || "N/A"}</p>
          </div>

          <div>
            <strong>Email</strong>
            <p>{kyc.email || "N/A"}</p>
          </div>

          <div>
            <strong>KYC Status</strong>
            <p>
              <span
                style={{
                  ...styles.status,
                  ...(kyc.status === "VERIFIED"
                    ? styles.verified
                    : kyc.status === "REJECTED"
                    ? styles.rejected
                    : styles.pending),
                }}
              >
                {kyc.status || "PENDING"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* PROFILE PHOTO */}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          Profile Photo
        </h2>

        {kyc.profilePhoto ? (
          <img
            src={kyc.profilePhoto}
            alt="Delivery Partner"
            style={styles.profilePhoto}
          />
        ) : (
          <p style={styles.missing}>
            Profile photo not uploaded
          </p>
        )}
      </div>

      {/* AADHAAR */}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          Aadhaar Document
        </h2>

        {kyc.aadhaarUploaded &&
        kyc.aadhaarUrl ? (
          <div>
            <img
              src={kyc.aadhaarUrl}
              alt="Aadhaar Document"
              style={styles.document}
            />

            <a
              href={kyc.aadhaarUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.viewButton}
            >
              🔍 Open Aadhaar
            </a>
          </div>
        ) : (
          <p style={styles.missing}>
            Aadhaar document not uploaded
          </p>
        )}
      </div>

      {/* DRIVING LICENCE */}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          Driving Licence
          <span style={styles.optional}>
            Optional
          </span>
        </h2>

        {kyc.drivingLicenceUploaded &&
        kyc.drivingLicenceUrl ? (
          <div>
            <img
              src={kyc.drivingLicenceUrl}
              alt="Driving Licence"
              style={styles.document}
            />

            <a
              href={kyc.drivingLicenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.viewButton}
            >
              🔍 Open Driving Licence
            </a>
          </div>
        ) : (
          <p style={styles.optionalText}>
            Driving Licence was not uploaded.
            This document is optional.
          </p>
        )}
      </div>

      {/* REJECTION REASON */}

      {kyc.status === "REJECTED" &&
        kyc.rejectionReason && (
          <div style={styles.rejectBox}>
            <strong>Rejection Reason</strong>
            <p>{kyc.rejectionReason}</p>
          </div>
        )}

      {/* ACTIONS */}

      {kyc.status === "PENDING" && (
        <div style={styles.actionCard}>
          <h2 style={styles.sectionTitle}>
            KYC Decision
          </h2>

          <div style={styles.actionButtons}>
            <button
              style={styles.verifyButton}
              disabled={actionLoading}
              onClick={() =>
                updateKYCStatus("VERIFIED")
              }
            >
              {actionLoading
                ? "Processing..."
                : "✓ Verify KYC"}
            </button>

            <button
              style={styles.rejectButton}
              disabled={actionLoading}
              onClick={() =>
                updateKYCStatus("REJECTED")
              }
            >
              ✕ Reject KYC
            </button>
          </div>
        </div>
      )}

      {/* PRIVACY NOTICE */}

      <div style={styles.privacyBox}>
        🔒 Aadhaar and Driving Licence documents are
        restricted to Admin KYC review only. They should
        never be displayed in the customer panel.
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "25px",
    boxSizing: "border-box",
    background: "#f5f7fb",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fb",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "28px",
  },

  subtitle: {
    marginTop: "6px",
    color: "#6b7280",
  },

  backButton: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    background: "#374151",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "18px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
  },

  sectionTitle: {
    marginTop: 0,
    color: "#111827",
    fontSize: "20px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  profilePhoto: {
    width: "180px",
    height: "180px",
    objectFit: "cover",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },

  document: {
    width: "100%",
    maxWidth: "600px",
    maxHeight: "650px",
    objectFit: "contain",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    display: "block",
    marginBottom: "15px",
  },

  status: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  pending: {
    background: "#fef3c7",
    color: "#92400e",
  },

  verified: {
    background: "#dcfce7",
    color: "#166534",
  },

  rejected: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  optional: {
    marginLeft: "10px",
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "500",
  },

  optionalText: {
    color: "#6b7280",
  },

  missing: {
    color: "#dc2626",
  },

  viewButton: {
    display: "inline-block",
    textDecoration: "none",
    padding: "9px 14px",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "600",
  },

  actionCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "18px",
  },

  actionButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  verifyButton: {
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    background: "#16a34a",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  rejectButton: {
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  rejectBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "18px",
  },

  privacyBox: {
    background: "#eff6ff",
    color: "#1e40af",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "18px",
  },
};

export default DeliveryKYC;
