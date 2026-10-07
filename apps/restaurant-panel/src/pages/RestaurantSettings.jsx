import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function RestaurantSettings() {
  const navigate = useNavigate();

  const restaurantId = localStorage.getItem(
    "enjoMealRestaurantId"
  );

  const savedRestaurant = JSON.parse(
    localStorage.getItem(
      "enjoMealRestaurant"
    ) || "null"
  );

  const [latitude, setLatitude] = useState(
    savedRestaurant?.latitude ?? ""
  );

  const [longitude, setLongitude] = useState(
    savedRestaurant?.longitude ?? ""
  );

  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] =
    useState(
      savedRestaurant?.maxDeliveryRadiusKm ?? 3
    );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!restaurantId) {
        setError(
          "Restaurant ID not found. Please login again."
        );
        return;
      }

      const lat = Number(latitude);
      const lng = Number(longitude);
      const radius = Number(maxDeliveryRadiusKm);

      if (
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90
      ) {
        setError("Please enter a valid latitude.");
        return;
      }

      if (
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
      ) {
        setError("Please enter a valid longitude.");
        return;
      }

      if (
        !Number.isFinite(radius) ||
        radius < 0.5 ||
        radius > 50
      ) {
        setError(
          "Delivery radius must be between 0.5 KM and 50 KM."
        );
        return;
      }

      const response = await API.put(
        `/restaurants/${restaurantId}`,
        {
          latitude: lat,
          longitude: lng,
          maxDeliveryRadiusKm: radius,
        }
      );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Unable to save delivery settings."
        );
        return;
      }

      const updatedRestaurant =
        response.data.restaurant;

      localStorage.setItem(
        "enjoMealRestaurant",
        JSON.stringify(updatedRestaurant)
      );

      setLatitude(
        updatedRestaurant.latitude ?? lat
      );

      setLongitude(
        updatedRestaurant.longitude ?? lng
      );

      setMaxDeliveryRadiusKm(
        updatedRestaurant.maxDeliveryRadiusKm ??
          radius
      );

      setMessage(
        "Delivery settings saved successfully."
      );
    } catch (err) {
      console.error(
        "Restaurant Settings Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save delivery settings."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px 16px",
        background: "#fff8f3",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "0 auto",
          background: "#fff",
          padding: "25px",
          borderRadius: "14px",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          Delivery Settings
        </h2>

        <p
          style={{
            color: "#666",
            marginBottom: "25px",
            lineHeight: "1.5",
          }}
        >
          Set your restaurant location and the maximum
          distance up to which you want to accept
          customer orders.
        </p>

        {message && (
          <div
            style={{
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              background: "#d1e7dd",
              color: "#0f5132",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              background: "#f8d7da",
              color: "#842029",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "7px",
            }}
          >
            Latitude
          </label>

          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) =>
              setLatitude(e.target.value)
            }
            placeholder="Example: 25.5941"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "18px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "15px",
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "7px",
            }}
          >
            Longitude
          </label>

          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) =>
              setLongitude(e.target.value)
            }
            placeholder="Example: 85.1376"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "18px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "15px",
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "7px",
            }}
          >
            Maximum Delivery Radius (KM)
          </label>

          <input
            type="number"
            min="0.5"
            max="50"
            step="0.1"
            value={maxDeliveryRadiusKm}
            onChange={(e) =>
              setMaxDeliveryRadiusKm(e.target.value)
            }
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "8px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "15px",
            }}
          />

          <p
            style={{
              fontSize: "13px",
              color: "#777",
              marginTop: 0,
              marginBottom: "22px",
            }}
          >
            Allowed range: 0.5 KM to 50 KM.
          </p>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "9px",
              background: "#e85d04",
              color: "#fff",
              fontWeight: "700",
              fontSize: "16px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Saving..."
              : "Save Delivery Settings"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              border: "1px solid #ccc",
              borderRadius: "9px",
              background: "#fff",
              color: "#333",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

export default RestaurantSettings;
