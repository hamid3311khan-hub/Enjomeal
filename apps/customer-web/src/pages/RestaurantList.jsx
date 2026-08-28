import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function RestaurantList() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] =
    useState("All");

  const user = JSON.parse(
    localStorage.getItem("enjoMealUser") || "null"
  );

  // =====================================================
  // FETCH RESTAURANTS
  // =====================================================

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        "/restaurants"
      );

      if (response.data.success) {
        setRestaurants(
          response.data.restaurants || []
        );
      } else {
        setError(
          "Restaurants load nahi ho rahe."
        );
      }
    } catch (err) {
      console.error(
        "Restaurant API Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load restaurants."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // =====================================================
  // CUISINE LIST
  // =====================================================

  const cuisines = useMemo(() => {
    const cuisineSet = new Set();

    restaurants.forEach((restaurant) => {
      if (
        Array.isArray(restaurant.cuisine)
      ) {
        restaurant.cuisine.forEach(
          (item) => {
            if (item) {
              cuisineSet.add(
                String(item).trim()
              );
            }
          }
        );
      } else if (
        restaurant.cuisine
      ) {
        cuisineSet.add(
          String(
            restaurant.cuisine
          ).trim()
        );
      }
    });

    return [
      "All",
      ...Array.from(cuisineSet).sort(),
    ];
  }, [restaurants]);

  // =====================================================
  // FILTER RESTAURANTS
  // =====================================================

  const filteredRestaurants = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return restaurants.filter(
      (restaurant) => {
        const name =
          restaurant.name
            ?.toLowerCase() || "";

        const city =
          restaurant.city
            ?.toLowerCase() || "";

        const state =
          restaurant.state
            ?.toLowerCase() || "";

        const restaurantCuisines =
          Array.isArray(
            restaurant.cuisine
          )
            ? restaurant.cuisine.map(
                (item) =>
                  String(item).toLowerCase()
              )
            : restaurant.cuisine
            ? [
                String(
                  restaurant.cuisine
                ).toLowerCase(),
              ]
            : [];

        const matchesSearch =
          !searchText ||
          name.includes(searchText) ||
          city.includes(searchText) ||
          state.includes(searchText) ||
          restaurantCuisines.some(
            (item) =>
              item.includes(searchText)
          );

        const matchesCuisine =
          selectedCuisine === "All" ||
          restaurantCuisines.includes(
            selectedCuisine.toLowerCase()
          );

        return (
          matchesSearch &&
          matchesCuisine
        );
      }
    );
  }, [
    restaurants,
    search,
    selectedCuisine,
  ]);

  // =====================================================
  // RESTAURANT STATUS
  // =====================================================

  const isRestaurantOpen = (
    restaurant
  ) => {
    if (
      typeof restaurant.isActive ===
      "boolean"
    ) {
      return restaurant.isActive;
    }

    return true;
  };

  // =====================================================
  // VIEW MENU
  // =====================================================

  const handleViewMenu = (
    restaurantId
  ) => {
    navigate(
      `/restaurants/${restaurantId}`
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="restaurant-page">
        <div className="restaurant-loading">
          <div className="loading-spinner">
            ⏳
          </div>

          <h2>
            Finding restaurants...
          </h2>

          <p>
            Please wait while we load
            the best restaurants for you.
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
      <div className="restaurant-page">
        <div className="restaurant-error">
          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Unable to load restaurants
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={fetchRestaurants}
            className="primary-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="restaurant-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="restaurant-hero">

        <div className="hero-content">

          <div className="hero-text">

            <p className="hero-small-text">
              Welcome back,
            </p>

            <h1>
              {user?.name ||
                "Customer"}{" "}
              👋
            </h1>

            <p className="hero-description">
              Discover delicious food
              from restaurants around
              you.
            </p>

          </div>

          <div className="hero-food-icon">
            🍽️
          </div>

        </div>

      </section>

      {/* =================================================
          SEARCH
      ================================================= */}

      <section className="restaurant-content">

        <div className="search-section">

          <div className="search-box">

            <span className="search-icon">
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
              placeholder="Search restaurants, food or cuisine..."
              aria-label="Search restaurants"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                ✕
              </button>
            )}

          </div>

        </div>

        {/* =================================================
            CUISINE FILTERS
        ================================================= */}

        {cuisines.length > 1 && (
          <div className="cuisine-section">

            <div className="section-heading-row">

              <div>
                <p className="section-label">
                  Explore
                </p>

                <h2>
                  Food Categories
                </h2>
              </div>

            </div>

            <div className="cuisine-list">

              {cuisines.map(
                (cuisine) => (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() =>
                      setSelectedCuisine(
                        cuisine
                      )
                    }
                    className={
                      selectedCuisine ===
                      cuisine
                        ? "cuisine-chip active"
                        : "cuisine-chip"
                    }
                  >
                    {cuisine ===
                    "All"
                      ? "🍽️ All"
                      : `🍴 ${cuisine}`}
                  </button>
                )
              )}

            </div>

          </div>
        )}

        {/* =================================================
            RESTAURANT HEADING
        ================================================= */}

        <div className="restaurants-heading">

          <div>
            <p className="section-label">
              Nearby choices
            </p>

            <h2>
              {search ||
              selectedCuisine !==
                "All"
                ? "Restaurants for you"
                : "Popular Restaurants"}
            </h2>
          </div>

          <span className="restaurant-count">
            {filteredRestaurants.length}{" "}
            {filteredRestaurants.length ===
            1
              ? "restaurant"
              : "restaurants"}
          </span>

        </div>

        {/* =================================================
            EMPTY SEARCH RESULT
        ================================================= */}

        {filteredRestaurants.length ===
        0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              🔍
            </div>

            <h2>
              No restaurants found
            </h2>

            <p>
              Try another restaurant,
              cuisine or location.
            </p>

            {(search ||
              selectedCuisine !==
                "All") && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSearch("");
                  setSelectedCuisine(
                    "All"
                  );
                }}
              >
                Clear Filters
              </button>
            )}

          </div>
        ) : (
          /* =================================================
             RESTAURANT GRID
          ================================================= */

          <div className="restaurant-grid">

            {filteredRestaurants.map(
              (restaurant) => {
                const cuisinesText =
                  Array.isArray(
                    restaurant.cuisine
                  )
                    ? restaurant.cuisine.join(
                        ", "
                      )
                    : restaurant.cuisine ||
                      "Food";

                const rating =
                  Number(
                    restaurant.rating
                  ) || 0;

                const open =
                  isRestaurantOpen(
                    restaurant
                  );

                return (
                  <article
                    key={
                      restaurant._id
                    }
                    className="restaurant-card"
                    onClick={() =>
                      handleViewMenu(
                        restaurant._id
                      )
                    }
                  >

                    {/* CARD IMAGE / PLACEHOLDER */}

                    <div className="restaurant-image">

                      {restaurant.image ? (
                        <img
                          src={
                            restaurant.image
                          }
                          alt={
                            restaurant.name
                          }
                          onError={(
                            event
                          ) => {
                            event.currentTarget.style.display =
                              "none";

                            event.currentTarget.parentElement.classList.add(
                              "image-fallback"
                            );
                          }}
                        />
                      ) : (
                        <div className="image-fallback">
                          🍽️
                        </div>
                      )}

                      <span
                        className={
                          open
                            ? "status-badge open"
                            : "status-badge closed"
                        }
                      >
                        {open
                          ? "● Open"
                          : "● Closed"}
                      </span>

                    </div>

                    {/* CARD BODY */}

                    <div className="restaurant-card-body">

                      <div className="restaurant-title-row">

                        <h3>
                          {
                            restaurant.name
                          }
                        </h3>

                        <span className="rating-badge">
                          ⭐{" "}
                          {rating.toFixed(
                            1
                          )}
                        </span>

                      </div>

                      <p className="restaurant-cuisine">
                        🍴{" "}
                        {cuisinesText}
                      </p>

                      <p className="restaurant-location">
                        📍{" "}
                        {restaurant.city ||
                          "Location"}
                        {restaurant.state
                          ? `, ${restaurant.state}`
                          : ""}
                      </p>

                      <button
                        type="button"
                        className="view-menu-button"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          handleViewMenu(
                            restaurant._id
                          );
                        }}
                      >
                        View Menu
                        <span>
                          →
                        </span>
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>
    </div>
  );
}

export default RestaurantList;
