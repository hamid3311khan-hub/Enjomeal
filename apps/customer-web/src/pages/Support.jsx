import { useState } from "react"; import { useNavigate } from 
"react-router-dom";

function Support() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!subject || !category || !message) {
      alert("Please fill all required fields");
      return;
    }

    // Backend API integration next step
    console.log({
      subject,
      category,
      message,
    });

    alert("Your support request is ready to submit");

    setSubject("");
    setCategory("");
    setMessage("");
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "30px auto",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "25px",
          borderRadius: "16px",
          boxShadow:
            "0 5px 25px rgba(0,0,0,0.08)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "15px",
          }}
        >
          ← Back
        </button>

        <h1
          style={{
            marginTop: 0,
          }}
        >
          🛟 Customer Support
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "25px",
          }}
        >
          Need help? Tell us about your issue and our
          support team will assist you.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Subject *
            </label>

            <input
              type="text"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
              placeholder="Enter issue subject"
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                boxSizing: "border-box",
                fontSize: "15px",
              }}
            />
          </div>

          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Category *
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                background: "#fff",
                fontSize: "15px",
              }}
            >
              <option value="">
                Select category
              </option>

              <option value="ORDER">
                Order Issue
              </option>

              <option value="PAYMENT">
                Payment Issue
              </option>

              <option value="DELIVERY">
                Delivery Issue
              </option>

              <option value="REFUND">
                Refund Issue
              </option>

              <option value="ACCOUNT">
                Account Issue
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>
          </div>

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Describe your issue *
            </label>

            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Explain your problem in detail..."
              rows="6"
              maxLength="1000"
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                boxSizing: "border-box",
                resize: "vertical",
                fontSize: "15px",
              }}
            />

            <small
              style={{
                color: "#888",
              }}
            >
              {message.length}/1000
            </small>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "10px",
              background: "#e85d04",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Submit Support Ticket
          </button>
        </form>

        <div
          style={{
            marginTop: "25px",
            padding: "15px",
            background: "#f8f9fa",
            borderRadius: "10px",
          }}
        >
          <strong>Already submitted a ticket?</strong>
		<p
  style={{
    marginTop: "8px",
    marginBottom: "0",
  }}
>
  Track your support requests and check their status.
</p>

<button
  type="button"
  onClick={() =>
    navigate("/my-tickets")
  }
  style={{
    marginTop: "15px",
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#e85d04",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  }}
>
  My Tickets
</button>	
	
          <br />

          <button
            onClick={() =>
              navigate("/my-tickets")
            }
            style={{
              marginTop: "10px",
              border: "none",
              background: "transparent",
              color: "#e85d04",
              fontWeight: "700",
              cursor: "pointer",
              padding: 0,
            }}
          >
            View My Tickets →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Support;
