import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function Coupons() {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("enjoMealToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.get("/coupons/active", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setCoupons(response.data.coupons || []);
      } else {
        setError(
          response.data.message || "Failed to load coupons."
        );
      }
    } catch (err) {
      console.error("Coupons Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("enjoMealToken");
        localStorage.removeItem("enjoMealUser");

        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load available coupons."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseCoupon = (code) => {
    navigate("/checkout", {
      state: {
        couponCode: code,
      },
    });
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          gap: "10px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          🎁 Coupons & Offers
        </h1>

        <button
          type="button"
          onClick={() => navigate("/restaurants")}
          style={{
            padding: "10px 15px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>

      {loading && (
        <p style={{ textAlign: "center" }}>
          Loading available coupons...
        </p>
      )}

      {!loading && error && (
        <div
          style={{
            padding: "15px",
            borderRadius: "10px",
            background: "#ffecec",
            color: "#b00020",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && coupons.length === 0 && (
        <div
          style={{
            padding: "25px",
            textAlign: "center",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h3>No coupons available</h3>
          <p>Check again later for new offers.</p>
        </div>
      )}

      {!loading &&
        !error &&
        coupons.map((coupon) => (
          <div
            key={coupon._id || coupon.code}
            style={{
              border: "1px solid #ddd",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "15px",
              background: "#fffaf5",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "15px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: "8px",
                  }}
                >
                  🏷️ {coupon.code}
                </h2>

                <p style={{ margin: "6px 0" }}>
                  {coupon.description ||
                    "Special discount available"}
                </p>

                <strong>
                  {coupon.discountType === "PERCENTAGE"
                    ? `${coupon.discountValue}% OFF`
                    : `₹${coupon.discountValue} OFF`}
                </strong>

                {coupon.minimumOrderAmount > 0 && (
                  <p
                    style={{
                      margin: "8px 0",
                      fontSize: "14px",
                    }}
                  >
                    Minimum order: ₹
                    {coupon.minimumOrderAmount}
                  </p>
                )}

                {coupon.expiryDate && (
                  <p
                    style={{
                      margin: "8px 0",
                      fontSize: "14px",
                    }}
                  >
                    Valid till:{" "}
                    {new Date(
                      coupon.expiryDate
                    ).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  handleUseCoupon(coupon.code)
                }
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#f85d04",
                  color: "#fff",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Use Coupon
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}

export default Coupons;
