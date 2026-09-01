import { io } from "socket.io-client";

const SOCKET_URL = "https://enjomeal-api.onrender.com";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("enjoMealToken");

  if (!token) {
    console.log("Socket token not found");
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log(
      "Socket connected:",
      socket.id
    );
  });

  socket.on("socket:connected", (data) => {
    console.log(
      "Real-time connection established:",
      data
    );
  });

  socket.on("disconnect", (reason) => {
    console.log(
      "Socket disconnected:",
      reason
    );
  });

  socket.on("connect_error", (error) => {
    console.error(
      "Socket connection error:",
      error.message
    );
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
