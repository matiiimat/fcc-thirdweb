"use client";

import { IPlayerStats } from "../models/Player";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { PLAYER_CONSTANTS } from "../lib/constants";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface StatsRadarChartProps {
  stats: IPlayerStats;
}

const calculateAverages = (stats: IPlayerStats) => {
  return {
    attacking: stats.shooting,
    speed: stats.speed,
    playmaking: stats.passing,
    defense: stats.defending,
    physical: Math.round((stats.strength + stats.stamina) / 2),
    mental: Math.round((stats.workEthic + stats.positioning) / 2),
  };
};

const StatsRadarChart: React.FC<StatsRadarChartProps> = ({ stats }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const averages = calculateAverages(stats);

  const data: ChartData<"radar"> = {
    labels: [
      "ATTACKING",
      "SPEED",
      "PLAYMAKING",
      "DEFENSE",
      "PHYSICAL",
      "MENTAL",
    ],
    datasets: [
      {
        label: "Player Stats",
        data: [
          averages.attacking,
          averages.speed,
          averages.playmaking,
          averages.defense,
          averages.physical,
          averages.mental,
        ],
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: "rgba(255, 255, 255, 0.1)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        pointLabels: {
          color: "white",
          font: {
            size: 12,
            weight: "bold",
            family: "'Inter', sans-serif",
          },
          padding: 0,
        },
        min: PLAYER_CONSTANTS.MIN_STAT_VALUE,
        max: PLAYER_CONSTANTS.MAX_STAT_VALUE,
        ticks: {
          display: false,
        },
        beginAtZero: true,
      },
    },
    layout: {
      padding: 0,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    elements: {
      line: {
        tension: 0.2,
      },
    },
  };

  if (!isClient) {
    return (
      <div className="w-full max-w-[21rem] mx-auto animate-pulse">
        <div className="w-full aspect-square bg-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[21rem] mx-auto">
      <div className="w-full aspect-square">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
};

export default StatsRadarChart;
