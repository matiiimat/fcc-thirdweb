"use client";

interface StatBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  unit?: string;
  subLabel?: string;
}

const StatBar: React.FC<StatBarProps> = ({
  label,
  homeValue,
  awayValue,
  unit = "",
  subLabel = "",
}) => {
  const total = homeValue + awayValue;
  const homePercent = total === 0 ? 50 : (homeValue / total) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-gray-400">
        <span>{label}</span>
        {subLabel && <span className="text-xs">{subLabel}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-green-400 w-12 text-right">
          {homeValue}
          {unit}
        </span>
        <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-r-none rounded-full"
            style={{ width: `${homePercent}%` }}
          />
        </div>
        <span className="text-blue-400 w-12">
          {awayValue}
          {unit}
        </span>
      </div>
    </div>
  );
};

export default StatBar;
