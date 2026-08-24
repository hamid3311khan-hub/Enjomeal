import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const restaurantResponse = await API.get(
          `/restaurants/${restaurantId}`
        );

        if (restaurantResponse.data.success) {
          setRestaurant(
            restaurantResponse.data.restaurant
          );
        }

        const foodResponse = await API.get(
          `/v1/foods/restaurant/${restaurantId}`
        );

        if (foodResponse.data.success) {
          setFoods(foodResponse.data.foods || []);
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

    if (restaurantId) {
      fetchRestaurantDetails();
    }
  }, [restaurantId]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const handleAddToCart = async (foodId) => {
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
      console.error("Add to Cart Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("enjoMealToken");
        localStorage.removeItem("enjoMealUser");

        navigate("/login");
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

  if (loading) {
    return <h2>Loading restaurant...</h2>;
  }

  if (error) {
    return (
      <p style={{ color: "red", padding: "30px" }}>
        {error}
      </p>
    );
  }

  if (!restaurant) {
    return (
      <p style={{ padding: "30px" }}>
        Restaurant not found.
      </p>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        minHeight: "100vh",
        background: "#fff8f3",
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h1>{restaurant.name}</h1>

      <p>
        {restaurant.city}, {restaurant.state}
      </p>

      <p>
        {restaurant.cuisine?.join(", ") || "Food"}
      </p>

      <p>
        Rating: {restaurant.rating || 0}
      </p>

      <hr />

      <h2>Menu</h2>

      {foods.length === 0 ? (
        <p>No food available in this restaurant.</p>
      ) : (
        foods.map((food) => (
          <div
            key={food._id}
            style={{
              padding: "20px",
              marginBottom: "15px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              background: "#fff",
            }}
          >
          {food.image ? (
  <img
    src={food.image}
    alt={food.name}
    style={{
      width: "100%",
      height: "180px",
      objectFit: "cover",
      borderRadius: "10px",
      marginBottom: "15px",
    }}
  />
) : (
  <div
    style={{
      width: "100%",
      height: "180px",
      background: "#f1f1f1",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "15px",
      color: "#777",
    }}
  >
    No Image
  </div>
)}
  
            <h3>{food.name}</h3>

            <p>{food.description}</p>

            <strong>₹{food.price}</strong>

            <p>
              {food.isAvailable
                ? "Available"
                : "Currently unavailable"}
            </p>

            <button
              disabled={
                !food.isAvailable ||
                addingFoodId === food._id
              }
              onClick={() =>
                handleAddToCart(food._id)
              }
              style={{
                padding: "11px 20px",
                border: "none",
                borderRadius: "8px",
                background: food.isAvailable
                  ? "#e85d04"
                  : "#aaa",
                color: "#fff",
                fontWeight: "600",
                cursor:
                  !food.isAvailable ||
                  addingFoodId === food._id
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {addingFoodId === food._id
                ? "Adding..."
                : "Add to Cart"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default RestaurantDetails;