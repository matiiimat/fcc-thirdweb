import { createHash } from 'crypto';

// List of first names by nationality
const firstNames = {
  english: ['Jack', 'Harry', 'James', 'William', 'George'],
  spanish: ['Carlos', 'Juan', 'Diego', 'Luis', 'Pedro'],
  italian: ['Marco', 'Giuseppe', 'Antonio', 'Mario', 'Luigi'],
  brazilian: ['Lucas', 'Gabriel', 'Pedro', 'Thiago', 'Rafael'],
  french: ['Hugo', 'Lucas', 'Thomas', 'Jules', 'Louis'],
};

// List of last names by nationality
const lastNames = {
  english: ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor'],
  spanish: ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Sanchez'],
  italian: ['Rossi', 'Ferrari', 'Esposito', 'Romano', 'Colombo'],
  brazilian: ['Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa'],
  french: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert'],
};

// Nationality types
type Nationality = 'english' | 'spanish' | 'italian' | 'brazilian' | 'french';

// Function to generate a deterministic hash from an address
function generateHash(address: string): number {
  const hash = createHash('sha256').update(address).digest('hex');
  return parseInt(hash.slice(0, 8), 16);
}

// Function to get a random element from an array using a seed
function getSeededElement<T>(array: T[], seed: number): T {
  return array[seed % array.length];
}

// Function to determine nationality from address
function determineNationality(address: string): Nationality {
  const hash = generateHash(address);
  const nationalities: Nationality[] = ['english', 'spanish', 'italian', 'brazilian', 'french'];
  return nationalities[hash % nationalities.length];
}

// Function to generate player name and nationality
export function generatePlayerName(address: string): { name: string; nationality: Nationality } {
  console.log('Generating name for address:', address); // Debug log

  const nationality = determineNationality(address);
  console.log('Determined nationality:', nationality); // Debug log

  const hash = generateHash(address);
  const firstName = getSeededElement(firstNames[nationality], hash);
  const lastName = getSeededElement(lastNames[nationality], hash + 1);

  const fullName = `${firstName} ${lastName}`;
  console.log('Generated name:', fullName); // Debug log

  return {
    name: fullName,
    nationality,
  };
}

// Function to apply nationality bonus to stats
export function applyNationalityBonus(baseStats: any, nationality: Nationality) {
  const stats = { ...baseStats };

  // Each nationality gets a +5 bonus to a specific stat
  switch (nationality) {
    case 'english':
      stats.strength += 5;
      break;
    case 'spanish':
      stats.passing += 5;
      break;
    case 'italian':
      stats.defending += 5;
      break;
    case 'brazilian':
      stats.shooting += 5;
      break;
    case 'french':
      stats.speed += 5;
      break;
  }

  return stats;
}