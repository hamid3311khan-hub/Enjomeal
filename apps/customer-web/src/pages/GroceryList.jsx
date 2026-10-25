import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function GroceryList() {
const navigate = useNavigate();
const [products, setProducts] = useState([]);
const [search, setSearch] = useState("");
const [categories, setCategories] = useState([]);
const [selectedCategory, setSelectedCategory] = useState("All");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
  let active = true;
  API.get("/categories?type=GROCERY")
    .then(({ data }) => {
      if (active) setCategories(data.categories || []);
    })
    .catch(() => {
      if (active) setCategories([]);
    });
  return () => { active = false; };
}, []);

useEffect(() => {
let active = true;

API.get("/grocery/products")
  .then(({ data }) => {
    if (active) setProducts(data.products || []);
  })
  .catch(() => {
    if (active) setError("Grocery products abhi load nahi ho rahe.");
  })
  .finally(() => {
    if (active) setLoading(false);
  });

return () => { active = false; };

}, []);

const filtered = products.filter((p) => {
  const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
  const categoryId =
    typeof p.category === "object" && p.category
      ? String(p.category._id)
      : String(p.category || "");
  const matchesCategory =
    selectedCategory === "All" || categoryId === selectedCategory;
  return matchesSearch && matchesCategory;
});



return (
<main style={{ maxWidth: 1200, margin: "auto", padding: 20 }}>
<h1>🛒 Grocery Store</h1>
<p>Daily essentials, fresh products aur ghar ka ration.</p>

  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Grocery product search karein..."
    aria-label="Search grocery products"
    style={{ width: "100%", maxWidth: 500, padding: 12, marginBottom: 20 }}
  />

  {loading && <p>Products load ho rahe hain...</p>}
  {error && <p role="alert">{error}</p>}



  <div
    style={{
      display: "flex",
      gap: 8,
      overflowX: "auto",
      paddingBottom: 12,
      marginBottom: 16,
      WebkitOverflowScrolling: "touch"
    }}
    aria-label="Grocery categories"
  >
    <button
      type="button"
      onClick={() => setSelectedCategory("All")}
      aria-pressed={selectedCategory === "All"}
      style={{
        flex: "0 0 auto",
        padding: "9px 16px",
        borderRadius: 22,
        border: "1px solid #166534",
        background: selectedCategory === "All" ? "#166534" : "#fff",
        color: selectedCategory === "All" ? "#fff" : "#166534",
        cursor: "pointer"
      }}
    >
      All
    </button>
    {categories.map((category) => (
      <button
        key={category._id}
        type="button"
        onClick={() => setSelectedCategory(String(category._id))}
        aria-pressed={selectedCategory === String(category._id)}
        style={{
          flex: "0 0 auto",
          padding: "9px 16px",
          borderRadius: 22,
          border: "1px solid #166534",
          background: selectedCategory === String(category._id) ? "#166534" : "#fff",
          color: selectedCategory === String(category._id) ? "#fff" : "#166534",
          cursor: "pointer"
        }}
      >
        {category.name}
      </button>
    ))}
  </div>

  {!loading && !error && filtered.length === 0 && (
    <p>Is category mein abhi koi product available nahi hai.</p>
  )}

  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))",
    gap: 10
  }}>
    {filtered.map((p) => (
      <article key={p._id} style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 9
      }}>
        {p.image && (
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            style={{ width: "100%", height: 100, objectFit: "contain" }}
          />
        )}
        <h3>{p.name}</h3>
        <p>{p.unit || "unit"} · Stock: {p.stockQuantity}</p>
        <p>
          <strong>₹{p.price}</strong>{" "}
          {p.mrp > p.price && (
            <del style={{ color: "#777" }}>₹{p.mrp}</del>
          )}
        </p>
        <button onClick={() => navigate(`/grocery/product/${p._id}`)}>
          View product
        </button>
      </article>
    ))}
  </div>
</main>

);
}
