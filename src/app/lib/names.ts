import { IPlayerStats } from '../models/Player';

// Soccer player family names by nationality
export const PLAYER_NAMES = {
  ENGLISH: [
    'Smith', 'Jones', 'Taylor', 'Brown', 'Wilson',
    'Walker', 'White', 'Harris', 'Clark', 'Lewis',
    'Robinson', 'Wood', 'Thompson', 'Hall', 'Green',
    'Wright', 'Turner', 'Moore', 'King', 'Baker'
  ],
  SPANISH: [
    'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
    'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
    'Flores', 'Rivera', 'Morales', 'Ortiz', 'Cruz',
    'Reyes', 'Moreno', 'Jimenez', 'Diaz', 'Ruiz'
  ],
  ITALIAN: [
    'Rossi', 'Ferrari', 'Esposito', 'Bianchi', 'Romano',
    'Colombo', 'Bruno', 'Ricci', 'Marino', 'Greco',
    'Conti', 'Costa', 'Giordano', 'Mancini', 'Rizzo',
    'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro'
  ],
  BRAZILIAN: [
    'Silva', 'Santos', 'Oliveira', 'Pereira', 'Almeida',
    'Costa', 'Carvalho', 'Ferreira', 'Rodrigues', 'Lima',
    'Ribeiro', 'Alves', 'Monteiro', 'Mendes', 'Cardoso',
    'Ramos', 'Nascimento', 'Teixeira', 'Correia', 'Sousa'
  ],
  FRENCH: [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert',
    'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
    'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia',
    'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'
  ]
} as const;

export type Nationality = keyof typeof PLAYER_NAMES;

// Generate a random name based on ETH address
export function generatePlayerName(ethAddress: string): {
  name: string;
  nationality: Nationality;
} {
  // Use different parts of the address for better randomization
  const nationalityHash = parseInt(ethAddress.slice(2, 6), 16);
  const nameHash = parseInt(ethAddress.slice(6, 10), 16);
  
  const nationalities = Object.keys(PLAYER_NAMES) as Nationality[];
  const nationality = nationalities[nationalityHash % nationalities.length];
  
  const names = PLAYER_NAMES[nationality];
  const name = names[nameHash % names.length];

  return { name, nationality };
}

// Apply nationality bonus to stats
export function applyNationalityBonus(stats: IPlayerStats, nationality: Nationality): IPlayerStats {
  const newStats = { ...stats };

  switch (nationality) {
    case 'ENGLISH':
      newStats.strength = Math.min(20, newStats.strength + 5);
      break;
    case 'SPANISH':
      newStats.passing = Math.min(20, newStats.passing + 5);
      break;
    case 'ITALIAN':
      newStats.defending = Math.min(20, newStats.defending + 5);
      break;
    case 'BRAZILIAN':
      newStats.shooting = Math.min(20, newStats.shooting + 5);
      break;
    case 'FRENCH':
      newStats.speed = Math.min(20, newStats.speed + 5);
      break;
  }

  return newStats;
}