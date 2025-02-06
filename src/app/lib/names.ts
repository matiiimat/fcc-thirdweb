import { createHash } from 'crypto';

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