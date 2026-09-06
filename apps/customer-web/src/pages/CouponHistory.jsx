import { useEffect, useState } from "react";
import "./CouponHistory.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function CouponHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchCouponHistory = async () => {
      try {
        const token =
          localStorage.getItem(
            "enjoMealToken"
          );

        const response = await fetch(
          `${API_URL}/coupons/my-history`,
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
              "Failed to fetch coupon history"
          );
        }

        setHistory(data.history || []);
      } catch (error) {
        console.error(
          "Coupon history error:",
          error
        );

        setError(
          error.message ||
            "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCouponHistory();
  }, []);

  if (loading) {
    return (
      <div className="coupon-history-page">
        <p>Loading coupon history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="coupon-history-page">
        <p className="coupon-history-error">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="coupon-history-page">
      <div className="coupon-history-header">
        <h1>📜 Coupon History</h1>

        <p>
          View all coupons you have used.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="empty-coupon-history">
          <span>🎟️</span>

          <h2>
            No Coupon History Found
          </h2>

          <p>
            You have not used any coupon yet.
          </p>
        </div>
      ) : (
        <div className="coupon-history-list">
          {history.map((item) => (
            <div
              className="coupon-history-card"
              key={item._id}
            >
              <div className="coupon-history-code">
                🎟️{" "}
                {item.coupon?.code ||
                  "Coupon"}
              </div>

              <div className="coupon-history-details">

                {item.coupon
                  ?.discountType && (
                  <p>
                    <strong>
                      Discount:
                    </strong>{" "}
                    {item.coupon
                      .discountType ===
                    "PERCENTAGE"
                      ? `${item.coupon.discountValue}%`
                      : `₹${item.coupon.discountValue}`}
                  </p>
                )}

                {item.order && (
                  <p>
                    <strong>
                      Order:
                    </strong>{" "}
                    #{item.order._id}
                  </p>
                )}

                <p>
                  <strong>
                    Used On:
                  </strong>{" "}
                  {item.createdAt
                    ? new Date(
                        item.createdAt
                      ).toLocaleString()
                    : "N/A"}
                </p>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CouponHistory;
