"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  return (
    <>
      <Header pageName="Admin" />

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-2xl w-full space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Admin Controls
            </h2>

            <div className="space-y-4">
              <div>
                <button
                  onClick={handleResetTraining}
                  disabled={loading}
                  className={`
                    w-full text-white font-bold py-3 px-6 rounded-lg
                    ${
                      loading
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-700"
                    }
                  `}
                >
                  {loading ? "Resetting..." : "Reset All Training Timers"}
                </button>
              </div>

              {error && (
                <div className="text-red-500 text-center p-3 bg-red-100 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-500 text-center p-3 bg-green-100 rounded">
                  {success}
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
