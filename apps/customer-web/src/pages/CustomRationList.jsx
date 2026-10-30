import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const makeItem = () => ({
  key: `${Date.now()}-${Math.random()}`,
  itemName: "",
  quantity: "1",
  unit: "kg",
  brand: "",
  description: "",
  image: "",
  uploading: false,
});

const units = [
  "kg", "g", "litre", "ml", "piece",
  "pack", "dozen", "bottle", "box",
];

export default function CustomRationList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([makeItem()]);
  const [customerNote, setCustomerNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, changes) =>
    setItems((old) =>
      old.map((item) =>
        item.key === key ? { ...item, ...changes } : item
      )
    );

  const uploadPhoto = async (key, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please image file select karein.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Photo 8 MB se chhoti honi chahiye.");
      return;
    }

    setError("");
    update(key, { uploading: true });

    try {
      const form = new FormData();
      form.append("image", file);

      const { data } = await API.post(
        "/uploads/ration-item-image",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (!data.success || !data.image) {
        throw new Error(data.message || "Photo upload fail hui.");
      }

      update(key, {
        image: data.image,
        uploading: false,
      });
    } catch (err) {
      update(key, { uploading: false });
      setError(
        err.response?.data?.message ||
        err.message ||
        "Photo upload fail hui."
      );
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (items.some((item) => item.uploading)) {
      setError("Photo upload complete hone dein.");
      return;
    }

    if (items.some((item) =>
      !item.itemName.trim() ||
      !Number.isFinite(Number(item.quantity)) ||
      Number(item.quantity) < 0.001 ||
      Number(item.quantity) > 100000
    )) {
      setError("Har item ka naam aur valid quantity zaroori hai.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        items: items.map((item) => ({
          itemName: item.itemName.trim(),
          quantity: Number(item.quantity),
          unit: item.unit,
          brand: item.brand.trim(),
          description: item.description.trim(),
          image: item.image,
        })),
        customerNote: customerNote.trim(),
      };

      const { data } = await API.post("/ration-requests", payload);

      if (data.request?._id) {
        navigate(`/ration-requests/${data.request._id}`);
      } else {
        navigate("/ration-requests");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Request submit nahi hui. Dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 850, margin: "auto", padding: 16 }}>
      <h1>🧺 Custom Ration List</h1>
      <p>
        Apne ghar ka ration list karein. Admin availability aur price
        batayega. Aapki approval ke bina order confirm nahi hoga.
      </p>

      {error && <p role="alert" style={{ color: "red" }}>{error}</p>}

      <form onSubmit={submit}>
        {items.map((item, index) => (
          <section
            key={item.key}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 14,
              margin: "16px 0",
            }}
          >
            <h2>Item {index + 1}</h2>

            <label>
              Item name *
              <input
                required
                maxLength={150}
                value={item.itemName}
                onChange={(e) =>
                  update(item.key, { itemName: e.target.value })
                }
                placeholder="Jaise chini, aata, chawal"
                style={{ display: "block", width: "100%", padding: 10 }}
              />
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <label style={{ flex: 1 }}>
                Quantity *
                <input
                  required
                  type="number"
                  min="0.001"
                  max="100000"
                  step="any"
                  value={item.quantity}
                  onChange={(e) =>
                    update(item.key, { quantity: e.target.value })
                  }
                  style={{ display: "block", width: "100%", padding: 10 }}
                />
              </label>

              <label style={{ flex: 1 }}>
                Unit
                <select
                  value={item.unit}
                  onChange={(e) =>
                    update(item.key, { unit: e.target.value })
                  }
                  style={{ display: "block", width: "100%", padding: 10 }}
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Company / Brand (optional)
              <input
                maxLength={100}
                value={item.brand}
                onChange={(e) =>
                  update(item.key, { brand: e.target.value })
                }
                style={{ display: "block", width: "100%", padding: 10 }}
              />
            </label>

            <label>
              Description (optional)
              <textarea
                maxLength={1000}
                rows={2}
                value={item.description}
                onChange={(e) =>
                  update(item.key, { description: e.target.value })
                }
                style={{ display: "block", width: "100%", padding: 10 }}
              />
            </label>

            <p>Item photo (optional)</p>

            <label>
              🖼️ Gallery se chunein
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  uploadPhoto(item.key, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>

            <br />

            <label>
              📷 Camera se photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  uploadPhoto(item.key, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>

            {item.uploading && <p>Photo upload ho rahi hai...</p>}

            {item.image && (
              <div>
                <img
                  src={item.image}
                  alt={`Item ${index + 1}`}
                  style={{ width: 100, height: 100, objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => update(item.key, { image: "" })}
                >
                  Photo hataayein
                </button>
              </div>
            )}

            {items.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setItems((old) => old.filter((x) => x.key !== item.key))
                }
              >
                Remove item
              </button>
            )}
          </section>
        ))}

        <button
          type="button"
          disabled={items.length >= 50}
          onClick={() => setItems((old) => [...old, makeItem()])}
        >
          + Add item ({items.length}/50)
        </button>

        <label style={{ display: "block", marginTop: 16 }}>
          Extra instructions (optional)
          <textarea
            rows={3}
            maxLength={1000}
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading || items.some((item) => item.uploading)}
          style={{
            display: "block",
            width: "100%",
            padding: 14,
            marginTop: 18,
            background: "#166534",
            color: "white",
            border: 0,
            borderRadius: 8,
          }}
        >
          {loading ? "Submitting..." : "Submit Ration Request"}
        </button>
      </form>
    </main>
  );
}
