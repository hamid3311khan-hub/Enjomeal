import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";

function RestaurantDetails() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingFoodId, setAddingFoodId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] =
  useState(true);

  // =====================================================
  // FETCH RESTAURANT + MENU
  // =====================================================

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        restaurantResponse,
        foodResponse,
      ] = await Promise.all([
        API.get(
          `/restaurants/${restaurantId}`
        ),
        API.get(
          `/v1/foods/restaurant/${restaurantId}`
        ),
      ]);

      if (
        restaurantResponse.data.success
      ) {
        setRestaurant(
          restaurantResponse.data.restaurant
        );
      } else {
        setError(
          "Restaurant details could not be loaded."
        );
        return;
      }

      if (foodResponse.data.success) {
        setFoods(
          foodResponse.data.foods || []
        );
      } else {
        setFoods([]);
      }
    } catch (err) {
      console.error(
        "Restaurant Details API Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load restaurant details."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantReviews = async () => {
  try {
    setReviewsLoading(true);

    const response = await API.get(
      `/reviews/restaurant/${restaurantId}`
    );

    if (response.data.success) {
      setReviews(
        response.data.reviews || []
      );
    } else {
      setReviews([]);
    }
  } catch (err) {
    console.error(
      "Restaurant Reviews API Error:",
      err
    );

    setReviews([]);
  } finally {
    setReviewsLoading(false);
  }
};

  useEffect(() => {
  if (restaurantId) {
    fetchRestaurantDetails();
    fetchRestaurantReviews();
  }
}, [restaurantId]);

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories = useMemo(() => {
    const categorySet = new Set();

    foods.forEach((food) => {
      if (food.category) {
        categorySet.add(
          String(food.category).trim()
        );
      }
    });

    return [
      "All",
      ...Array.from(categorySet).sort(),
    ];
  }, [foods]);

  // =====================================================
  // FILTER MENU
  // =====================================================

  const filteredFoods = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return foods.filter((food) => {
      const name =
        food.name?.toLowerCase() || "";

      const description =
        food.description?.toLowerCase() ||
        "";

      const category =
        food.category?.toLowerCase() ||
        "";

      const matchesSearch =
        !searchText ||
        name.includes(searchText) ||
        description.includes(searchText) ||
        category.includes(searchText);

      const matchesCategory =
        selectedCategory === "All" ||
        category ===
          selectedCategory.toLowerCase();

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    foods,
    search,
    selectedCategory,
  ]);

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = async (
    foodId
  ) => {
    try {
      const token = localStorage.getItem(
        "enjoMealToken"
      );

      if (!token) {
        navigate("/login");
        return;
      }

      setAddingFoodId(foodId);

      const response = await API.post(
        "/cart/add",
        {
          food: foodId,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        navigate("/cart");
      }
    } catch (err) {
      console.error(
        "Add to Cart Error:",
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

      alert(
        err.response?.data?.message ||
          "Failed to add food to cart."
      );
    } finally {
      setAddingFoodId(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="menu-page">
        <div className="menu-loading">
          <div className="menu-loading-icon">
            🍽️
          </div>

          <h2>
            Loading menu...
          </h2>

          <p>
            Getting the restaurant
            menu ready for you.
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
      <div className="menu-page">
        <div className="menu-error">
          <div className="menu-error-icon">
            ⚠️
          </div>

          <h2>
            Something went wrong
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="menu-primary-button"
            onClick={
              fetchRestaurantDetails
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RESTAURANT NOT FOUND
  // =====================================================

  if (!restaurant) {
    return (
      <div className="menu-page">
        <div className="menu-empty">
          <div className="menu-empty-icon">
            🍽️
          </div>

          <h2>
            Restaurant not found
          </h2>

          <button
            type="button"
            className="menu-primary-button"
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
  // RESTAURANT DATA
  // =====================================================

  const rating =
    Number(restaurant.rating) || 0;

  const cuisines =
    Array.isArray(
      restaurant.cuisine
    )
      ? restaurant.cuisine.join(", ")
      : restaurant.cuisine ||
        "Food";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="menu-page">

      {/* =================================================
          RESTAURANT HERO
      ================================================= */}

      <section className="menu-restaurant-hero">

        <div className="menu-hero-inner">

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(
                "/restaurants"
              )
            }
          >
            ← Restaurants
          </button>

          <div className="restaurant-detail-card">

            <div className="restaurant-detail-icon">
              🍽️
            </div>

            <div className="restaurant-detail-info">

              <div className="restaurant-detail-title-row">

                <h1>
                  {restaurant.name}
                </h1>

                <span className="detail-rating">
                  ⭐{" "}
                  {rating.toFixed(1)}
                </span>

              </div>

              <p className="detail-cuisine">
                🍴 {cuisines}
              </p>

              <p className="detail-location">
                📍{" "}
                {restaurant.city ||
                  "Location"}
                {restaurant.state
                  ? `, ${restaurant.state}`
                  : ""}
              </p>

              {restaurant.address && (
                <p className="detail-address">
                  {restaurant.address}
                </p>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          MENU CONTENT
      ================================================= */}

      <main className="menu-content">

        {/* SEARCH */}

        <div className="menu-search-box">

          <span>
            🔎
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search dishes..."
            aria-label="Search dishes"
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="menu-clear-search"
            >
              ✕
            </button>
          )}

        </div>

        {/* =================================================
    CUSTOMER REVIEWS
================================================= */}

<section className="restaurant-reviews-section">

  <div className="reviews-heading">
    <div>
      <p className="menu-section-label">
        Customer feedback
      </p>

      <h2>
        ⭐ Reviews & Ratings
      </h2>
    </div>

    <div className="reviews-summary">
      <strong>
        ⭐ {rating.toFixed(1)}
      </strong>

      <span>
        {reviews.length}{" "}
        {reviews.length === 1
          ? "Review"
          : "Reviews"}
      </span>
    </div>
  </div>

  {reviewsLoading ? (
    <div className="reviews-empty">
      Loading reviews...
    </div>
  ) : reviews.length === 0 ? (
    <div className="reviews-empty">
      <div className="menu-empty-icon">
        ⭐
      </div>

      <h3>
        No reviews yet
      </h3>

      <p>
        Be the first customer to share
        your experience.
      </p>
    </div>
  ) : (
    <div className="reviews-list">

      {reviews.map((review) => (
        <article
          key={review._id}
          className="review-card"
        >

          <div className="review-card-header">

            <div>
              <strong>
                {review.user?.name ||
                  "Customer"}
              </strong>

              <p>
                {review.createdAt
                  ? new Date(
                      review.createdAt
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  : ""}
              </p>
            </div>

            <span className="review-rating">
              ⭐ {Number(
                review.rating
              ).toFixed(1)}
            </span>

          </div>

          {review.comment && (
            <p className="review-comment">
              {review.comment}
            </p>
          )}

        </article>
      ))}

    </div>
  )}

</section>

        {/* =================================================
            CATEGORY FILTERS
        ================================================= */}

        {categories.length > 1 && (
          <div className="menu-category-section">

            <p className="menu-section-label">
              Browse menu
            </p>

            <div className="menu-category-list">

              {categories.map(
                (category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() =>
                      setSelectedCategory(
                        category
                      )
                    }
                    className={
                      selectedCategory ===
                      category
                        ? "menu-category-chip active"
                        : "menu-category-chip"
                    }
                  >
                    {category ===
                    "All"
                      ? "🍽️ All"
                      : `🍴 ${category}`}
                  </button>
                )
              )}

            </div>

          </div>
        )}

        {/* =================================================
            MENU HEADING
        ================================================= */}

        <div className="menu-heading">

          <div>
            <p className="menu-section-label">
              Delicious choices
            </p>

            <h2>
              Our Menu
            </h2>
          </div>

          <span className="food-count">
            {filteredFoods.length}{" "}
            {filteredFoods.length ===
            1
              ? "item"
              : "items"}
          </span>

        </div>

        {/* =================================================
            EMPTY MENU
        ================================================= */}

        {filteredFoods.length ===
        0 ? (
          <div className="menu-empty">

            <div className="menu-empty-icon">
              🔍
            </div>

            <h2>
              No dishes found
            </h2>

            <p>
              Try another dish or
              category.
            </p>

            {(search ||
              selectedCategory !==
                "All") && (
              <button
                type="button"
                className="menu-secondary-button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory(
                    "All"
                  );
                }}
              >
                Clear Filters
              </button>
            )}

          </div>
        ) : (
          <div className="food-grid">

            {filteredFoods.map(
              (food) => {

                const available =
                  food.isAvailable !==
                  false;

                return (
                  <article
                    key={food._id}
                    className={
                      available
                        ? "food-card"
                        : "food-card unavailable"
                    }
                  >

                    {/* FOOD IMAGE */}

                    <div className="food-image">

                      {food.image ? (
                        <img
                          src={
                            food.image
                          }
                          alt={
                            food.name
                          }
                          onError={(
                            event
                          ) => {
                            event.currentTarget.style.display =
                              "none";

                            event.currentTarget.parentElement.classList.add(
                              "food-image-fallback"
                            );
                          }}
                        />
                      ) : (
                        <div className="food-image-fallback">
                          🍲
                        </div>
                      )}

                      {!available && (
                        <div className="unavailable-overlay">
                          Currently
                          unavailable
                        </div>
                      )}

                    </div>

                    {/* FOOD INFO */}

                    <div className="food-card-body">

                      <div className="food-title-row">

                        <h3>
                          {food.name}
                        </h3>

                        {food.category && (
                          <span className="food-category-badge">
                            {
                              food.category
                            }
                          </span>
                        )}

                      </div>

                      {food.description && (
                        <p className="food-description">
                          {
                            food.description
                          }
                        </p>
                      )}

                      <div className="food-bottom-row">

                        <strong className="food-price">
                          ₹
                          {Number(
                            food.price
                          ).toFixed(2)}
                        </strong>

                        <button
                          type="button"
                          disabled={
                            !available ||
                            addingFoodId ===
                              food._id
                          }
                          className={
                            available
                              ? "add-cart-button"
                              : "add-cart-button disabled"
                          }
                          onClick={() =>
                            handleAddToCart(
                              food._id
                            )
                          }
                        >
                          {addingFoodId ===
                          food._id
                            ? "Adding..."
                            : available
                            ? "+ Add"
                            : "Unavailable"}
                        </button>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </main>
    </div>
  );
}

export default RestaurantDetails;
