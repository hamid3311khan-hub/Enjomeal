import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import {
  connectSocket,
  disconnectSocket,
} from "../socket";

function CustomerLayout() {
  const [unreadCount, setUnreadCount] =
    useState(0);

  useEffect(() => {
    const token = localStorage.getItem(
      "enjoMealToken"
    );

    if (!token) {
      return;
    }

    const socket = connectSocket();

    if (!socket) {
      return;
    }

    const handleNewNotification = (data) => {
      const notification =
        data?.notification;

      if (!notification?._id) {
        return;
      }

      console.log(
        "Real-time notification received:",
        notification
      );

      // Update unread badge
      if (!notification.isRead) {
        setUnreadCount(
          (currentCount) =>
            currentCount + 1
        );
      }

      // Send event to Notifications page
      window.dispatchEvent(
        new CustomEvent(
          "enjomeal:new-notification",
          {
            detail: notification,
          }
        )
      );

      // Play sound
      try {
        const audio = new Audio(
          "/notification.mp3"
        );

        audio.volume = 0.8;

        audio.play().catch((error) => {
          console.log(
            "Sound blocked:",
            error.message
          );
        });
      } catch (error) {
        console.error(
          "Notification sound error:",
          error
        );
      }

      // Browser notification
      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(
          notification.title ||
            "EnjoMeal Notification",
          {
            body:
              notification.message ||
              "You have a new notification",
            icon: "/favicon.svg",
          }
        );
      }
    };

    const handleSocketConnected = () => {
      console.log(
        "Customer socket connected"
      );
    };

    socket.on(
      "notification:new",
      handleNewNotification
    );

    socket.on(
      "connect",
      handleSocketConnected
    );

    return () => {
      socket.off(
        "notification:new",
        handleNewNotification
      );

      socket.off(
        "connect",
        handleSocketConnected
      );

      disconnectSocket();
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
