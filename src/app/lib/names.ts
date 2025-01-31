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

type Nationality = keyof typeof PLAYER_NAMES;

// Generate a random name based on ETH address
export function generatePlayerName(ethAddress: string): string {
  // Use the first few characters of the address to determine nationality
  const nationalityHash = parseInt(ethAddress.slice(2, 4), 16);
  const nationalities = Object.keys(PLAYER_NAMES) as Nationality[];
  const nationality = nationalities[nationalityHash % nationalities.length];

  // Use the next few characters to determine the name index
  const nameHash = parseInt(ethAddress.slice(4, 6), 16);
  const names = PLAYER_NAMES[nationality];
  const name = names[nameHash % names.length];

  return name;
}