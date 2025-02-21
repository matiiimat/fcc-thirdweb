import { IMatch, ITactic, ITeamStats } from "../models/Team";

export const formatMatchDate = (dateStr: string) => {
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

export const calculateWinRateChange = (
  stats: ITeamStats,
  isWinner: boolean,
  goalsScored: number,
  goalsConceded: number
) => {
  return (
    ((stats.wins * 3 + stats.draws) / (stats.gamesPlayed * 3)) * 100 -
    (((stats.wins - (isWinner ? 1 : 0)) * 3 +
      (stats.draws - (goalsScored === goalsConceded ? 1 : 0))) /
      ((stats.gamesPlayed - 1) * 3)) *
      100
  );
};

export const getTeamTactic = (match: IMatch, teamName: string): ITactic | undefined => {
  return match.homeTeam === teamName ? match.homeTactic : match.awayTactic;
};