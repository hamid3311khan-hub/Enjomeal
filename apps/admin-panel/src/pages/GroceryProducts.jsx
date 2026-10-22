import { useCallback, useEffect, useState } from "react";
import API from "../api/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  image: "",
  price: "",
  mrp: "",
  unit: "piece",
  stockQuantity: "0",
  isAvailable: true,
  isActive: true,
};

const UNITS = [
  "kg", "g", "litre", "ml", "piece",
  "pack", "dozen", "bottle", "box",
];

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "14px",
  background: "#fff",
  color: "#111827",
};

const buttonStyle = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
};

export default function GroceryProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/grocery/products/admin");
      const data = response.data;
      setProducts(
        Array.isArray(data) ? data :
        data.products || data.data?.products || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Grocery products load nahi ho sake."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await API.get("/api/categories?type=GROCERY");
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data.categories || data.data?.categories || [];
      setCategories(list.filter((item) => item.type === "GROCERY"));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Grocery categories load nahi ho sakin."
      );
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId("");
    setShowForm(false);
  };

  const changeField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const startEdit = (product) => {
    setError("");
    setMessage("");
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category?._id || product.category || "",
      image: product.image || "",
      price: String(product.price ?? ""),
      mrp: product.mrp == null ? "" : String(product.mrp),
      unit: product.unit || "piece",
      stockQuantity: String(product.stockQuantity ?? 0),
      isAvailable: product.isAvailable !== false,
      isActive: product.isActive !== false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const price = Number(form.price);
    const mrp = form.mrp === "" ? null : Number(form.mrp);
    const stockQuantity = Number(form.stockQuantity);

    if (!form.name.trim() || !form.category) {
      setError("Product name aur Grocery category select karein.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Valid selling price enter karein.");
      return;
    }
    if (mrp !== null && (!Number.isFinite(mrp) || mrp < price)) {
      setError("MRP selling price ke barabar ya usse zyada hona chahiye.");
      return;
    }
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      setError("Stock quantity zero ya usse zyada honi chahiye.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      image: form.image.trim(),
      price,
      mrp,
      unit: form.unit,
      stockQuantity,
      isAvailable: Boolean(form.isAvailable),
      isActive: Boolean(form.isActive),
    };

    try {
      setSaving(true);
      if (editingId) {
        await API.put(`/api/grocery/products/${editingId}`, payload);
        setMessage("Grocery product successfully update ho gaya.");
      } else {
        await API.post("/api/grocery/products", payload);
        setMessage("Grocery product successfully add ho gaya.");
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Product save nahi ho saka."
      );
    } finally {
      setSaving(false);
    }
  };

  const deactivateProduct = async (product) => {
    const confirmed = window.confirm(
      `"${product.name}" ko deactivate karna hai? Product public store se hide ho jayega.`
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      await API.delete(`/api/grocery/products/${product._id}`);
      setMessage("Product safely deactivate ho gaya.");
      await loadProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Product deactivate nahi ho saka."
      );
    }
  };

  const filteredProducts = products.filter((product) => {
    const term = search.trim().toLowerCase();
    const categoryId = product.category?._id || product.category || "";
    const matchesSearch =
      !term ||
      String(product.name || "").toLowerCase().includes(term) ||
      String(product.description || "").toLowerCase().includes(term);
    const matchesCategory =
      !categoryFilter || categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeCount = products.filter((p) => p.isActive !== false).length;
  const stockCount = products.filter((p) => Number(p.stockQuantity) > 0).length;

  return (
    <div style={{ color: "#111827", width: "100%", maxWidth: "1200px" }}>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "12px",
        alignItems: "center", justifyContent: "space-between",
        marginBottom: "20px",
      }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: "22px" }}>
            🛒 Grocery Products
          </h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            Grocery inventory, prices aur stock manage karein.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button
            type="button"
            onClick={() => { setError(""); setMessage(""); loadProducts(); loadCategories(); }}
            style={{ ...buttonStyle, background: "#e5e7eb", color: "#111827" }}
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              if (showForm && !editingId) resetForm();
              else {
                setEditingId("");
                setForm(EMPTY_FORM);
                setShowForm(true);
              }
            }}
            style={{ ...buttonStyle, background: "#15803d", color: "#fff" }}
          >
            + Add Product
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{
          background: "#fef2f2", color: "#b91c1c",
          border: "1px solid #fecaca", borderRadius: "8px",
          padding: "12px", marginBottom: "14px", overflowWrap: "anywhere",
        }}>{error}</div>
      )}
      {message && (
        <div role="status" style={{
          background: "#f0fdf4", color: "#166534",
          border: "1px solid #bbf7d0", borderRadius: "8px",
          padding: "12px", marginBottom: "14px", overflowWrap: "anywhere",
        }}>{message}</div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
        gap: "12px", marginBottom: "20px",
      }}>
        {[
          ["Total Products", products.length, "#eff6ff"],
          ["Active Products", activeCount, "#f0fdf4"],
          ["Products With Stock", stockCount, "#fff7ed"],
        ].map(([label, value, background]) => (
          <div key={label} style={{
            padding: "16px", borderRadius: "10px",
            background, border: "1px solid #e5e7eb",
          }}>
            <div style={{ color: "#6b7280", fontSize: "13px" }}>{label}</div>
            <div style={{ fontSize: "25px", fontWeight: 700, marginTop: "5px" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={submitForm} style={{
          padding: "18px", border: "1px solid #d1d5db",
          borderRadius: "12px", marginBottom: "22px",
          background: "#fff",
        }}>
          <h3 style={{ marginTop: 0 }}>
            {editingId ? "Edit Grocery Product" : "Add Grocery Product"}
          </h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}>
            <label style={{ fontSize: "13px", fontWeight: 600 }}>
              Product Name *
              <input name="name" value={form.name} onChange={changeField}
                required minLength={2} maxLength={150}
                placeholder="e.g. Basmati Rice" style={{ ...inputStyle, marginTop: "6px" }} />
            </label>

            <label style={{ fontSize: "13px", fontWeight: 600 }}>
              Grocery Category *
              <select name="category" value={form.category} onChange={changeField}
                required style={{ ...inputStyle, marginTop: "6px" }}>
                <option value="">Select category</option>
                {categories.filter((c) => c.isActive !== false).map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <small style={{ color: "#b91c1c", display: "block", marginTop: "5px" }}>
                  Pehle Categories page mein Grocery category add/activate karein.
                </small>
              )}
            </label>

            <label style={{ fontSize: "13px", fontWeight: 600 }}>
              Selling Price (₹) *
              <input name="price" type="number" value={form.price} onChange={changeField}
                required min="0" step="0.01" placeholder="100"
                style={{ ...inputStyle, marginTop: "6px" }} />
            </label>

            <label style={{ fontSize: "13px", fontWeight: 600 }}>
              MRP (₹)
              <input name="mrp" type="number" value={form.mrp} onChange={changeField}
                min="0" step="0.01" placeholder="120"
                style={{ ...inputStyle, marginTop: "6px" }} />
            </label>

            <label style={{ fontSize: "13px", fontWeight: 600 }}>
              Unit *
              <select name="unit" value={form.unit} onChange={changeField}
                required style={{ ...inputStyle, marginTop: "6px" }}>
                {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </label>

            <label style={{ fontSize: "13px", fontWeight: 600 }}>
              Stock Quantity *
              <input name="stockQuantity" type="number" value={form.stockQuantity}
                onChange={changeField} required min="0" step="0.01"
                style={{ ...inputStyle, marginTop: "6px" }} />
            </label>

            <label style={{ fontSize: "13px", fontWeight: 600, gridColumn: "1 / -1" }}>
              Image URL
              <input name="image" type="url" value={form.image} onChange={changeField}
                placeholder="https://example.com/product.jpg"
                style={{ ...inputStyle, marginTop: "6px" }} />
            </label>

            <label style={{ fontSize: "13px", fontWeight: 600, gridColumn: "1 / -1" }}>
              Description
              <textarea name="description" value={form.description} onChange={changeField}
                maxLength={2000} rows={3} placeholder="Product details..."
                style={{ ...inputStyle, marginTop: "6px", resize: "vertical" }} />
            </label>
          </div>

          <div style={{
            display: "flex", flexWrap: "wrap", gap: "18px",
            margin: "16px 0", fontSize: "14px",
          }}>
            <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="checkbox" name="isAvailable"
                checked={form.isAvailable} onChange={changeField} />
              Available for sale
            </label>
            <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="checkbox" name="isActive"
                checked={form.isActive} onChange={changeField} />
              Active product
            </label>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button disabled={saving} type="submit" style={{
              ...buttonStyle, background: "#15803d", color: "#fff",
              opacity: saving ? 0.65 : 1,
            }}>
              {saving ? "Saving..." : editingId ? "Update Product" : "Save Product"}
            </button>
            <button type="button" onClick={resetForm}
              style={{ ...buttonStyle, background: "#e5e7eb", color: "#111827" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{
        display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px",
      }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..." aria-label="Search products"
          style={{ ...inputStyle, flex: "1 1 220px" }} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by grocery category"
          style={{ ...inputStyle, flex: "1 1 200px" }}>
          <option value="">All Grocery Categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>{category.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Grocery products load ho rahe hain...</p>
      ) : filteredProducts.length === 0 ? (
        <div style={{
          padding: "28px 16px", textAlign: "center",
          border: "1px dashed #d1d5db", borderRadius: "10px", color: "#6b7280",
        }}>
          <div style={{ fontSize: "30px", marginBottom: "8px" }}>🛒</div>
          <strong>Koi grocery product nahi mila.</strong>
          <p style={{ marginBottom: 0 }}>Add Product par click karke pehla product add karein.</p>
        </div>
      ) : (
        <div style={{
          overflowX: "auto", background: "#fff",
          border: "1px solid #e5e7eb", borderRadius: "10px",
        }}>
          <table style={{
            width: "100%", borderCollapse: "collapse",
            minWidth: "850px", fontSize: "13px",
          }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                {["Product", "Category", "Price / MRP", "Stock", "Status", "Actions"].map((heading) => (
                  <th key={heading} style={{
                    padding: "12px", borderBottom: "1px solid #e5e7eb",
                  }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const categoryName =
                  product.category?.name ||
                  categories.find((c) => c._id === product.category)?.name ||
                  "—";
                const active = product.isActive !== false;
                const available = product.isAvailable !== false;
                const inStock = Number(product.stockQuantity) > 0;

                return (
                  <tr key={product._id}>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {product.image ? (
                          <img src={product.image} alt="" loading="lazy"
                            style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "7px" }}
                            onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <span style={{
                            width: "48px", height: "48px", borderRadius: "7px",
                            background: "#f3f4f6", display: "grid", placeItems: "center",
                            fontSize: "23px",
                          }}>🛍️</span>
                        )}
                        <div>
                          <strong>{product.name}</strong>
                          {product.description && (
                            <div style={{
                              color: "#6b7280", maxWidth: "220px",
                              overflow: "hidden", textOverflow: "ellipsis",
                              whiteSpace: "nowrap", marginTop: "4px",
                            }}>{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f3f4f6" }}>
                      {categoryName}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f3f4f6" }}>
                      <strong>₹{Number(product.price || 0).toFixed(2)}</strong>
                      {product.mrp != null && Number(product.mrp) > Number(product.price) && (
                        <div style={{ color: "#6b7280", textDecoration: "line-through", marginTop: "3px" }}>
                          ₹{Number(product.mrp).toFixed(2)}
                        </div>
                      )}
                      <div style={{ color: "#6b7280", marginTop: "3px" }}>per {product.unit || "piece"}</div>
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f3f4f6" }}>
                      {product.stockQuantity ?? 0} {product.unit || ""}
                      {!inStock && <div style={{ color: "#b91c1c", marginTop: "4px" }}>Out of stock</div>}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ color: active ? "#15803d" : "#b91c1c" }}>
                        {active ? "Active" : "Inactive"}
                      </div>
                      <div style={{ color: available && inStock ? "#15803d" : "#b45309", marginTop: "4px" }}>
                        {available && inStock ? "Available" : "Unavailable"}
                      </div>
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        <button type="button" onClick={() => startEdit(product)}
                          style={{ ...buttonStyle, background: "#dbeafe", color: "#1d4ed8" }}>
                          Edit
                        </button>
                        {active && (
                          <button type="button" onClick={() => deactivateProduct(product)}
                            style={{ ...buttonStyle, background: "#fee2e2", color: "#b91c1c" }}>
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "12px" }}>
        Note: Public Grocery Store mein product tabhi dikhega jab woh active, available aur stock mein ho.
      </p>
    </div>
  );
}
