import { useEffect, useState } from "react";

interface Notification {
  _id: string;
  fromTeamId: string;
  toPlayerId: string;
  type: "TEAM_INVITATION";
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

interface NotificationBannerProps {
  playerId: string;
  ethAddress: string;
}

export default function NotificationBanner({
  playerId,
  ethAddress,
}: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamName, setTeamName] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
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
          setNotifications(data.notifications);

          // Fetch team name for the first notification
          const teamResponse = await fetch(
            `/api/teams/${data.notifications[0].fromTeamId}`
          );
          if (teamResponse.ok) {
            const teamData = await teamResponse.json();
            setTeamName(teamData.name);
          }
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

    // Initial fetch
    fetchNotifications();

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [ethAddress]);

  const handleResponse = async (notificationId: string, accept: boolean) => {
    setProcessing(true);
    setError("");

    try {
      // Update notification status
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

      // If accepted, join the team
      if (accept) {
        const joinResponse = await fetch("/api/teams/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ethAddress: ethAddress,
          },
          body: JSON.stringify({
            teamId: notifications[0].fromTeamId,
          }),
        });

        if (!joinResponse.ok) {
          throw new Error("Failed to join team");
        }
      }

      // Remove the notification from the list
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err: any) {
      console.error("Error handling notification:", err);
      setError(err.message || "Failed to process response");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || notifications.length === 0) return null;

  return (
    <div className="glass-container p-3 sm:p-6 w-full rounded-lg sm:rounded-2xl shadow-lg mb-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex flex-col w-full">
          <p className="text-sm sm:text-base text-gray-300">
            {teamName} wants you to join their team!
          </p>
          {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
        </div>
        <div className="flex gap-2">
          {processing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
          ) : (
            <>
              <button
                onClick={() => handleResponse(notifications[0]._id, true)}
                className="px-4 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                disabled={processing}
              >
                Accept
              </button>
              <button
                onClick={() => handleResponse(notifications[0]._id, false)}
                className="px-4 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                disabled={processing}
              >
                Decline
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
