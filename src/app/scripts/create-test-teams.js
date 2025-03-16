// Script to create test teams with specific bot players for match engine testing
import { MongoClient, ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB connection string - will be replaced by the actual URI
//const uri = "mongodb+srv://username:pass@url/?retryWrites=true&w=majority&appName=name";
const uri = "mongodb+srv://mathieulr21:CHBTkLgXd9Hq2llV@fcc-test-cluster.ofxet.mongodb.net/?retryWrites=true&w=majority&appName=fcc-test-cluster";


// Bot player stats configurations
const TEAM1_PLAYER_STATS = {
  strength: 2,
  stamina: 2,
  passing: 15,
  shooting: 2,
  defending: 2,
  speed: 2,
  positioning: 2,
  workEthic: 2
};

const TEAM2_PLAYER_STATS = {
  strength: 1,
  stamina: 1,
  passing: 1,
  shooting: 1,
  defending: 15,
  speed: 1,
  positioning: 1,
  workEthic: 1
};

// Team configurations
const TEAMS = [
  {
    name: "FC Test 3",
    stats: TEAM1_PLAYER_STATS,
    formation: "4-3-3",
    tacticalStyle: "Tiki-Taka"
  },
  {
    name: "FC Test 4",
    stats: TEAM2_PLAYER_STATS,
    formation: "4-4-2",
    tacticalStyle: "None"
  }
];

// Player positions for each formation
const FORMATIONS = {
  "4-3-3": [
    { position: "GK", x: 50, y: 90 },
    { position: "D", x: 20, y: 70 },
    { position: "D", x: 40, y: 70 },
    { position: "D", x: 60, y: 70 },
    { position: "D", x: 80, y: 70 },
    { position: "M", x: 30, y: 50 },
    { position: "M", x: 50, y: 50 },
    { position: "M", x: 70, y: 50 },
    { position: "F", x: 30, y: 30 },
    { position: "F", x: 50, y: 20 },
    { position: "F", x: 70, y: 30 }
  ],
  "4-4-2": [
    { position: "GK", x: 50, y: 90 },
    { position: "D", x: 20, y: 70 },
    { position: "D", x: 40, y: 70 },
    { position: "D", x: 60, y: 70 },
    { position: "D", x: 80, y: 70 },
    { position: "M", x: 20, y: 50 },
    { position: "M", x: 40, y: 50 },
    { position: "M", x: 60, y: 50 },
    { position: "M", x: 80, y: 50 },
    { position: "F", x: 35, y: 30 },
    { position: "F", x: 65, y: 30 }
  ]
};

// Generate a bot name based on team and position
const generateBotName = (teamIndex, playerIndex) => {
  const teamPrefix = teamIndex === 0 ? "AC" : "FC";
  return `${teamPrefix} Bot ${playerIndex + 1}`;
};

// Generate a unique bot address
const generateBotAddress = (teamIndex, playerIndex) => {
  // Create a unique address for each bot
  const teamPrefix = teamIndex === 0 ? "1" : "2";
  const paddedIndex = playerIndex.toString().padStart(2, "0");
  return `0xbot${teamPrefix}${paddedIndex}`.toLowerCase();
};

// Create bots for a team with specific stats
const createBotsForTeam = (teamIndex, stats) => {
  const bots = [];
  
  for (let i = 0; i < 11; i++) {
    const botAddress = generateBotAddress(teamIndex, i);
    const botName = generateBotName(teamIndex, i);
    
    bots.push({
      playerId: `bot_team${teamIndex + 1}_${i}`,
      playerName: botName,
      ethAddress: botAddress,
      team: "Unassigned", // Will be updated when assigned to team
      stats: { ...stats },
      lastConnectionDate: new Date(),
      consecutiveConnections: 0,
      privateTrainer: {
        selectedSkill: null,
        remainingSessions: 0
      },
      leaveOfAbsence: {
        expirationDate: null,
        daysRemaining: 0
      },
      energyDrinkPurchases: {
        count: 0,
        resetTime: null
      }
    });
  }
  
  return bots;
};

// Create a team with tactics and player positions
const createTeam = (teamConfig, teamIndex, botAddresses) => {
  // Create player positions for the tactic
  const playerPositions = FORMATIONS[teamConfig.formation].map((pos, index) => {
    return {
      ethAddress: botAddresses[index],
      position: pos.position,
      x: pos.x,
      y: pos.y
    };
  });
  
  // Create the tactic
  const tactic = {
    _id: new ObjectId(),
    name: `${teamConfig.name} Default Tactic`,
    formation: teamConfig.formation,
    tacticalStyle: teamConfig.tacticalStyle,
    playerPositions: playerPositions
  };
  
  // Create the team
  return {
    teamName: teamConfig.name,
    captainAddress: botAddresses[0], // First bot is the captain
    players: botAddresses,
    tactics: [tactic],
    jersey: {
      primaryColor: teamIndex === 0 ? "#ff0000" : "#0000ff",
      secondaryColor: "#ffffff",
      pattern: "solid",
      sponsorLogoUrl: ""
    },
    stats: {
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      goalDifference: 0, // Added this field
      tacticsUsed: []
    },
    isPublic: true
  };
};

// Main function to create test teams
async function createTestTeams() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db();
    
    // Clean up existing test teams and bots
    console.log("Cleaning up existing test teams and bots...");
    await db.collection("teams").deleteMany({ 
      teamName: { $in: ["AC Test 1", "FC Test 2"] } 
    });
    await db.collection("players").deleteMany({ 
      ethAddress: { $regex: /^0xbot[12]/ } 
    });
    
    // Create bots for both teams
    const team1Bots = createBotsForTeam(0, TEAM1_PLAYER_STATS);
    const team2Bots = createBotsForTeam(1, TEAM2_PLAYER_STATS);
    
    // Insert bots into database
    console.log("Creating bots...");
    await db.collection("players").insertMany([...team1Bots, ...team2Bots]);
    
    // Get bot addresses for each team
    const team1BotAddresses = team1Bots.map(bot => bot.ethAddress);
    const team2BotAddresses = team2Bots.map(bot => bot.ethAddress);
    
    // Create teams
    console.log("Creating teams...");
    const team1 = createTeam(TEAMS[0], 0, team1BotAddresses);
    const team2 = createTeam(TEAMS[1], 1, team2BotAddresses);
    
    // Insert teams into database
    const teamResults = await db.collection("teams").insertMany([team1, team2]);
    
    // Update bot team assignments
    console.log("Assigning bots to teams...");
    await db.collection("players").updateMany(
      { ethAddress: { $in: team1BotAddresses } },
      { $set: { team: team1.teamName } }
    );
    
    await db.collection("players").updateMany(
      { ethAddress: { $in: team2BotAddresses } },
      { $set: { team: team2.teamName } }
    );
    
    console.log("Test teams created successfully!");
    console.log("Team 1 ID:", teamResults.insertedIds[0]);
    console.log("Team 2 ID:", teamResults.insertedIds[1]);
    console.log("Team 1 Tactic ID:", team1.tactics[0]._id);
    console.log("Team 2 Tactic ID:", team2.tactics[0]._id);
    
    // Print match simulation instructions
    console.log("\nTo simulate a match between these teams, use the following:");
    console.log("POST to /api/teams/match with body:");
    console.log(JSON.stringify({
      homeTeamId: teamResults.insertedIds[0].toString(),
      awayTeamId: teamResults.insertedIds[1].toString(),
      homeTacticId: team1.tactics[0]._id.toString(),
      awayTacticId: team2.tactics[0]._id.toString()
    }, null, 2));
    
    // Print instructions for updating the league page
    console.log("\n=== IMPORTANT: Update the league page with these IDs ===");
    console.log("Open src/app/league/page.tsx and replace lines 113-116 with:");
    console.log(`      const homeTeamId = "${teamResults.insertedIds[0].toString()}";`);
    console.log(`      const awayTeamId = "${teamResults.insertedIds[1].toString()}";`);
    console.log(`      const homeTacticId = "${team1.tactics[0]._id.toString()}";`);
    console.log(`      const awayTacticId = "${team2.tactics[0]._id.toString()}";`);
    
  } catch (error) {
    console.error("Error creating test teams:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

// Run the script
createTestTeams().catch(console.error);

// Export the function for potential reuse
export { createTestTeams };