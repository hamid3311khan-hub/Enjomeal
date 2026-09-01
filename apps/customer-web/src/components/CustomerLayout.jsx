import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "./Header";
import { getSocket } from "../socket";

function CustomerLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem(
          "enjoMealToken"
        );

        if (!token) {
          return;
        }

        const response = await fetch(
          "https://enjomeal-api.onrender.com/api/notifications/unread",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setUnreadCount(
            data.totalUnread || 0
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch unread notifications:",
          error
        );
      }
    };

    fetchUnreadCount();
  }, []);

  // Global real-time notification listener
  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      console.warn(
        "Socket is not connected yet"
      );
      return;
    }

    const handleNewNotification = (data) => {
      console.log(
        "New real-time notification:",
        data
      );

      if (!data?.notification) {
        return;
      }

      setUnreadCount((previousCount) =>
        previousCount + 1
      );

      // Play notification sound
      try {
        const audio = new Audio(
          "/notification.mp3"
        );

        audio.volume = 0.6;

        audio.play().catch(() => {
          console.log(
            "Notification sound could not play"
          );
        });
      } catch (error) {
        console.error(
          "Notification sound error:",
          error
        );
      }
    };

    socket.on(
      "notification:new",
      handleNewNotification
    );

    return () => {
      socket.off(
        "notification:new",
        handleNewNotification
      );
    };
  }, []);

  return (
    <>
      <Header
        unreadCount={unreadCount}
      />

      <main className="customer-main">
        <Outlet />
      </main>
    </>
  );
}

export default CustomerLayout;
