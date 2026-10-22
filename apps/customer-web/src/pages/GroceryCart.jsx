import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function GroceryCart() {
const navigate = useNavigate();
const [cart, setCart] = useState({ items: [], totalAmount: 0 });
const [loading, setLoading] = useState(true);
const [busy, setBusy] = useState("");
const [error, setError] = useState("");

const loadCart = useCallback(async () => {
try {
setError("");
const { data } = await API.get("/grocery/cart");
setCart(data.cart || { items: [], totalAmount: 0 });
} catch (err) {
setError(err.response?.data?.message || "Cart load nahi hua.");
} finally {
setLoading(false);
}
}, []);

useEffect(() => {
loadCart();
}, [loadCart]);

async function updateQuantity(productId, quantity) {
try {
setBusy(productId);
setError("");
const { data } = await API.put(
`/grocery/cart/items/${productId}`,
{ quantity }
);
if (data.cart) setCart(data.cart);
else await loadCart();
} catch (err) {
setError(err.response?.data?.message || "Quantity update nahi hui.");
await loadCart();
} finally {
setBusy("");
}
}

async function removeItem(productId) {
try {
setBusy(productId);
setError("");
await API.delete(`/grocery/cart/items/${productId}`);
await loadCart();
} catch (err) {
setError(err.response?.data?.message || "Item remove nahi hua.");
} finally {
setBusy("");
}
}

if (loading) return <main style={{ padding: 20 }}>Grocery cart load ho raha hai...</main>;

return (
<main style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
<h1>🛒 Grocery Cart</h1>

  {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}

  {cart.items.length === 0 ? (
    <section>
      <p>Aapka Grocery Cart khaali hai.</p>
      <button onClick={() => navigate("/grocery")}>Grocery Shopping karein</button>
    </section>
  ) : (
    <>
      {cart.items.map((item) => {
        const product = item.product;
        if (!product) return null;

        return (
          <article key={product._id} style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 14,
            borderBottom: "1px solid #ddd",
            padding: "16px 0"
          }}>
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                style={{ width: 85, height: 85, objectFit: "contain" }}
              />
            )}

            <div style={{ flex: "1 1 160px" }}>
              <h3>{product.name}</h3>
              <p>₹{item.price} / {product.unit || "unit"}</p>
              <strong>₹{Number(item.price * item.quantity).toFixed(2)}</strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                disabled={busy === product._id}
                onClick={() => updateQuantity(product._id, item.quantity - 1)}
                aria-label={`Decrease ${product.name} quantity`}
              >−</button>
              <span>{item.quantity}</span>
              <button
                disabled={busy === product._id || item.quantity >= product.stockQuantity || item.quantity >= 100}
                onClick={() => updateQuantity(product._id, item.quantity + 1)}
                aria-label={`Increase ${product.name} quantity`}
              >+</button>
            </div>

            <button
              disabled={busy === product._id}
              onClick={() => removeItem(product._id)}
            >Remove</button>
          </article>
        );
      })}

      <section style={{ marginTop: 24 }}>
        <h2>Subtotal: ₹{Number(cart.totalAmount || 0).toFixed(2)}</h2>
        <p>Delivery fee aur applicable charges checkout par calculate honge.</p>
        <button onClick={() => navigate("/grocery/checkout")}>
          Proceed to Grocery Checkout
        </button>
        <button style={{ marginLeft: 10 }} onClick={() => navigate("/grocery")}>
          Continue Shopping
        </button>
      </section>
    </>
  )}
</main>

);
}
