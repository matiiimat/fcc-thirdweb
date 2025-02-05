"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stadiumEnabled, setStadiumEnabled] = useState(true);

  useEffect(() => {
    // Load stadium state from localStorage
    const savedState = localStorage.getItem("stadiumEnabled");
    if (savedState !== null) {
      setStadiumEnabled(savedState === "true");
      document.body.classList.toggle("stadium-disabled", savedState !== "true");
    }
  }, []);

  const handleResetTraining = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/reset-training", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset training timers");
      }

      const result = await response.json();
      setSuccess(
        `Successfully reset training timers for ${result.playersUpdated} players`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset training timers"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleStadium = () => {
    const newState = !stadiumEnabled;
    setStadiumEnabled(newState);
    localStorage.setItem("stadiumEnabled", String(newState));
    document.body.classList.toggle("stadium-disabled", !newState);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header pageName="Admin" />

      <div className="flex flex-col items-center justify-center px-4 mt-4">
        <div className="w-full max-w-md space-y-4">
          <div className="glass-container p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Admin Controls
            </h2>

            <div className="space-y-4">
              <div>
                <button
                  onClick={handleResetTraining}
                  disabled={loading}
                  className={`
                    w-full gradient-button py-3 px-6 rounded-lg
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {loading ? "Resetting..." : "Reset All Training Timers"}
                </button>
              </div>

              <div>
                <button
                  onClick={toggleStadium}
                  className="w-full gradient-button py-3 px-6 rounded-lg"
                >
                  {stadiumEnabled
                    ? "Disable Stadium Background"
                    : "Enable Stadium Background"}
                </button>
              </div>

              {error && (
                <div className="text-red-500 text-center p-3 bg-red-900/50 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-500 text-center p-3 bg-green-900/50 rounded-lg">
                  {success}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
