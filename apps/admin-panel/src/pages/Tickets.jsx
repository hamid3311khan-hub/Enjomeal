import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function Tickets() {
  const [tickets, setTickets] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);

  const [replies, setReplies] =
    useState({});

  // ===============================
  // GET ALL SUPPORT TICKETS
  // ===============================

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "enjoMealToken"
        );

      const response = await fetch(
        `${API_URL}/api/tickets/admin/all`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch tickets"
        );
      }

      const fetchedTickets =
        data.tickets || [];

      setTickets(
        fetchedTickets
      );

      // Existing replies load
      const replyData = {};

      fetchedTickets.forEach(
        (ticket) => {
          replyData[ticket._id] =
            ticket.adminReply || "";
        }
      );

      setReplies(replyData);

    } catch (error) {
      console.error(
        "Fetch tickets error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // ===============================
  // UPDATE TICKET
  // STATUS + ADMIN REPLY
  // ===============================

  const updateTicket = async (
    ticketId,
    status
  ) => {
    try {
      setUpdatingId(ticketId);

      const token =
        localStorage.getItem(
          "enjoMealToken"
        );

      const adminReply =
        replies[ticketId] || "";

      const response = await fetch(
        `${API_URL}/api/tickets/admin/${ticketId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            status,
            adminReply,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update ticket"
        );
      }

      setTickets(
        (currentTickets) =>
          currentTickets.map(
            (ticket) =>
              ticket._id === ticketId
                ? data.ticket
                : ticket
          )
      );

      alert(
        "Ticket updated successfully"
      );

    } catch (error) {
      alert(
        error.message ||
          "Failed to update ticket"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ===============================
  // REPLY CHANGE
  // ===============================

  const handleReplyChange = (
    ticketId,
    value
  ) => {
    setReplies((currentReplies) => ({
      ...currentReplies,
      [ticketId]: value,
    }));
  };

  // ===============================
  // STATUS COLOR
  // ===============================

  const getStatusStyle = (status) => {
    switch (status) {
      case "OPEN":
        return {
          background: "#fff3cd",
          color: "#856404",
        };

      case "IN_PROGRESS":
        return {
          background: "#cfe2ff",
          color: "#084298",
        };

      case "RESOLVED":
        return {
          background: "#d1e7dd",
          color: "#0f5132",
        };

      case "CLOSED":
        return {
          background: "#e2e3e5",
          color: "#41464b",
        };

      default:
        return {
          background: "#f1f1f1",
          color: "#333",
        };
    }
  };

  // ===============================
  // LOADING
  // ===============================

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
          fontSize: "18px",
        }}
      >
        Loading support tickets...
      </div>
    );
  }

  // ===============================
  // ERROR
  // ===============================

  if (error) {
    return (
      <div
        style={{
          padding: "30px",
        }}
      >
        <h2>
          Support Tickets
        </h2>

        <p
          style={{
            color: "red",
          }}
        >
          {error}
        </p>

        <button
          onClick={fetchTickets}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            🎫 Support Tickets
          </h1>

          <p
            style={{
              color: "#666",
              marginTop: "8px",
            }}
          >
            Manage customer support
            requests.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          style={{
            padding:
              "10px 18px",
            border: "none",
            borderRadius: "8px",
            background:
              "#e85d04",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* EMPTY STATE */}

      {tickets.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "#fff",
            borderRadius: "15px",
          }}
        >
          <div
            style={{
              fontSize: "60px",
            }}
          >
            🎫
          </div>

          <h2>
            No support tickets
          </h2>

          <p
            style={{
              color: "#777",
            }}
          >
            Customer support
            requests will appear here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "22px",
                boxShadow:
                  "0 4px 15px rgba(0,0,0,0.08)",
              }}
            >
              {/* TOP */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin:
                        "0 0 8px",
                    }}
                  >
                    {ticket.subject}
                  </h3>

                  <span
                    style={{
                      display:
                        "inline-block",
                      padding:
                        "6px 12px",
                      borderRadius:
                        "20px",
                      fontSize:
                        "13px",
                      fontWeight:
                        "600",
                      ...getStatusStyle(
                        ticket.status
                      ),
                    }}
                  >
                    {ticket.status ||
                      "OPEN"}
                  </span>
                </div>

                <div
                  style={{
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  {ticket.createdAt &&
                    new Date(
                      ticket.createdAt
                    ).toLocaleString()}
                </div>
              </div>

              {/* TICKET NUMBER */}

              <div
                style={{
                  marginTop: "15px",
                }}
              >
                <strong>
                  Ticket Number:
                </strong>{" "}

                <span
                  style={{
                    fontFamily:
                      "monospace",
                    fontWeight: "700",
                    color: "#e85d04",
                  }}
                >
                  {ticket.ticketNumber ||
                    "Not available"}
                </span>
              </div>

              {/* CUSTOMER */}

              <div
                style={{
                  marginTop: "18px",
                }}
              >
                <strong>
                  Customer:
                </strong>{" "}

                {ticket.customer?.name ||
                  "Unknown"}

                <br />

                <span
                  style={{
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  {ticket.customer?.email ||
                    ""}
                </span>
              </div>

              {/* CATEGORY */}

              <div
                style={{
                  marginTop: "15px",
                }}
              >
                <strong>
                  Category:
                </strong>{" "}

                {ticket.category ||
                  "OTHER"}
              </div>

              {/* MESSAGE */}

              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  background: "#f8f9fa",
                  borderRadius: "10px",
                }}
              >
                <strong>
                  Customer Message
                </strong>

                <p
                  style={{
                    marginBottom: 0,
                    lineHeight: "1.6",
                    color: "#444",
                  }}
                >
                  {ticket.message}
                </p>
              </div>

              {/* ADMIN REPLY */}

              <div
                style={{
                  marginTop: "20px",
                }}
              >
                <strong>
                  Admin Reply:
                </strong>

                <textarea
                  value={
                    replies[ticket._id] || ""
                  }
                  onChange={(event) =>
                    handleReplyChange(
                      ticket._id,
                      event.target.value
                    )
                  }
                  disabled={
                    updatingId ===
                    ticket._id
                  }
                  placeholder="Write a reply to the customer..."
                  rows="4"
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    padding: "12px",
                    borderRadius: "8px",
                    border:
                      "1px solid #ddd",
                    boxSizing:
                      "border-box",
                    resize: "vertical",
                  }}
                />

                {ticket.repliedBy && (
                  <small
                    style={{
                      color: "#666",
                    }}
                  >
                    Last replied by:{" "}
                    {ticket.repliedBy.name ||
                      "Admin"}
                  </small>
                )}
              </div>

              {/* STATUS CONTROL */}

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <strong>
                  Update Status:
                </strong>

                <select
                  defaultValue={
                    ticket.status ||
                    "OPEN"
                  }
                  disabled={
                    updatingId ===
                    ticket._id
                  }
                  onChange={(event) =>
                    updateTicket(
                      ticket._id,
                      event.target.value
                    )
                  }
                  style={{
                    padding:
                      "10px 14px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #ddd",
                    cursor:
                      "pointer",
                    minWidth:
                      "180px",
                  }}
                >
                  <option value="OPEN">
                    OPEN
                  </option>

                  <option value="IN_PROGRESS">
                    IN PROGRESS
                  </option>

                  <option value="RESOLVED">
                    RESOLVED
                  </option>

                  <option value="CLOSED">
                    CLOSED
                  </option>
                </select>

                <button
                  onClick={() =>
                    updateTicket(
                      ticket._id,
                      ticket.status ||
                        "OPEN"
                    )
                  }
                  disabled={
                    updatingId ===
                    ticket._id
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border: "none",
                    borderRadius:
                      "8px",
                    background:
                      "#e85d04",
                    color: "#fff",
                    fontWeight:
                      "600",
                    cursor:
                      "pointer",
                  }}
                >
                  {updatingId ===
                  ticket._id
                    ? "Updating..."
                    : "Save Reply"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Tickets;
