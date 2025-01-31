# Soccer Game Web3

A web-based soccer management game with Web3 integration, built on Next.js and MongoDB.

## Features

- Player Management System
- Training Mechanics
- Investment System
- Team Matches
- Web3 Integration (Base Network)

## Tech Stack

- Frontend: Next.js with TypeScript
- Backend: Next.js API Routes
- Database: MongoDB
- Authentication: Thirdweb
- Styling: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 16.x or later
- MongoDB Atlas account
- Web3 wallet (MetaMask recommended)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd soccer-game-web3
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Player Management

#### GET /api/players

Get all players

#### GET /api/players/[id]

Get a specific player by ID

#### POST /api/players

Create a new player

```json
{
  "playerName": "string",
  "ethAddress": "string",
  "team": "string"
}
```

#### PUT /api/players/[id]

Update a player

```json
{
  "playerName": "string",
  "team": "string"
  // other updateable fields
}
```

#### DELETE /api/players/[id]

Delete a player

### Training System

#### POST /api/game/train

Train a player's stat

```json
{
  "playerId": "string",
  "statToTrain": "strength|stamina|passing|shooting|defending|speed|positioning"
}
```

### Investment System

#### GET /api/game/invest

Get available investment options

#### POST /api/game/invest

Make an investment

```json
{
  "playerId": "string",
  "investmentType": "SAFE|MODERATE|RISKY",
  "amount": "number"
}
```

### Match System

#### POST /api/game/match

Simulate a match between teams

```json
{
  "homeTeamId": "string",
  "awayTeamId": "string"
}
```

## Game Mechanics

### Player Stats

- Range: 0.00 - 20.00
- Stats:
  - Strength
  - Stamina
  - Passing
  - Shooting
  - Defending
  - Speed
  - Positioning

### Training

- Cost increases with stat level
- Success rate decreases with stat level
- Stat increase: 0.5 per successful training

### Investments

1. Safe Investment
   - Min Amount: 100
   - Max Return: 15%
   - Risk: 10%
2. Moderate Investment
   - Min Amount: 500
   - Max Return: 35%
   - Risk: 30%
3. Risky Investment
   - Min Amount: 1000
   - Max Return: 100%
   - Risk: 60%

### Matches

- Team performance based on player stats
- Rewards for participation
- Bonus rewards for winning
- Individual player performance tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
