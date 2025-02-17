import { createHash } from 'crypto';

// Team name components
const firstWords = [
  'Phoenix', 'Thunder', 'Dragon', 'Storm', 'Silver', 'Golden', 'Crystal', 'Shadow',
  'Royal', 'Crimson', 'Emerald', 'Frost', 'Solar', 'Lunar', 'Star', 'Ocean',
  'Mountain', 'Desert', 'Forest', 'Valley', 'Iron', 'Black', 'Red', 'Blue',
  'White', 'Dark', 'Light', 'Ancient', 'Mystic', 'Eternal'
];

const secondWords = [
  'Warriors', 'Knights', 'Raiders', 'Titans', 'Eagles', 'Lions', 'Wolves', 'Hawks',
  'Panthers', 'Dragons', 'Tigers', 'Giants', 'Kings', 'Guardians', 'Legends', 'Phoenix',
  'Hunters', 'Wanderers', 'Spirits', 'Riders', 'Rangers', 'Falcons', 'Bears', 'Stallions',
  'Wolves', 'Vipers', 'Scorpions', 'Ravens', 'Sharks', 'Cobras'
];

// Possible team prefixes
const prefixes = [
  "AC",  // Athletic Club
  "AS",  // Associazione Sportiva
  "FC",  // Football Club
  "CF",  // Club de Fútbol
  "SC",  // Sporting Club
  "RC",  // Racing Club
  "CD",  // Club Deportivo
  "CA",  // Club Atlético
  "SV",  // Sport Verein
  "TSV", // Turn und Sport Verein
  "US",  // Unione Sportiva
  "IFK", // Idrottsföreningen Kamraterna
  "DJK", // Deutsche Jugendkraft
];

// Function to generate team name from address
export function generateTeamName(address: string): { name: string; acronym: string } {
  const hash = generateHash(address);
  const secondHash = parseInt(createHash('sha256').update(address + 'second').digest('hex').slice(0, 8), 16);
  const prefixHash = parseInt(createHash('sha256').update(address + 'prefix').digest('hex').slice(0, 8), 16);
  
  // Get first word
  const firstWord = getSeededElement(firstWords, hash);
  
  // 50% chance to add a second word
  const useSecondWord = secondHash % 2 === 0;
  const secondWord = useSecondWord ? ' ' + getSeededElement(secondWords, secondHash) : '';
  
  // Get prefix (FC or AS)
  const prefix = getSeededElement(prefixes, prefixHash);
  
  // Create full name
  const teamName = `${prefix} ${firstWord}${secondWord}`;
  
  return {
    name: teamName,
    acronym: prefix
  };
}

// List of first names by nationality
const firstNames = {
  english: ['Jack', 'Harry', 'James', 'William', 'George', 'Oliver', 'Thomas', 'Charlie', 'Oscar', 'Henry',
           'Edward', 'Alexander', 'Daniel', 'Michael', 'Benjamin', 'Joseph', 'Samuel', 'David', 'Arthur', 'Frederick'],
  spanish: ['Carlos', 'Juan', 'Diego', 'Luis', 'Pedro', 'Miguel', 'Alejandro', 'David', 'José', 'Antonio',
           'Francisco', 'Manuel', 'Javier', 'Alberto', 'Ricardo', 'Fernando', 'Roberto', 'Rafael', 'Andrés', 'Emilio'],
  italian: ['Marco', 'Giuseppe', 'Antonio', 'Mario', 'Luigi', 'Francesco', 'Alessandro', 'Roberto', 'Andrea', 'Paolo',
           'Giovanni', 'Luca', 'Salvatore', 'Carlo', 'Domenico', 'Vincenzo', 'Nicola', 'Leonardo', 'Stefano', 'Massimo'],
  brazilian: ['Lucas', 'Gabriel', 'Pedro', 'Thiago', 'Rafael', 'João', 'Matheus', 'Bruno', 'Felipe', 'Gustavo',
             'Marcos', 'Ricardo', 'Diego', 'Eduardo', 'Vitor', 'Leonardo', 'André', 'Carlos', 'Daniel', 'Fernando'],
  french: ['Hugo', 'Lucas', 'Thomas', 'Jules', 'Louis', 'Gabriel', 'Léo', 'Arthur', 'Nathan', 'Théo',
          'Maxime', 'Alexandre', 'Antoine', 'Paul', 'Nicolas', 'Etienne', 'Pierre', 'Mathieu', 'Vincent', 'Romain'],
};

// List of last names by nationality
const lastNames = {
  english: ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts',
           'Johnson', 'Walker', 'Wright', 'Robinson', 'Thompson', 'White', 'Hughes', 'Edwards', 'Green', 'Hall'],
  spanish: ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Sanchez', 'Perez', 'Gonzalez', 'Gomez', 'Fernandez', 'Torres',
           'Diaz', 'Ruiz', 'Hernandez', 'Jimenez', 'Moreno', 'Munoz', 'Alvarez', 'Romero', 'Gutierrez', 'Navarro'],
  italian: ['Rossi', 'Ferrari', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo',
           'Conti', 'De Luca', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana'],
  brazilian: ['Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa', 'Rodrigues', 'Ferreira', 'Alves', 'Lima', 'Carvalho',
             'Gomes', 'Martins', 'Rocha', 'Sousa', 'Fernandes', 'Machado', 'Araujo', 'Ribeiro', 'Nascimento', 'Moreira'],
  french: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Richard', 'Durand', 'Leroy', 'Moreau',
          'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'],
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
  // Use different parts of the hash for first and last names
  const firstNameSeed = hash;
  const lastNameSeed = parseInt(createHash('sha256').update(address + 'lastname').digest('hex').slice(0, 8), 16);
  
  const firstName = getSeededElement(firstNames[nationality], firstNameSeed);
  const lastName = getSeededElement(lastNames[nationality], lastNameSeed);

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