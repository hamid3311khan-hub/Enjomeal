import { useEffect, useState } from "react";
import API from "../api/api";

const TYPES = [
  { value: "FOOD", label: "Food Categories", icon: "🍽️" },
  { value: "RESTAURANT", label: "Restaurant Categories", icon: "🏪" },
  { value: "GROCERY", label: "Grocery Categories", icon: "🛒" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  image: "",
  sortOrder: "0",
  isActive: true,
};

export default function Categories() {
  const [type, setType] = useState("FOOD");
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadCategories = async (selectedType = type) => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get(
        `/categories/admin?type=${selectedType}`
      );
      setCategories(response.data.categories || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Categories load nahi ho sakin."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(type);
  }, [type]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId("");
    setShowForm(false);
  };

  const handleChange = (event) => {
    const { name, value, checked, type: inputType } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: inputType === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      sortOrder: Number(form.sortOrder || 0),
      isActive: Boolean(form.isActive),
      type,
    };

    try {
      setSaving(true);

      if (editingId) {
        await API.put(`/categories/${editingId}`, payload);
        setMessage("Category successfully update ho gayi.");
      } else {
        await API.post("/categories", payload);
        setMessage("Category successfully add ho gayi.");
      }

      resetForm();
      await loadCategories(type);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Category save nahi ho saki."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    setError("");
    setMessage("");
    setEditingId(category._id);
    setForm({
      name: category.name || "",
      description: category.description || "",
      image: category.image || "",
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.isActive !== false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (category) => {
    const action = category.isActive ? "deactivate" : "activate";
    if (
      !window.confirm(
        `${category.name} ko ${action} karna chahte hain?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await API.put(`/categories/${category._id}`, {
        isActive: !category.isActive,
      });
      setMessage(
        category.isActive
          ? "Category deactivate kar di gayi."
          : "Category activate kar di gayi."
      );
      await loadCategories(type);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Category status change nahi hua."
      );
    }
  };

  const deleteCategory = async (category) => {
    if (
      !window.confirm(
        `"${category.name}" ko permanently delete karna hai? Agar category existing items ke use mein hai, backend deletion rok sakta hai.`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await API.delete(`/categories/${category._id}`);
      setMessage("Category delete ho gayi.");
      await loadCategories(type);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Category delete nahi ho saki. Use deactivate kar sakte hain."
      );
    }
  };

  const styles = {
    page: {
      width: "100%",
      boxSizing: "border-box",
      color: "#1f2937",
    },
    tabs: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      margin: "16px 0 22px",
    },
    tab: {
      border: "1px solid #d1d5db",
      borderRadius: 10,
      padding: "11px 15px",
      cursor: "pointer",
      fontWeight: 600,
      background: "#fff",
      color: "#374151",
    },
    activeTab: {
      background: "#fff0e8",
      border: "1px solid #f97316",
      color: "#c2410c",
    },
    panel: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 16,
      marginBottom: 18,
    },
    field: {
      width: "100%",
      boxSizing: "border-box",
      padding: 11,
      border: "1px solid #d1d5db",
      borderRadius: 8,
      fontSize: 14,
      marginTop: 6,
    },
    label: {
      display: "block",
      fontWeight: 600,
      fontSize: 13,
      marginBottom: 12,
    },
    primary: {
      background: "#ea580c",
      color: "#fff",
      border: 0,
      borderRadius: 8,
      padding: "11px 15px",
      fontWeight: 600,
      cursor: "pointer",
    },
    secondary: {
      background: "#f3f4f6",
      color: "#374151",
      border: "1px solid #d1d5db",
      borderRadius: 8,
      padding: "9px 12px",
      cursor: "pointer",
      fontWeight: 600,
    },
    smallButton: {
      border: "1px solid #d1d5db",
      background: "#fff",
      borderRadius: 7,
      padding: "7px 9px",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
    },
  };

  const selectedType = TYPES.find((item) => item.value === type);

  return (
    <div style={styles.page}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Category Management</h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            Food, restaurant aur grocery categories manage karein.
          </p>
        </div>

        <button
          type="button"
          style={styles.primary}
          onClick={() => {
            setError("");
            setMessage("");
            setForm(EMPTY_FORM);
            setEditingId("");
            setShowForm((value) => !value);
          }}
        >
          {showForm && !editingId ? "Cancel" : "+ Add Category"}
        </button>
      </div>

      <div style={styles.tabs}>
        {TYPES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              resetForm();
              setType(item.value);
              setMessage("");
              setError("");
            }}
            style={{
              ...styles.tab,
              ...(type === item.value ? styles.activeTab : {}),
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: 12,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            background: "#f0fdf4",
            color: "#166534",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: 12,
            marginBottom: 14,
          }}
        >
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.panel}>
          <h3 style={{ marginTop: 0 }}>
            {editingId ? "Edit Category" : "Add New Category"}
          </h3>

          <p style={{ color: "#6b7280", fontSize: 13 }}>
            Category type: <strong>{selectedType?.label}</strong>
          </p>

          <label style={styles.label}>
            Category Name *
            <input
              style={styles.field}
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              maxLength={100}
              required
              placeholder={
                type === "FOOD"
                  ? "e.g. Sweets / Mithai"
                  : type === "RESTAURANT"
                    ? "e.g. North Indian"
                    : "e.g. Fruits & Vegetables"
              }
            />
          </label>

          <label style={styles.label}>
            Description
            <textarea
              style={{ ...styles.field, minHeight: 75, resize: "vertical" }}
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={500}
              placeholder="Short description (optional)"
            />
          </label>

          <label style={styles.label}>
            Image URL (optional)
            <input
              style={styles.field}
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              maxLength={2000}
              placeholder="https://..."
            />
          </label>

          <label style={styles.label}>
            Sort Order
            <input
              style={styles.field}
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              value={form.sortOrder}
              onChange={handleChange}
            />
          </label>

          {editingId && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              Category active hai
            </label>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" style={styles.primary} disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Category"}
            </button>
            <button
              type="button"
              style={styles.secondary}
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.panel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 4px" }}>{selectedType?.label}</h3>
            <span style={{ color: "#6b7280", fontSize: 13 }}>
              {categories.length} categories
            </span>
          </div>
          <button
            type="button"
            style={styles.secondary}
            onClick={() => loadCategories(type)}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p>Categories load ho rahi hain...</p>
        ) : categories.length === 0 ? (
          <div
            style={{
              padding: "24px 10px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            Abhi koi category nahi hai. “Add Category” se pehli category banayein.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {categories.map((category) => (
              <div
                key={category._id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 13,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {category.image ? (
                  <img
                    src={category.image}
                    alt=""
                    loading="lazy"
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      objectFit: "cover",
                      background: "#f3f4f6",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      display: "grid",
                      placeItems: "center",
                      background: "#fff7ed",
                      fontSize: 25,
                    }}
                  >
                    {selectedType?.icon}
                  </div>
                )}

                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <strong>{category.name}</strong>
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: 13,
                      marginTop: 4,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {category.description || "No description"}
                  </div>
                  <div
                    style={{
                      marginTop: 7,
                      display: "flex",
                      gap: 7,
                      alignItems: "center",
                      flexWrap: "wrap",
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        background: category.isActive ? "#dcfce7" : "#f3f4f6",
                        color: category.isActive ? "#166534" : "#4b5563",
                        borderRadius: 20,
                        padding: "3px 8px",
                      }}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                    <span style={{ color: "#6b7280" }}>
                      Order: {category.sortOrder ?? 0}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={styles.smallButton}
                    onClick={() => startEdit(category)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    style={styles.smallButton}
                    onClick={() => toggleActive(category)}
                  >
                    {category.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.smallButton,
                      color: "#b91c1c",
                      borderColor: "#fecaca",
                    }}
                    onClick={() => deleteCategory(category)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
