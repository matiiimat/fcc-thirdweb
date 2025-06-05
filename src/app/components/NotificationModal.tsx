"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  _id: string;
  fromTeamId: string;
  toPlayerId: string;
  type: "TEAM_INVITATION" | "CONTRACT_REQUEST";
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  teamName?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ethAddress: string;
  onNotificationUpdate: () => void;
}

export default function NotificationModal({
  isOpen,
  onClose,
  ethAddress,
  onNotificationUpdate,
}: NotificationModalProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, ethAddress]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        headers: {
          ethAddress: ethAddress,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      if (data.notifications?.length > 0) {
        // Fetch team names for all notifications
        const notificationsWithTeamNames = await Promise.all(
          data.notifications.map(async (notification: Notification) => {
            try {
              const teamResponse = await fetch(
                `/api/teams/${notification.fromTeamId}`
              );
              if (teamResponse.ok) {
                const teamData = await teamResponse.json();
                return { ...notification, teamName: teamData.teamName };
              }
            } catch (err) {
              console.error("Error fetching team name:", err);
            }
            return { ...notification, teamName: "Unknown Team" };
          })
        );
        setNotifications(notificationsWithTeamNames);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (notificationId: string, accept: boolean) => {
    setProcessing(notificationId);
    setError("");

    try {
      const notification = notifications.find((n) => n._id === notificationId);
      if (!notification) return;

      // Update notification status first
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ethAddress: ethAddress,
        },
        body: JSON.stringify({
          status: accept ? "ACCEPTED" : "DECLINED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification");
      }

      // Wait a moment to ensure notification status is updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // If accepted and it's a team invitation, join the team
      if (accept && notification.type === "TEAM_INVITATION") {
        const joinResponse = await fetch("/api/teams/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ethAddress: ethAddress,
          },
          body: JSON.stringify({
            teamId: notification.fromTeamId,
          }),
        });

        if (!joinResponse.ok) {
          const errorData = await joinResponse.json();
          throw new Error(errorData.error || "Failed to join team");
        }
      }

      // Remove the notification from the list
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      onNotificationUpdate();
    } catch (err: any) {
      console.error("Error handling notification:", err);
      setError(err.message || "Failed to process response");
    } finally {
      setProcessing("");
    }
  };

  const handleContractView = async (notificationId: string) => {
    try {
      // Mark the notification as viewed by updating its status to "DECLINED"
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ethAddress: ethAddress,
        },
        body: JSON.stringify({
          status: "DECLINED",
        }),
      });

      // Remove the notification from the local state
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      onNotificationUpdate();

      // Close modal and navigate to the team page with modal open
      onClose();
      router.push("/team?openManageTeam=true");
    } catch (err) {
      console.error("Error marking notification as viewed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gradient-to-b from-[#1a1d21] to-[#0d0f12] rounded-t-xl w-full max-w-md max-h-[80vh] flex flex-col transform transition-all duration-300 ease-out animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 relative">
          <h2 className="text-lg font-bold text-white text-center">
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-4">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No notifications
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="glass-container p-3 rounded-lg"
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-300">
                      {notification.type === "TEAM_INVITATION"
                        ? `${notification.teamName} wants you to join their team!`
                        : `You have a new contract request to review!`}
                    </p>
                    <div className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {processing === notification._id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                      ) : notification.type === "TEAM_INVITATION" ? (
                        <>
                          <button
                            onClick={() =>
                              handleResponse(notification._id, true)
                            }
                            className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                            disabled={processing !== ""}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleResponse(notification._id, false)
                            }
                            className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
                            disabled={processing !== ""}
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleContractView(notification._id)}
                          className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}