import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISeasonTeam {
  teamId: Types.ObjectId;
  teamName: string;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface ISeason extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'registration' | 'ongoing' | 'completed';
  minTeams: number;
  maxTeams: number;
  registeredTeams: ISeasonTeam[];
  matchDayInterval: number; // Days between match days
  currentMatchDay: number;
  totalMatchDays: number;
  seasonNumber: number; // Current season number
  createdAt: Date;
  updatedAt: Date;
}

const SeasonTeamSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  gamesPlayed: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  },
  draws: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  goalsFor: {
    type: Number,
    default: 0,
  },
  goalsAgainst: {
    type: Number,
    default: 0,
  },
  goalDifference: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const SeasonSchema = new Schema<ISeason>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['registration', 'ongoing', 'completed'],
    default: 'registration',
  },
  minTeams: {
    type: Number,
    required: true,
    default: 8,
  },
  maxTeams: {
    type: Number,
    required: true,
    default: 20,
  },
  registeredTeams: {
    type: [SeasonTeamSchema],
    default: [],
  },
  matchDayInterval: {
    type: Number,
    required: true,
    default: 7, // One week between match days by default
  },
  currentMatchDay: {
    type: Number,
    default: 0,
  },
  totalMatchDays: {
    type: Number,
    default: 0,
  },
  seasonNumber: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Indexes
SeasonSchema.index({ status: 1 });
SeasonSchema.index({ startDate: 1 });
SeasonSchema.index({ endDate: 1 });

// Virtual for getting current standings
SeasonSchema.virtual('standings').get(function() {
  return this.registeredTeams.sort((a, b) => {
    // Sort by points
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // If points are equal, sort by goal difference
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    // If goal difference is equal, sort by goals scored
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    // If everything is equal, sort alphabetically by team name
    return a.teamName.localeCompare(b.teamName);
  });
});

// Method to generate match schedule
SeasonSchema.methods.generateSchedule = async function() {
  const teams = this.registeredTeams;
  if (teams.length < this.minTeams) {
    throw new Error(`Not enough teams registered. Minimum ${this.minTeams} teams required.`);
  }

  // Round-robin algorithm
  const rounds = teams.length - 1;
  const matchesPerRound = Math.floor(teams.length / 2);
  const MatchModel = mongoose.model('Match');

  // Create array of team IDs for scheduling
  const teamIds = teams.map((team: ISeasonTeam) => team.teamId);
  
  // If odd number of teams, add a "bye" team
  if (teamIds.length % 2 === 1) {
    teamIds.push(null); // null represents "bye" week
  }

  let schedule: Array<{
    homeTeamId: Types.ObjectId;
    awayTeamId: Types.ObjectId;
    homeTeamName: string;
    awayTeamName: string;
    scheduledDate: Date;
    seasonId: Types.ObjectId;
    matchday: number;
  }> = [];

  for (let round = 0; round < rounds; round++) {
    let roundMatches = [];
    for (let match = 0; match < matchesPerRound; match++) {
      const home = teamIds[match];
      const away = teamIds[teamIds.length - 1 - match];
      
      // Skip if either team is "bye"
      if (home && away) {
        const homeTeam = teams.find((t: ISeasonTeam) => t.teamId.equals(home));
        const awayTeam = teams.find((t: ISeasonTeam) => t.teamId.equals(away));
        
        const matchDate = new Date(this.startDate);
        matchDate.setDate(matchDate.getDate() + (round * this.matchDayInterval));
        
        const matchData = {
          homeTeamId: home,
          awayTeamId: away,
          homeTeamName: homeTeam.teamName,
          awayTeamName: awayTeam.teamName,
          scheduledDate: matchDate,
          seasonId: this._id,
          matchday: round + 1,
        };
        
        roundMatches.push(matchData);
      }
    }
    
    // Rotate teams for next round (first team stays fixed)
    teamIds.splice(1, 0, teamIds.pop());
    schedule = schedule.concat(roundMatches);
  }

  // Create all matches in the database
  await MatchModel.insertMany(schedule);
  
  // Update season
  this.status = 'ongoing';
  this.currentMatchDay = 1;
  this.totalMatchDays = rounds;
  await this.save();
};

// Method to activate a new season
SeasonSchema.methods.activateSeason = async function() {
  const TeamModel = mongoose.model('Team');
  const SeasonModel = mongoose.model('Season');
  
  // Find the previous active season
  const previousSeason = await SeasonModel.findOne({
    status: { $in: ['ongoing', 'completed'] }
  }).sort({ seasonNumber: -1 });
  
  // Increment season number
  if (previousSeason) {
    this.seasonNumber = previousSeason.seasonNumber + 1;
  } else {
    this.seasonNumber = 1;
  }
  
  // Reset team standings in the league
  // This resets all the stats that are displayed in the TeamLeaderboard component
  await TeamModel.updateMany({}, {
    $set: {
      'stats.gamesPlayed': 0,
      'stats.wins': 0,
      'stats.draws': 0,
      'stats.losses': 0,
      'stats.goalsFor': 0,
      'stats.goalsAgainst': 0,
      'stats.goalDifference': 0,
      'stats.points': 0,
      'stats.cleanSheets': 0,
    }
  });
  
  // Reset all registered teams in the season
  this.registeredTeams.forEach((team: ISeasonTeam) => {
    team.points = 0;
    team.gamesPlayed = 0;
    team.wins = 0;
    team.draws = 0;
    team.losses = 0;
    team.goalsFor = 0;
    team.goalsAgainst = 0;
    team.goalDifference = 0;
  });
  
  // Mark previous season as completed
  if (previousSeason && previousSeason.status === 'ongoing') {
    previousSeason.status = 'completed';
    await previousSeason.save();
  }
  
  // Set this season as ongoing
  this.status = 'ongoing';
  await this.save();
  
  return this;
};

const SeasonModel = mongoose.models.Season || mongoose.model<ISeason>('Season', SeasonSchema);

export default SeasonModel;