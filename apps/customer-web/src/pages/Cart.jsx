import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingFoodId, setUpdatingFoodId] = useState(null);
  const [clearing, setClearing] = useState(false);

  // =====================================================
  // FETCH CART
  // =====================================================

  const fetchCart = async () => {
    try {
      const token =
        localStorage.getItem("enjoMealToken");

      if (!token) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setLoading(true);
      setError("");

      const response = await API.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setCart(response.data.cart);
      } else {
        setCart(null);
      }
    } catch (err) {
      console.error(
        "Cart API Error:",
        err
      );

      if (
        err.response?.status === 401
      ) {
        localStorage.removeItem(
          "enjoMealToken"
        );
        localStorage.removeItem(
          "enjoMealUser"
        );

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (
        err.response?.status === 404
      ) {
        setCart(null);
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load cart."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // =====================================================
  // CART TOTAL
  // =====================================================

  const calculatedTotal = useMemo(() => {
    if (
      !cart?.items ||
      !Array.isArray(cart.items)
    ) {
      return 0;
    }

    return cart.items.reduce(
      (total, item) => {
        return (
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0)
        );
      },
      0
    );
  }, [cart]);

  const totalAmount =
    Number(cart?.totalAmount) ||
    calculatedTotal;

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQuantity = async (
    foodId,
    quantity
  ) => {
    if (
      !foodId ||
      quantity < 1
    ) {
      return;
    }

    try {
      const token =
        localStorage.getItem(
          "enjoMealToken"
        );

      if (!token) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setUpdatingFoodId(foodId);

      const response = await API.put(
        `/cart/items/${foodId}`,
        {
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error(
        "Update Cart Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to update quantity."
      );
    } finally {
      setUpdatingFoodId(null);
    }
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const removeItem = async (
    foodId
  ) => {
    if (!foodId) {
      return;
    }

    try {
      const token =
        localStorage.getItem(
          "enjoMealToken"
        );

      if (!token) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setUpdatingFoodId(foodId);

      const response =
        await API.delete(
          `/cart/items/${foodId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error(
        "Remove Cart Item Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to remove item."
      );
    } finally {
      setUpdatingFoodId(null);
    }
  };

  // =====================================================
  // CLEAR CART
  // =====================================================

  const clearCart = async () => {
    if (clearing) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to clear your cart?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const token =
        localStorage.getItem(
          "enjoMealToken"
        );

      if (!token) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setClearing(true);

      const response =
        await API.delete(
          "/cart/clear",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (response.data.success) {
        setCart(
          response.data.cart
        );
      }
    } catch (err) {
      console.error(
        "Clear Cart Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to clear cart."
      );
    } finally {
      setClearing(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loading">
          <div className="cart-loading-icon">
            🛒
          </div>

          <h2>
            Loading your cart...
          </h2>

          <p>
            Just a moment.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="cart-page">
        <div className="cart-error">

          <div className="cart-state-icon">
            ⚠️
          </div>

          <h2>
            Couldn't load your cart
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="cart-primary-button"
            onClick={fetchCart}
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (
    !cart ||
    !cart.items ||
    cart.items.length === 0
  ) {
    return (
      <div className="cart-page">

        <div className="empty-cart">

          <div className="empty-cart-icon">
            🛒
          </div>

          <h1>
            Your cart is empty
          </h1>

          <p>
            Looks like you haven't
            added anything yet.
          </p>

          <button
            type="button"
            className="cart-primary-button"
            onClick={() =>
              navigate(
                "/restaurants"
              )
            }
          >
            Browse Restaurants
          </button>

        </div>

      </div>
    );
  }

  // =====================================================
  // CART PAGE
  // =====================================================

  return (
    <div className="cart-page">

      <main className="cart-container">

        {/* =================================================
            TOP
        ================================================= */}

        <div className="cart-top">

          <div>
            <button
              type="button"
              className="cart-back-button"
              onClick={() =>
                navigate(-1)
              }
            >
              ← Continue Shopping
            </button>

            <p className="cart-eyebrow">
              Your order
            </p>

            <h1>
              Your Cart
            </h1>

            <p className="cart-subtitle">
              Review your items before
              checkout.
            </p>
          </div>

          <button
            type="button"
            className="clear-cart-button"
            onClick={clearCart}
            disabled={clearing}
          >
            {clearing
              ? "Clearing..."
              : "Clear Cart"}
          </button>

        </div>

        {/* =================================================
            RESTAURANT
        ================================================= */}

        {cart.restaurant && (
          <div className="cart-restaurant">

            <div className="cart-restaurant-icon">
              🍽️
            </div>

            <div>
              <span>
                Ordering from
              </span>

              <strong>
                {cart.restaurant.name}
              </strong>

              {cart.restaurant.city && (
                <small>
                  📍{" "}
                  {cart.restaurant.city}
                </small>
              )}
            </div>

          </div>
        )}

        {/* =================================================
            CART LAYOUT
        ================================================= */}

        <div className="cart-layout">

          {/* ITEMS */}

          <section className="cart-items-section">

            <div className="cart-items-header">
              <h2>
                Your Items
              </h2>

              <span>
                {cart.items.length}{" "}
                {cart.items.length === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

            <div className="cart-items">

              {cart.items.map(
                (item) => {
                  const foodId =
                    item.food?._id;

                  const quantity =
                    Number(
                      item.quantity
                    ) || 0;

                  const price =
                    Number(
                      item.price
                    ) || 0;

                  const itemTotal =
                    price * quantity;

                  const updating =
                    updatingFoodId ===
                    foodId;

                  return (
                    <article
                      key={foodId}
                      className="cart-item"
                    >

                      {/* IMAGE */}

                      <div className="cart-item-image">

                        {item.food?.image ? (
                          <img
                            src={
                              item.food
                                .image
                            }
                            alt={
                              item.food
                                ?.name ||
                              "Food"
                            }
                            onError={(
                              event
                            ) => {
                              event.currentTarget.style.display =
                                "none";

                              event.currentTarget.parentElement.classList.add(
                                "cart-image-fallback"
                              );
                            }}
                          />
                        ) : (
                          <div className="cart-image-fallback">
                            🍲
                          </div>
                        )}

                      </div>

                      {/* INFO */}

                      <div className="cart-item-info">

                        <h3>
                          {item.food
                            ?.name ||
                            "Food"}
                        </h3>

                        {item.food
                          ?.description && (
                          <p>
                            {
                              item.food
                                .description
                            }
                          </p>
                        )}

                        <span className="cart-item-price">
                          ₹
                          {price.toFixed(
                            2
                          )}{" "}
                          each
                        </span>

                      </div>

                      {/* CONTROLS */}

                      <div className="cart-item-actions">

                        <div className="quantity-control">

                          <button
                            type="button"
                            disabled={
                              updating ||
                              quantity <= 1
                            }
                            onClick={() =>
                              updateQuantity(
                                foodId,
                                quantity -
                                  1
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {quantity}
                          </span>

                          <button
                            type="button"
                            disabled={
                              updating
                            }
                            onClick={() =>
                              updateQuantity(
                                foodId,
                                quantity +
                                  1
                              )
                            }
                          >
                            +
                          </button>

                        </div>

                        <strong className="cart-item-total">
                          ₹
                          {itemTotal.toFixed(
                            2
                          )}
                        </strong>

                        <button
                          type="button"
                          className="remove-item-button"
                          disabled={
                            updating
                          }
                          onClick={() =>
                            removeItem(
                              foodId
                            )
                          }
                        >
                          {updating
                            ? "Updating..."
                            : "Remove"}
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          </section>

          {/* SUMMARY */}

          <aside className="cart-summary">

            <div className="summary-header">
              <h2>
                Order Summary
              </h2>
            </div>

            <div className="summary-row">
              <span>
                Items
              </span>

              <span>
                {cart.items.length}
              </span>
            </div>

            <div className="summary-row">
              <span>
                Item total
              </span>

              <span>
                ₹
                {totalAmount.toFixed(
                  2
                )}
              </span>
            </div>

            <div className="summary-row">
              <span>
                Delivery
              </span>

              <span className="free-text">
                Calculated at checkout
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>
                Total
              </span>

              <strong>
                ₹
                {totalAmount.toFixed(
                  2
                )}
              </strong>
            </div>

            <button
              type="button"
              className="checkout-button"
              onClick={() =>
                navigate(
                  "/checkout"
                )
              }
            >
              Proceed to Checkout
              <span>
                →
              </span>
            </button>

            <button
              type="button"
              className="summary-shopping-button"
              onClick={() =>
                navigate(
                  "/restaurants"
                )
              }
            >
              Continue Shopping
            </button>

          </aside>

        </div>

      </main>

    </div>
  );
}

export default Cart;
