import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { getSocket } from "../socket";

function CustomerLayout() {
  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    const handleNewNotification = (data) => {
      console.log(
        "New notification received:",
        data
      );

      // 🔊 Play notification sound
      const audio = new Audio("/notification.mp3");

      audio.play().catch((error) => {
        console.log(
          "Notification sound could not play:",
          error.message
        );
      });

      // Optional browser notification
      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(
          data.notification?.title ||
            "EnjoMeal Notification",
          {
            body:
              data.notification?.message ||
              "You have a new notification",
            icon: "/favicon.svg",
          }
        );
      }

      // Refresh UI event
      window.dispatchEvent(
        new CustomEvent("enjomeal:new-notification", {
          detail: data.notification,
        })
      );
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
      <Header />

      <main className="customer-main">
        <Outlet />
      </main>
    </>
  );
}

export default CustomerLayout;
