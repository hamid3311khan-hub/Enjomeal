import {useEffect, useState, useRef} from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const emptyAddress = {
  name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  addressType: "HOME",
  isDefault: false,
};

export default function GroceryCheckout() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const checkoutLockRef = useRef(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCheckout = async () => {
    const [addressResponse, cartResponse] = await Promise.all([
      API.get("/addresses/my"),
      API.get("/grocery/cart"),
    ]);

    const addressData = addressResponse.data;
    const list = Array.isArray(addressData)
      ? addressData
      : addressData.addresses || addressData.data || addressData.results || [];

    setAddresses(list);

    const defaultAddress = list.find(
      (item) => item.isDefault || item.isDefaultAddress
    );

    if (defaultAddress) {
      setAddressId((current) => current || defaultAddress._id);
    }

    setCart(cartResponse.data.cart || { items: [], totalAmount: 0 });
  };

  useEffect(() => {
    let active = true;

    Promise.all([API.get("/addresses/my"), API.get("/grocery/cart")])
      .then(([addressResponse, cartResponse]) => {
        if (!active) return;

        const addressData = addressResponse.data;
        const list = Array.isArray(addressData)
          ? addressData
          : addressData.addresses || addressData.data || addressData.results || [];

        setAddresses(list);

        const defaultAddress = list.find(
          (item) => item.isDefault || item.isDefaultAddress
        );

        if (defaultAddress) setAddressId(defaultAddress._id);

        setCart(cartResponse.data.cart || { items: [], totalAmount: 0 });
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Address ya grocery cart load nahi ho paya."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateAddressField = (event) => {
    const { name, value, type, checked } = event.target;

    setNewAddress((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!/^[0-9]{6}$/.test(newAddress.pincode.trim())) {
      setError("Pincode 6 digits ka hona chahiye.");
      return;
    }

    if (!/^[0-9+\-\s]{10,15}$/.test(newAddress.phone.trim())) {
      setError("Phone number check karein.");
      return;
    }

    setSavingAddress(true);

    try {
      const payload = {
        ...newAddress,
        name: newAddress.name.trim(),
        phone: newAddress.phone.trim(),
        address: newAddress.address.trim(),
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        pincode: newAddress.pincode.trim(),
        landmark: newAddress.landmark.trim(),
      };

      const { data } = await API.post("/addresses/add", payload);
      const savedAddress = data.address;

      if (!data.success || !savedAddress?._id) {
        throw new Error(data.message || "Address save verify nahi ho paya.");
      }

      await loadCheckout();
      setAddressId(savedAddress._id);
      setNewAddress(emptyAddress);
      setShowAddressForm(false);
      setNotice("Delivery address successfully save ho gaya.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Address save nahi ho paya."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    if (checkoutLockRef.current) return;

    if (!addressId) {
      setError("Pehle delivery address select karein.");
      return;
    }

    if (!cart?.items?.length) {
      setError("Grocery cart khaali hai.");
      return;
    }

    checkoutLockRef.current = true;
    setPlacing(true);
    setError("");
    setNotice("");

    try {
      // Reuse the same key if a previous request may have succeeded
      // but its response was lost.
      let checkoutKey = sessionStorage.getItem(
        "enjoMealGroceryCheckoutKey"
      );

      if (!checkoutKey || !/^[a-zA-Z0-9_-]{8,100}$/.test(checkoutKey)) {
        checkoutKey =
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : "grocery_" +
              Date.now().toString(36) +
              "_" +
              Math.random().toString(36).slice(2, 14);

        sessionStorage.setItem("enjoMealGroceryCheckoutKey", checkoutKey);
      }

      const { data } = await API.post(
        "/grocery/orders/create",
        { addressId, paymentMethod },
        { headers: { "Idempotency-Key": checkoutKey } }
      );

      const order = data.order || data.groceryOrder || data.data;

      if (!data.success || !order?._id) {
        throw new Error(
          data.message ||
            "Order response verify nahi ho paya. My Orders mein check karein."
        );
      }

      // Clear only after receiving a confirmed order response.
      sessionStorage.removeItem("enjoMealGroceryCheckoutKey");

      navigate(`/grocery/orders/${order._id}`, {
        replace: true,
        state: { order },
      });
    } catch (err) {
      // Keep the key on failure so a safe retry can reuse it.
      setError(
        err.response?.data?.message ||
          err.message ||
          "Grocery order place nahi ho paya. Retry karne se pehle My Orders check karein."
      );
    } finally {
      checkoutLockRef.current = false;
      setPlacing(false);
    }
  };

  if (loading) {
    return <main style={{ padding: 24 }}>Checkout load ho raha hai...</main>;
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: 11,
    marginTop: 5,
    border: "1px solid #ccc",
    borderRadius: 7,
  };

  return (
    <main style={{ maxWidth: 850, margin: "auto", padding: 20 }}>
      <h1>Grocery Checkout</h1>

      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      {notice && (
        <p role="status" style={{ color: "green" }}>
          {notice}
        </p>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2>Delivery Address</h2>

        {addresses.length === 0 && !showAddressForm && (
          <p>Saved address nahi mila. Delivery address add karein.</p>
        )}

        {addresses.map((item) => (
          <label
            key={item._id}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              border:
                addressId === item._id
                  ? "2px solid #16803c"
                  : "1px solid #ddd",
              borderRadius: 10,
              padding: 14,
              marginBottom: 10,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="grocery-address"
              checked={addressId === item._id}
              onChange={() => setAddressId(item._id)}
            />
            <span>
              <strong>{item.name || "Delivery Address"}</strong>
              <br />
              {item.address}
              {item.landmark ? `, ${item.landmark}` : ""}
              <br />
              {item.city}, {item.state} - {item.pincode}
              <br />
              Phone: {item.phone}
            </span>
          </label>
        ))}

        <button
          type="button"
          onClick={() => {
            setShowAddressForm((current) => !current);
            setError("");
          }}
        >
          {showAddressForm ? "Cancel Add Address" : "+ Add New Address"}
        </button>

        {showAddressForm && (
          <form
            onSubmit={saveAddress}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 16,
              marginTop: 16,
              display: "grid",
              gap: 12,
            }}
          >
            <h3>New Delivery Address</h3>

            <label>
              Full Name *
              <input
                style={inputStyle}
                name="name"
                value={newAddress.name}
                onChange={updateAddressField}
                autoComplete="name"
                required
                maxLength={100}
              />
            </label>

            <label>
              Phone Number *
              <input
                style={inputStyle}
                name="phone"
                type="tel"
                value={newAddress.phone}
                onChange={updateAddressField}
                autoComplete="tel"
                required
                minLength={10}
                maxLength={15}
              />
            </label>

            <label>
              House / Street / Full Address *
              <textarea
                style={inputStyle}
                name="address"
                value={newAddress.address}
                onChange={updateAddressField}
                autoComplete="street-address"
                required
                maxLength={300}
                rows={3}
              />
            </label>

            <label>
              City *
              <input
                style={inputStyle}
                name="city"
                value={newAddress.city}
                onChange={updateAddressField}
                autoComplete="address-level2"
                required
                maxLength={100}
              />
            </label>

            <label>
              State *
              <input
                style={inputStyle}
                name="state"
                value={newAddress.state}
                onChange={updateAddressField}
                autoComplete="address-level1"
                required
                maxLength={100}
              />
            </label>

            <label>
              Pincode *
              <input
                style={inputStyle}
                name="pincode"
                inputMode="numeric"
                value={newAddress.pincode}
                onChange={updateAddressField}
                autoComplete="postal-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
              />
            </label>

            <label>
              Landmark (optional)
              <input
                style={inputStyle}
                name="landmark"
                value={newAddress.landmark}
                onChange={updateAddressField}
                maxLength={150}
              />
            </label>

            <label>
              Address Type
              <select
                style={inputStyle}
                name="addressType"
                value={newAddress.addressType}
                onChange={updateAddressField}
              >
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                name="isDefault"
                checked={newAddress.isDefault}
                onChange={updateAddressField}
              />
              Set as default address
            </label>

            <button type="submit" disabled={savingAddress}>
              {savingAddress ? "Address save ho raha hai..." : "Save Address"}
            </button>
          </form>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Payment Method</h2>

        <label style={{ display: "block", marginBottom: 12 }}>
          <input
            type="radio"
            name="payment"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
          />{" "}
          Cash on Delivery (COD)
        </label>

        <label style={{ display: "block" }}>
          <input
            type="radio"
            name="payment"
            value="QR"
            checked={paymentMethod === "QR"}
            onChange={() => setPaymentMethod("QR")}
          />{" "}
          QR Payment
        </label>

        {paymentMethod === "QR" && (
          <p>
            QR option select karne se payment automatically verify nahi hota.
            Payment status backend par confirm hone tak pending reh sakta hai.
          </p>
        )}
      </section>

      <section style={{ borderTop: "1px solid #ddd", paddingTop: 16 }}>
        <h2>Order Summary</h2>

        {cart?.items?.map((item) => {
          const product = item.product;
          const name = product?.name || item.productName || "Grocery product";
          const price = Number(product?.price ?? item.price ?? 0);

          return (
            <p key={product?._id || item._id || name}>
              {name} × {item.quantity} — ₹
              {(price * item.quantity).toFixed(2)}
            </p>
          );
        })}

        <p>
          Cart subtotal: ₹{Number(cart?.totalAmount || 0).toFixed(2)}
        </p>
        <p>
          Final delivery fee, platform charge aur total backend calculate
          karega.
        </p>

        <button
          onClick={placeOrder}
          disabled={
            placing ||
            savingAddress ||
            !addressId ||
            !cart?.items?.length
          }
        >
          {placing ? "Order place ho raha hai..." : "Place Grocery Order"}
        </button>

        <button
          onClick={() => navigate("/grocery/cart")}
          disabled={placing}
          style={{ marginLeft: 10 }}
        >
          Back to Grocery Cart
        </button>
      </section>
    </main>
  );
}
