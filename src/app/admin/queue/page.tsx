"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import TeamMatchPopup from "../../components/TeamMatchPopup";

interface Match {
  _id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  scheduledDate: string;
  isCompleted: boolean;
  homeTactic?: any;
  awayTactic?: any;
  result?: {
    homeScore: number;
    awayScore: number;
  };
  homeStats?: any;
  awayStats?: any;
  homePlayerRatings?: any[];
  awayPlayerRatings?: any[];
  events?: any[];
  stats?: {
    home: any;
    away: any;
  };
  queuePosition?: number;

  // Additional properties needed for TeamMatchPopup
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
}

interface QueueStats {
  totalMatches: number;
  nextMatch: Match | null;
  upcomingMatches: Match[];
  recentlyCompleted: Match[];
}

export default function QueueMonitorPage() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchQueueStats = async () => {
    try {
      const [upcomingResponse, completedResponse] = await Promise.all([
        fetch("/api/teams/schedule"),
        fetch("/api/teams/matches?completed=true&limit=5"),
      ]);

      if (!upcomingResponse.ok || !completedResponse.ok) {
        throw new Error("Failed to fetch queue data");
      }

      const upcomingData = await upcomingResponse.json();
      const completedData = await completedResponse.json();

      // Map API response data to include required properties for TeamMatchPopup
      const mapMatch = (match: any) => ({
        ...match,
        id: match._id,
        homeTeam: match.homeTeamName,
        awayTeam: match.awayTeamName,
        date: match.scheduledDate,
      });

      setStats({
        totalMatches: upcomingData.queueLength,
        nextMatch: upcomingData.nextMatch
          ? mapMatch(upcomingData.nextMatch)
          : null,
        upcomingMatches: upcomingData.matches.map(mapMatch),
        recentlyCompleted: completedData.matches.map(mapMatch),
      });
      setLastRefresh(new Date());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch queue data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStats();
    const interval = setInterval(fetchQueueStats, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Now";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Queue Monitor" />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading queue data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Queue Monitor" />
      <main className="container mx-auto px-4 py-8">
        {/* Queue Overview */}
        <div className="glass-container p-6 rounded-xl shadow-lg mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Queue Overview</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Last refresh: {formatDate(lastRefresh.toISOString())}
              </div>
              <select
                className="bg-black/30 text-white rounded px-3 py-1 text-sm"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
              >
                <option value="10">Refresh: 10s</option>
                <option value="30">Refresh: 30s</option>
                <option value="60">Refresh: 1m</option>
                <option value="300">Refresh: 5m</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-container bg-black/20 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Total Queued</div>
              <div className="text-2xl font-bold text-green-400">
                {stats?.totalMatches || 0}
              </div>
            </div>
            {stats?.nextMatch && (
              <div className="glass-container bg-black/20 p-4 rounded-lg md:col-span-2">
                <div className="text-sm text-gray-400 mb-1">Next Match</div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {stats.nextMatch.homeTeamName} vs{" "}
                      {stats.nextMatch.awayTeamName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(stats.nextMatch.scheduledDate)}
                    </div>
                  </div>
                  <div className="text-green-400 font-bold">
                    {getTimeUntil(stats.nextMatch.scheduledDate)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="glass-container p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Matches</h2>
          <div className="space-y-3">
            {stats?.upcomingMatches.map((match) => (
              <div
                key={match._id}
                className="glass-container bg-black/20 p-4 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {match.homeTeamName} vs {match.awayTeamName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(match.scheduledDate)}
                    </div>
                  </div>
                  <div className="text-green-400 font-bold">
                    {getTimeUntil(match.scheduledDate)}
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.upcomingMatches ||
              stats.upcomingMatches.length === 0) && (
              <div className="text-center text-gray-400">
                No upcoming matches scheduled
              </div>
            )}
          </div>
        </div>

        {/* Recently Completed */}
        <div className="glass-container p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">Recently Completed</h2>
          <div className="space-y-3">
            {stats?.recentlyCompleted.map((match) => (
              <div
                key={match._id}
                className="glass-container bg-black/20 p-4 rounded-lg cursor-pointer hover:bg-black/30 transition-colors"
                onClick={() => setSelectedMatch(match)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {match.homeTeamName} vs {match.awayTeamName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(match.scheduledDate)}
                    </div>
                  </div>
                  <div className="text-xl font-bold">
                    {match.result?.homeScore} - {match.result?.awayScore}
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.recentlyCompleted ||
              stats.recentlyCompleted.length === 0) && (
              <div className="text-center text-gray-400">
                No recently completed matches
              </div>
            )}
          </div>
        </div>

        {error && <div className="mt-4 text-red-400 text-center">{error}</div>}
      </main>
      <Footer />

      {/* Match Details Popup */}
      {selectedMatch && (
        <TeamMatchPopup
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
