import { useEffect, useState } from "react";

function Menu() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode
  const [editingFood, setEditingFood] = useState(null);

  // Category filter
  const [selectedCategory, setSelectedCategory] =
    useState("ALL");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    isAvailable: true,
  });

  const restaurantId = localStorage.getItem(
    "enjoMealRestaurantId"
  );

  // =====================================================
  // FOOD CATEGORIES
  // =====================================================

  const categories = [
    "Biryani",
    "Pizza",
    "Burger",
    "Chinese",
    "Indian",
    "North Indian",
    "South Indian",
    "Starter",
    "Main Course",
    "Dessert",
    "Beverages",
    "Snacks",
    "Indian Main Course",
    "Breads",
    "Indian Dal & Rice",
    "Momos",
    "Fries",
    "Combo",
    "BreakFast",
    "Soup",
    "Starters",
    "Gravies",
    "Rice",
    "Noodles",
    "Other"
    
  ];

  // =====================================================
  // FETCH RESTAURANT FOODS
  // =====================================================

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError("");

      if (!restaurantId) {
        setError(
          "Restaurant ID not found. Please login again."
        );
        return;
      }

      const response = await fetch(
        `https://enjomeal-api.onrender.com/api/v1/foods/restaurant/${restaurantId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch menu."
        );
      }

      setFoods(data.foods || []);
    } catch (error) {
      console.error(
        "Fetch Menu Error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      image: "",
      isAvailable: true,
    });

    setEditingFood(null);
    setShowForm(false);
  };

  // =====================================================
  // ADD / UPDATE FOOD
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem(
        "enjoMealRestaurantToken"
      );

      if (!token) {
        setError(
          "Restaurant login required."
        );
        return;
      }

      // =================================================
      // UPDATE FOOD
      // =================================================

      if (editingFood) {
        const response = await fetch(
          `https://enjomeal-api.onrender.com/api/v1/foods/${editingFood._id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name: formData.name,
              description:
                formData.description,
              price: Number(
                formData.price
              ),
              category:
                formData.category,
              image: formData.image,
              isAvailable:
                formData.isAvailable,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update food."
          );
        }

        resetForm();

        await fetchFoods();

        return;
      }

      // =================================================
      // CREATE FOOD
      // =================================================

      const response = await fetch(
        "https://enjomeal-api.onrender.com/api/v1/foods/create",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description:
              formData.description,
            price: Number(
              formData.price
            ),
            category:
              formData.category,
            image: formData.image,
            isAvailable:
              formData.isAvailable,
            restaurant:
              restaurantId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create food."
        );
      }

      resetForm();

      await fetchFoods();
    } catch (error) {
      console.error(
        "Save Food Error:",
        error
      );

      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // EDIT FOOD
  // =====================================================

  const editFood = (food) => {
    setEditingFood(food);

    setFormData({
      name: food.name || "",
      description:
        food.description || "",
      price: food.price || "",
      category:
        food.category || "",
      image: food.image || "",
      isAvailable:
        food.isAvailable !== false,
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE FOOD
  // =====================================================

  const deleteFood = async (foodId) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this food?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");

      const token = localStorage.getItem(
        "enjoMealRestaurantToken"
      );

      if (!token) {
        setError(
          "Restaurant login required."
        );
        return;
      }

      const response = await fetch(
        `https://enjomeal-api.onrender.com/api/v1/foods/${foodId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete food."
        );
      }

      setFoods(
        (currentFoods) =>
          currentFoods.filter(
            (food) =>
              food._id !== foodId
          )
      );
    } catch (error) {
      console.error(
        "Delete Food Error:",
        error
      );

      setError(error.message);
    }
  };

  // =====================================================
  // TOGGLE AVAILABILITY
  // =====================================================

  const toggleAvailability = async (
    food
  ) => {
    try {
      setError("");

      const token = localStorage.getItem(
        "enjoMealRestaurantToken"
      );

      if (!token) {
        setError(
          "Restaurant login required."
        );
        return;
      }

      const response = await fetch(
        `https://enjomeal-api.onrender.com/api/v1/foods/${food._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            isAvailable:
              !food.isAvailable,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update availability."
        );
      }

      setFoods(
        (currentFoods) =>
          currentFoods.map(
            (item) =>
              item._id === food._id
                ? {
                    ...item,
                    isAvailable:
                      !item.isAvailable,
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        "Availability Error:",
        error
      );

      setError(error.message);
    }
  };

  // =====================================================
  // GET UNIQUE CATEGORIES
  // =====================================================

  const availableCategories = [
  ...new Map(
    foods
      .map((food) => {
        const category =
          food.category?.trim();

        if (!category) {
          return null;
        }

        return [
          category.toLowerCase(),
          category,
        ];
      })
      .filter(Boolean)
  ).values(),
];
  // =====================================================
  // FILTER FOODS
  // =====================================================

  const filteredFoods =
    selectedCategory === "ALL"
      ? foods
      : foods.filter(
          (food) =>
            food.category?.toLowerCase() ===
            selectedCategory.toLowerCase()
        );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "30px",
          background: "#fff8f3",
        }}
      >
        <h2>Loading menu...</h2>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#fff8f3",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "25px",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>
            Menu Management
          </h1>

          <p>
            Total Food Items:{" "}
            <strong>
              {foods.length}
            </strong>
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            background: "#e85d04",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          {showForm
            ? "Close Form"
            : "+ Add Food"}
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            color: "#dc3545",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* =================================================
          CATEGORY FILTER
      ================================================= */}

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: "15px",
          }}
        >
          Menu Categories
        </h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() =>
              setSelectedCategory("ALL")
            }
            style={{
              padding: "9px 16px",
              border: "none",
              borderRadius: "20px",
              background:
                selectedCategory ===
                "ALL"
                  ? "#e85d04"
                  : "#eee",
              color:
                selectedCategory ===
                "ALL"
                  ? "#fff"
                  : "#333",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            All ({foods.length})
          </button>

          {availableCategories.map(
            (category) => {
              const count =
                foods.filter(
                  (food) =>
                    food.category
                      ?.toLowerCase() ===
                    category.toLowerCase()
                ).length;

              return (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                  style={{
                    padding:
                      "9px 16px",
                    border: "none",
                    borderRadius:
                      "20px",
                    background:
                      selectedCategory.toLowerCase() ===
                      category.toLowerCase()
                        ? "#e85d04"
                        : "#eee",
                    color:
                      selectedCategory.toLowerCase() ===
                      category.toLowerCase()
                        ? "#fff"
                        : "#333",
                    fontWeight:
                      "700",
                    cursor:
                      "pointer",
                  }}
                >
                  {category} ({count})
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* =================================================
          ADD / EDIT FOOD FORM
      ================================================= */}

      {showForm && (
        <div
          style={{
            background: "#fff",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "25px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            {editingFood
              ? "Edit Food"
              : "Add Food"}
          </h2>

          <form
            onSubmit={handleSubmit}
          >
            {/* FOOD NAME */}

            <label>
              Food Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Chicken Biryani"
              required
              style={inputStyle}
            />

            {/* DESCRIPTION */}

            <label>
              Description
            </label>

            <textarea
              name="description"
              value={
                formData.description
              }
              onChange={handleChange}
              placeholder="Food description"
              required
              style={{
                ...inputStyle,
                minHeight: "90px",
              }}
            />

            {/* PRICE */}

            <label>
              Price
            </label>

            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="220"
              min="0"
              required
              style={inputStyle}
            />

            {/* CATEGORY */}

            <label>
              Category
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">
                Select Category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            {/* IMAGE */}

            <label>
              Image URL
            </label>

            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://..."
              style={inputStyle}
            />

            {/* IMAGE PREVIEW */}

            {formData.image && (
              <div
                style={{
                  marginBottom: "20px",
                }}
              >
                <p>
                  <strong>
                    Image Preview
                  </strong>
                </p>

                <img
                  src={formData.image}
                  alt="Food Preview"
                  onError={(
                    event
                  ) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                  style={{
                    width: "180px",
                    height: "130px",
                    objectFit: "cover",
                    borderRadius:
                      "10px",
                    border:
                      "1px solid #ddd",
                  }}
                />
              </div>
            )}

            {/* AVAILABLE */}

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              <input
                type="checkbox"
                name="isAvailable"
                checked={
                  formData.isAvailable
                }
                onChange={
                  handleChange
                }
              />

              Available
            </label>

            {/* SAVE */}

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 20px",
                border: "none",
                borderRadius: "8px",
                background: saving
                  ? "#aaa"
                  : "#198754",
                color: "#fff",
                fontWeight: "700",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                marginRight: "10px",
              }}
            >
              {saving
                ? "Saving..."
                : editingFood
                ? "Update Food"
                : "Save Food"}
            </button>

            {/* CANCEL EDIT */}

            {editingFood && (
              <button
                type="button"
                onClick={
                  resetForm
                }
                style={{
                  padding:
                    "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  background:
                    "#6c757d",
                  color: "#fff",
                  fontWeight:
                    "700",
                  cursor:
                    "pointer",
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      )}

      {/* =================================================
          FOOD LIST
      ================================================= */}

      {foods.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <h2>
            No food items
          </h2>

          <p>
            Add your first food
            item using the button
            above.
          </p>
        </div>
      ) : filteredFoods.length ===
        0 ? (
        <div
          style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <h2>
            No food in this category
          </h2>

          <p>
            Try another category.
          </p>

          <button
            onClick={() =>
              setSelectedCategory(
                "ALL"
              )
            }
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              background:
                "#e85d04",
              color: "#fff",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Show All Foods
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredFoods.map(
            (food) => (
              <div
                key={food._id}
                style={{
                  background:
                    "#fff",
                  padding: "20px",
                  borderRadius:
                    "12px",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                {/* FOOD IMAGE */}

                {food.image ? (
                  <img
                    src={food.image}
                    alt={food.name}
                    onError={(
                      event
                    ) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                    style={{
                      width: "100%",
                      height:
                        "180px",
                      objectFit:
                        "cover",
                      borderRadius:
                        "10px",
                      marginBottom:
                        "15px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height:
                        "180px",
                      background:
                        "#f1f1f1",
                      borderRadius:
                        "10px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      marginBottom:
                        "15px",
                      color: "#777",
                    }}
                  >
                    No Image
                  </div>
                )}

                {/* NAME */}

                <h3>
                  {food.name}
                </h3>

                {/* DESCRIPTION */}

                <p>
                  {food.description}
                </p>

                {/* CATEGORY */}

                <p>
                  <strong>
                    Category:
                  </strong>{" "}
                  <span
                    style={{
                      display:
                        "inline-block",
                      padding:
                        "5px 10px",
                      background:
                        "#fff0e6",
                      color:
                        "#e85d04",
                      borderRadius:
                        "15px",
                      fontSize:
                        "13px",
                      fontWeight:
                        "700",
                    }}
                  >
                    {food.category ||
                      "Other"}
                  </span>
                </p>

                {/* PRICE */}

                <h3>
                  ₹{food.price}
                </h3>

                {/* STATUS */}

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  <span
                    style={{
                      color:
                        food.isAvailable
                          ? "#198754"
                          : "#dc3545",
                      fontWeight:
                        "700",
                    }}
                  >
                    {food.isAvailable
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </p>

                {/* ACTION BUTTONS */}

                <div
                  style={{
                    display:
                      "flex",
                    gap: "8px",
                    flexWrap:
                      "wrap",
                    marginTop:
                      "15px",
                  }}
                >
                  {/* EDIT */}

                  <button
                    onClick={() =>
                      editFood(
                        food
                      )
                    }
                    style={{
                      padding:
                        "9px 15px",
                      border:
                        "none",
                      borderRadius:
                        "7px",
                      background:
                        "#0d6efd",
                      color:
                        "#fff",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    Edit
                  </button>

                  {/* AVAILABILITY */}

                  <button
                    onClick={() =>
                      toggleAvailability(
                        food
                      )
                    }
                    style={{
                      padding:
                        "9px 15px",
                      border:
                        "none",
                      borderRadius:
                        "7px",
                      background:
                        food.isAvailable
                          ? "#ffc107"
                          : "#198754",
                      color:
                        food.isAvailable
                          ? "#000"
                          : "#fff",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    {food.isAvailable
                      ? "Turn OFF"
                      : "Turn ON"}
                  </button>

                  {/* DELETE */}

                  <button
                    onClick={() =>
                      deleteFood(
                        food._id
                      )
                    }
                    style={{
                      padding:
                        "9px 15px",
                      border:
                        "none",
                      borderRadius:
                        "7px",
                      background:
                        "#dc3545",
                      color:
                        "#fff",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// INPUT STYLE
// =====================================================

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "7px",
  marginBottom: "16px",
  boxSizing: "border-box",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

export default Menu;
