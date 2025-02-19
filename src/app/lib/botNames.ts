export const BOT_NAMES = [
  "Botinho",
  "Bottacio",
  "Botanski",
  "Botescu",
  "Botiero",
  "Botov",
  "Botelli",
  "Botamé",
  "Boticelli",
  "Botarov",
  "Botignan",
  "Botansson",
  "Botreaux",
  "Bottenberg",
  "Botzmann",
  "Botelé",
  "Bottington",
  "Botclair",
  "Botland",
  "Botévin",
  "Bottaire",
  "Botmer",
  "Botjansen",
  "Botchard",
  "Botson",
  "Botthieu",
  "Botdrick",
  "Botleau",
  "Botwright",
  "Botreaux"
];

export function getBotName(index: number): string {
  return BOT_NAMES[index % BOT_NAMES.length];
}