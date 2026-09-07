import { useEffect, useState } from "react";

const API =
  "https://enjomeal-api.onrender.com/api/updates";

function Updates() {
  const [updates, setUpdates] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const getToken = () =>
    localStorage.getItem(
      "enjoMealToken"
    ) ||
    localStorage.getItem(
      "enjoMealtoken"
    );

  // =========================
  // LOAD ACTIVE UPDATES
  // =========================

  const loadUpdates = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response =
        await fetch(
          `${API}/active`,
          {
            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
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

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            Lates Updates
          </h1>

          <p style={styles.subtitle}>
            Latest news, offers and
            announcements from EnjoMeal.
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={loadUpdates}
        >
          ↻ Refresh
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (

        <div style={styles.emptyCard}>
          Loading updates...
        </div>

      ) : updates.length === 0 ? (

        <div style={styles.emptyCard}>
          No updates available.
        </div>

      ) : (

        <div style={styles.list}>

          {updates.map(
            (update) => (

              <div
                key={update._id}
                style={styles.updateCard}
              >

                {/* IMAGE */}

                {update.image && (

                  <img
                    src={update.image}
                    alt={update.title}
                    style={styles.image}
                    onError={(event) => {
                      event.target.style.display =
                        "none";
                    }}
                  />

                )}

                {/* CONTENT */}

                <div style={styles.content}>

                  <h2
                    style={styles.updateTitle}
                  >
                    {update.title}
                  </h2>

                  <p
                    style={styles.description}
                  >
                    {update.description}
                  </p>

                  {/* YOUTUBE */}

                  {update.youtubeUrl && (

                    <a
                      href={
                        update.youtubeUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={
                        styles.youtubeButton
                      }
                    >
                      ▶ Watch on YouTube
                    </a>

                  )}

                </div>

              </div>

            )
          )}

        </div>

      )}

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
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "16px",
  },

  refreshButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  updateCard: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow:
      "0 2px 12px rgba(0,0,0,0.08)",
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },

  image: {
    width: "180px",
    height: "130px",
    objectFit: "cover",
    borderRadius: "10px",
    flexShrink: 0,
  },

  content: {
    flex: 1,
  },

  updateTitle: {
    marginTop: 0,
    marginBottom: "10px",
    fontSize: "22px",
  },

  description: {
    margin: 0,
    color: "#4b5563",
    lineHeight: "1.6",
    fontSize: "16px",
  },

  youtubeButton: {
    display: "inline-block",
    marginTop: "16px",
    padding: "10px 16px",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "600",
  },

  emptyCard: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "14px",
    textAlign: "center",
    color: "#6b7280",
    boxShadow:
      "0 2px 12px rgba(0,0,0,0.08)",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

};

export default Updates;
