import { useEffect, useState } from "react";

const API =
  "https://enjomeal-api.onrender.com/api/updates";

function Updates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] =
    useState("");
  
  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    image: "",
    isActive: true,
  });

  const getToken = () =>
    localStorage.getItem(
      "enjoMealToken"
    ) ||
    localStorage.getItem(
      "enjoMealtoken"
    );

  const headers = () => ({
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${getToken()}`,
  });

  // =========================
  // LOAD ALL UPDATES
  // =========================

  const loadUpdates = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
  `${API}/all`,
  {
    headers: headers(),
  }
);

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to load updates"
        );
      }

      setUpdates(
        data.updates || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev) => ({
      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =========================
// CLOUDINARY IMAGE UPLOAD
// =========================

const handleImageUpload = async (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("Please select a valid image file.");
    e.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError("Image size must be less than 5 MB.");
    e.target.value = "";
    return;
  }

  try {
    setUploadingImage(true);
    setError("");
    setMessage("");

    const token = getToken();

    if (!token) {
      throw new Error("Admin login required.");
    }

    const uploadData = new FormData();

    uploadData.append("image", file);

    const response = await fetch(
      "https://enjomeal-api.onrender.com/api/uploads/food-image",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Image upload failed."
      );
    }

    setForm((prev) => ({
      ...prev,
      image: data.image,
    }));

    setMessage("Image uploaded successfully.");
  } catch (err) {
    console.error(
      "Cloudinary Upload Error:",
      err
    );

    setError(
      err.message || "Image upload failed."
    );
  } finally {
    setUploadingImage(false);
    e.target.value = "";
  }
};

  // =========================
  // CREATE UPDATE
  // =========================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      try {
        setMessage("");
        setError("");

        const payload = {
          title:
            form.title.trim(),

          description:
            form.description.trim(),

          youtubeUrl:
            form.youtubeUrl.trim(),

          image:
            form.image.trim(),

          isActive:
            form.isActive,
        };

        const response =
          await fetch(
            `${API}/create`,
            {
              method: "POST",

              headers:
                headers(),

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to create update"
          );
        }

        setMessage(
          "Update published successfully."
        );

        setForm({
          title: "",
          description: "",
          youtubeUrl: "",
          image: "",
          isActive: true,
        });

        loadUpdates();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Something went wrong"
        );
      }
    };

  // =========================
  // TOGGLE STATUS
  // =========================

  const toggleStatus =
    async (id) => {
      try {
        setMessage("");
        setError("");

        const response =
          await fetch(
            `${API}/${id}/toggle`,
            {
              method: "PATCH",

              headers:
                headers(),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to update status"
          );
        }

        setMessage(
          "Update status changed."
        );

        loadUpdates();
      } catch (err) {
        setError(
          err.message
        );
      }
    };

  // =========================
  // DELETE UPDATE
  // =========================

  const deleteUpdate =
    async (id) => {
      const confirmed =
        window.confirm(
          "Delete this update?"
        );

      if (!confirmed) return;

      try {
        setMessage("");
        setError("");

        const response =
          await fetch(
            `${API}/${id}`,
            {
              method:
                "DELETE",

              headers:
                headers(),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to delete update"
          );
        }

        setMessage(
          "Update deleted successfully."
        );

        loadUpdates();
      } catch (err) {
        setError(
          err.message
        );
      }
    };

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            App Updates
          </h1>

          <p style={styles.subtitle}>
            Manage app news,
            announcements and
            YouTube videos.
          </p>
        </div>

        <button
          style={
            styles.refreshButton
          }
          onClick={loadUpdates}
        >
          ↻ Refresh
        </button>

      </div>

      {/* MESSAGE */}

      {message && (
        <div style={styles.success}>
          {message}
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* CREATE UPDATE */}

      <div style={styles.card}>

        <h2 style={styles.cardTitle}>
          Create New Update
        </h2>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <div style={styles.field}>

            <label style={styles.label}>
              Title
            </label>

            <input
              type="text"
              name="title"
              value={
                form.title
              }
              onChange={
                handleChange
              }
              style={styles.input}
              placeholder="New EnjoMeal Update"
              required
            />

          </div>

          <div style={styles.field}>

            <label style={styles.label}>
              Description
            </label>

            <textarea
              name="description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
              style={
                styles.textarea
              }
              placeholder="Write update details..."
              required
            />

          </div>

          <div style={styles.grid}>

            <div style={styles.field}>

              <label
                style={
                  styles.label
                }
              >
                YouTube URL
              </label>

              <input
                type="url"
                name="youtubeUrl"
                value={
                  form.youtubeUrl
                }
                onChange={
                  handleChange
                }
                style={
                  styles.input
                }
                placeholder="https://youtube.com/..."
              />

                        <div style={styles.field}>
              <label style={styles.label}>
                Update Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                style={{
                  ...styles.input,
                  padding: "10px",
                  background: "#fff",
                }}
              />

              <p
                style={{
                  margin: "0",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                JPG, JPEG, PNG or WebP • Maximum 5 MB
              </p>

              {uploadingImage && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    background: "#fff3cd",
                    color: "#856404",
                    borderRadius: "8px",
                    fontWeight: "600",
                  }}
                >
                  ⏳ Uploading image to Cloudinary...
                </div>
              )}

              {form.image && !uploadingImage && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    background: "#dcfce7",
                    color: "#166534",
                    borderRadius: "8px",
                    fontWeight: "600",
                  }}
                >
                  ✅ Image uploaded successfully
                </div>
              )}

              {form.image && (
                <img
                  src={form.image}
                  alt="Update Preview"
                  style={{
                    width: "180px",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    marginTop: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
              )}
            </div>
          </div>

          <label
            style={
              styles.checkbox
            }
          >

            <input
              type="checkbox"
              name="isActive"
              checked={
                form.isActive
              }
              onChange={
                handleChange
              }
            />

            <span>
              Publish as Active
            </span>

          </label>

          <button
            type="submit"
            style={
              styles.saveButton
            }
          >
            Publish Update
          </button>

        </form>

      </div>

      {/* UPDATE LIST */}

      <div style={styles.card}>

        <h2 style={styles.cardTitle}>
          All Updates
        </h2>

        {loading ? (

          <p>
            Loading updates...
          </p>

        ) : updates.length === 0 ? (

          <p>
            No updates found.
          </p>

        ) : (

          <div style={styles.list}>

            {updates.map(
              (update) => (

                <div
                  key={update._id}
                  style={
                    styles.updateCard
                  }
                >

                  {update.image && (
                    <img
                      src={
                        update.image
                      }
                      alt={
                        update.title
                      }
                      style={
                        styles.image
                      }
                    />
                  )}

                  <div
                    style={
                      styles.content
                    }
                  >

                    <h3
                      style={
                        styles.updateTitle
                      }
                    >
                      {update.title}
                    </h3>

                    <p
                      style={
                        styles.description
                      }
                    >
                      {
                        update.description
                      }
                    </p>

                    {update.youtubeUrl && (

                      <a
                        href={
                          update.youtubeUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={
                          styles.youtube
                        }
                      >
                        ▶ Watch on YouTube
                      </a>

                    )}

                    <div
                      style={
                        styles.footer
                      }
                    >

                      <span
                        style={{
                          ...styles.status,

                          background:
                            update.isActive
                              ? "#dcfce7"
                              : "#fee2e2",

                          color:
                            update.isActive
                              ? "#166534"
                              : "#991b1b",
                        }}
                      >
                        {update.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                      <div
                        style={
                          styles.actions
                        }
                      >

                        <button
                          style={
                            styles.toggleButton
                          }
                          onClick={() =>
                            toggleStatus(
                              update._id
                            )
                          }
                        >
                          {update.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          style={
                            styles.deleteButton
                          }
                          onClick={() =>
                            deleteUpdate(
                              update._id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}

const styles = {

  container: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "6px",
  },

  refreshButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },

  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "14px",
    marginBottom: "24px",
    boxShadow:
      "0 2px 12px rgba(0,0,0,0.08)",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: "20px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "18px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px",
  },

  label: {
    fontWeight: "600",
  },

  input: {
    padding: "12px",
    border:
      "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
  },

  textarea: {
    minHeight: "120px",
    padding: "12px",
    border:
      "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    resize: "vertical",
  },

  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
  },

  saveButton: {
    padding: "13px 24px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  success: {
    padding: "14px",
    marginBottom: "20px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
  },

  error: {
    padding: "14px",
    marginBottom: "20px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  updateCard: {
    display: "flex",
    gap: "18px",
    padding: "18px",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
  },

  image: {
    width: "140px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "10px",
  },

  content: {
    flex: 1,
  },

  updateTitle: {
    margin: "0 0 8px",
  },

  description: {
    color: "#4b5563",
    lineHeight: "1.5",
  },

  youtube: {
    display: "inline-block",
    marginTop: "8px",
    color: "#dc2626",
    fontWeight: "600",
    textDecoration: "none",
  },

  footer: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "15px",
    marginTop: "16px",
  },

  status: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  toggleButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "7px",
    background: "#f59e0b",
    color: "#fff",
    cursor: "pointer",
  },

  deleteButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "7px",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
  },

};

export default Updates;
