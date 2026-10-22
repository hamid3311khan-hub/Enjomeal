import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";

export default function GroceryProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;

    API.get(`/grocery/products/${id}`)
      .then(({ data }) => {
        if (active) setProduct(data.product || data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Product details abhi load nahi ho rahi hain."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const addToCart = async () => {
    if (!localStorage.getItem("enjoMealToken")) {
      navigate("/login");
      return;
    }

    setAdding(true);
    try {
      await API.post("/grocery/cart/add", {
        productId: product._id,
        quantity,
      });
      alert("Grocery cart mein product add ho gaya.");
      navigate("/grocery/cart");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Product cart mein add nahi ho paya."
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <main style={{ padding: 24 }}>Product load ho raha hai...</main>;
  }

  if (error || !product) {
    return (
      <main style={{ maxWidth: 900, margin: "auto", padding: 24 }}>
        <p role="alert">{error || "Product nahi mila."}</p>
        <button onClick={() => navigate("/grocery")}>
          Back to Grocery
        </button>
      </main>
    );
  }

  const available =
    product.isAvailable !== false &&
    product.isActive !== false &&
    Number(product.stockQuantity) > 0;

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "auto",
        padding: 20,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 24,
      }}
    >
      <section>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "contain",
              border: "1px solid #eee",
              borderRadius: 12,
            }}
          />
        ) : (
          <div style={{ padding: 60, textAlign: "center" }}>
            No product image
          </div>
        )}
      </section>

      <section>
        <button onClick={() => navigate("/grocery")}>
          ← Back to Grocery
        </button>

        <h1>{product.name}</h1>
        {product.category?.name && <p>Category: {product.category.name}</p>}
        <p>{product.description || "Product description available nahi hai."}</p>

        <p>
          <strong style={{ fontSize: 26 }}>₹{product.price}</strong>{" "}
          {Number(product.mrp) > Number(product.price) && (
            <del style={{ color: "#777" }}>₹{product.mrp}</del>
          )}
        </p>

        <p>Unit: {product.unit || "piece"}</p>
        <p>
          {available
            ? `Available stock: ${product.stockQuantity}`
            : "Currently out of stock"}
        </p>

        <label htmlFor="grocery-quantity">Quantity</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 20px" }}>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            −
          </button>
          <span id="grocery-quantity" aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() =>
              setQuantity((q) =>
                Math.min(Number(product.stockQuantity) || 1, q + 1)
              )
            }
            disabled={!available || quantity >= Number(product.stockQuantity)}
          >
            +
          </button>
        </div>

        <p>
          Total: <strong>₹{(Number(product.price) * quantity).toFixed(2)}</strong>
        </p>

        <button
          type="button"
          onClick={addToCart}
          disabled={!available || adding}
        >
          {adding ? "Adding..." : "Add to Grocery Cart"}
        </button>
      </section>
    </main>
  );
}
