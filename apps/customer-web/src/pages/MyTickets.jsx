import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api/api.js";

function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // FETCH MY TICKETS
  // ==========================================

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        "/tickets/my-tickets"
      );

      if (response.data.success) {
        setTickets(
          response.data.tickets || []
        );
      } else {
        setError(
          response.data.message ||
            "Unable to load tickets"
        );
      }
    } catch (err) {
      console.error(
        "Ticket Fetch Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load tickets"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (status) => {
    const styles = {
      OPEN: {
        background: "#fff3cd",
        color: "#856404",
      },

      IN_PROGRESS: {
        background: "#cfe2ff",
        color: "#084298",
      },

      RESOLVED: {
        background: "#d1e7dd",
        color: "#0f5132",
      },

      CLOSED: {
        background: "#e2e3e5",
        color: "#41464b",
      },
    };

    return styles[status] || styles.OPEN;
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
        }}
      >
        Loading your tickets...
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
        }}
      >
        <h2>
          Unable to load tickets
        </h2>

        <p>{error}</p>

        <button
          onClick={fetchTickets}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "850px",
        margin: "30px auto",
        padding: "20px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            🎫 My Support Tickets
          </h1>

          <p
            style={{
              color: "#666",
              marginBottom: 0,
            }}
          >
            Track your support requests.
          </p>
        </div>

        <button
          onClick={() =>
            navigate("/support")
          }
          style={{
            border: "none",
            borderRadius: "10px",
            padding: "12px 18px",
            background: "#e85d04",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          + Create Ticket
        </button>
      </div>

      {/* EMPTY STATE */}

      {tickets.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: "50px 20px",
            textAlign: "center",
            borderRadius: "16px",
          }}
        >
          <div
            style={{
              fontSize: "50px",
            }}
          >
            🎫
          </div>

          <h2>
            No support tickets yet
          </h2>

          <p>
            Create a support ticket if you
            need help.
          </p>

          <button
            onClick={() =>
              navigate("/support")
            }
          >
            Create Support Ticket
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "14px",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  {/* TICKET NUMBER */}

                  <div
                    style={{
                      display: "inline-block",
                      background: "#f1f1f1",
                      color: "#e85d04",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      marginBottom: "10px",
                    }}
                  >
                    🎫 Ticket ID:{" "}
                    {ticket.ticketNumber ||
                      "Not Available"}
                  </div>

                  <h3
                    style={{
                      marginTop: "5px",
                    }}
                  >
                    {ticket.subject}
                  </h3>

                  <p>
                    Category:{" "}
                    <strong>
                      {ticket.category}
                    </strong>
                  </p>

                  <p>
                    {ticket.message}
                  </p>

                  <small>
                    Created:{" "}
                    {new Date(
                      ticket.createdAt
                    ).toLocaleString()}
                  </small>

                  {/* ADMIN REPLY */}

                  {ticket.adminReply && (
                    <div
                      style={{
                        marginTop: "15px",
                        padding: "15px",
                        background:
                          "#f8f9fa",
                        borderRadius:
                          "10px",
                      }}
                    >
                      <strong>
                        Admin Reply:
                      </strong>

                      <p
                        style={{
                          marginBottom: 0,
                          marginTop: "8px",
                        }}
                      >
                        {ticket.adminReply}
                      </p>
                    </div>
                  )}
                </div>

                {/* STATUS */}

                <span
                  style={{
                    ...getStatusStyle(
                      ticket.status
                    ),
                    padding: "7px 12px",
                    borderRadius: "20px",
                    height: "fit-content",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {ticket.status.replace(
                    "_",
                    " "
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTickets;
