"use client";

import { IPlayerStats } from "../models/Player";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PositionRecommendationChartProps {
  stats: IPlayerStats;
}

const calculatePositionScores = (stats: IPlayerStats) => {
  // Calculate raw scores
  const rawScores = {
    D: (stats.strength + stats.defending + stats.positioning) / 3,
    M: (stats.stamina + stats.passing + stats.positioning) / 3,
    F: (stats.shooting + stats.speed + stats.positioning) / 3,
  };

  // Calculate total of raw scores
  const total = rawScores.D + rawScores.M + rawScores.F;

  // Convert to percentages that sum to 100
  return {
    D: Math.round((rawScores.D / total) * 100),
    M: Math.round((rawScores.M / total) * 100),
    F: Math.round((rawScores.F / total) * 100),
  };
};

const PositionRecommendationChart: React.FC<
  PositionRecommendationChartProps
> = ({ stats }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const scores = calculatePositionScores(stats);

  const data = {
    labels: ["D", "M", "F"],
    datasets: [
      {
        label: "Position Score",
        data: [scores.D, scores.M, scores.F],
        backgroundColor: "rgb(34, 197, 94)", // Solid green
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        display: false, // Hide the y-axis
        beginAtZero: true,
        max: 100, // Set max to 100 for percentages
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "white",
          font: {
            size: 14,
            weight: "bold" as const,
            family: "'Inter', sans-serif",
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => `${context.raw}%`,
        },
      },
    },
  };

  if (!isClient) {
    return (
      <div className="w-full h-[200px] animate-pulse">
        <div className="w-full h-full bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[200px]">
      <Bar data={data} options={options} />
    </div>
  );
};

export default PositionRecommendationChart;
