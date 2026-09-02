import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../api";

function WriteReview() {
  const { orderId } = useParams();

  const navigate = useNavigate();

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [rating, setRating] =
    useState(0);

  const [comment, setComment] =
    useState("");

  const [error, setError] =
    useState("");

  // ==========================================
  // FETCH ORDER
  // ==========================================

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);

        const response = await API.get(
          `/orders/${orderId}`
        );

        if (response.data.success) {
          setOrder(response.data.order);
        } else {
          setError(
            "Unable to load order details"
          );
        }
      } catch (err) {
        console.error(
          "Order Fetch Error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load order"
        );
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // ==========================================
  // SUBMIT REVIEW
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (rating < 1 || rating > 5) {
      setError(
        "Please select a rating between 1 and 5"
      );

      return;
    }

    if (!order?.restaurant?._id) {
      setError(
        "Restaurant information is missing"
      );

      return;
    }

    try {
      setSubmitting(true);

      const response = await API.post(
        "/reviews/create",
        {
          restaurant:
            order.restaurant._id,

          order:
            order._id,

          rating,

          comment:
            comment.trim(),
        }
      );

      if (response.data.success) {
        alert(
          "Thank you! Your review has been submitted."
        );

        navigate(
          `/orders/${orderId}`,
          {
            replace: true,
          }
        );
      }
    } catch (err) {
      console.error(
        "Review Submit Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to submit review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        Loading order...
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !order) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h2>
          Unable to write review
        </h2>

        <p>
          {error}
        </p>

        <button
          onClick={() =>
            navigate(-1)
          }
        >
          Go Back
        </button>
      </div>
    );
  }

  // ==========================================
  // NOT DELIVERED
  // ==========================================

  if (
    order &&
    order.orderStatus !==
      "DELIVERED"
  ) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h2>
          Review not available yet
        </h2>

        <p>
          You can review this order after
          it has been delivered.
        </p>

        <button
          onClick={() =>
            navigate(
              `/orders/${orderId}`
            )
          }
        >
          Back to Order
        </button>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div
      style={{
        maxWidth: "650px",
        margin: "30px auto",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "25px",
          boxShadow:
            "0 5px 25px rgba(0,0,0,0.08)",
        }}
      >
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            marginBottom: "15px",
            fontSize: "16px",
          }}
        >
          ← Back
        </button>

        <h1
          style={{
            marginTop: 0,
          }}
        >
          ⭐ Rate Your Experience
        </h1>

        <p
          style={{
            color: "#666",
          }}
        >
          How was your experience with{" "}
          <strong>
            {order?.restaurant?.name ||
              "this restaurant"}
          </strong>
          ?
        </p>

        <form
          onSubmit={handleSubmit}
        >

          {/* =========================
              STAR RATING
          ========================= */}

          <div
            style={{
              marginTop: "25px",
              marginBottom: "25px",
            }}
          >
            <h3>
              Your Rating
            </h3>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setRating(star)
                    }
                    style={{
                      border: "none",
                      background:
                        "transparent",
                      cursor: "pointer",
                      fontSize: "35px",
                      padding: "2px",
                      opacity:
                        star <= rating
                          ? 1
                          : 0.3,
                    }}
                  >
                    ⭐
                  </button>
                )
              )}
            </div>

            {rating > 0 && (
              <p
                style={{
                  color: "#e85d04",
                  fontWeight: "600",
                }}
              >
                You selected {rating} out
                of 5 stars
              </p>
            )}
          </div>

          {/* =========================
              COMMENT
          ========================= */}

          <div
            style={{
              marginBottom: "25px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Write a review
              (Optional)
            </label>

            <textarea
              value={comment}
              onChange={(e) =>
                setComment(
                  e.target.value
                )
              }
              maxLength={500}
              rows={6}
              placeholder="Tell us about your experience..."
              style={{
                width: "100%",
                padding: "14px",
                border:
                  "1px solid #ddd",
                borderRadius: "10px",
                boxSizing:
                  "border-box",
                resize: "vertical",
                fontSize: "15px",
              }}
            />

            <small
              style={{
                color: "#888",
              }}
            >
              {comment.length}/500
            </small>
          </div>

          {/* =========================
              ERROR
          ========================= */}

          {error && (
            <p
              style={{
                color: "#d32f2f",
                marginBottom: "15px",
              }}
            >
              {error}
            </p>
          )}

          {/* =========================
              SUBMIT
          ========================= */}

          <button
            type="submit"
            disabled={
              submitting
            }
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "10px",
              background:
                submitting
                  ? "#ccc"
                  : "#e85d04",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "700",
              cursor:
                submitting
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {submitting
              ? "Submitting Review..."
              : "Submit Review"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default WriteReview;
