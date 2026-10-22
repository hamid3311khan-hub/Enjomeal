import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function GroceryList() {
const navigate = useNavigate();
const [products, setProducts] = useState([]);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

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

const filtered = products.filter((p) =>
p.name?.toLowerCase().includes(search.toLowerCase())
);

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

  {!loading && !error && filtered.length === 0 && (
    <p>Abhi koi grocery product available nahi hai.</p>
  )}

  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    gap: 16
  }}>
    {filtered.map((p) => (
      <article key={p._id} style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 14
      }}>
        {p.image && (
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            style={{ width: "100%", height: 140, objectFit: "contain" }}
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
