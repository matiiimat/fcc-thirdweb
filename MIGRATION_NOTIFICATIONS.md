# Notification Fields Migration Guide

This document provides instructions for migrating player records to include notification trigger fields for Farcaster notifications via Neynar.

## Overview

The notification system requires two additional fields in the Player model:
- `lastTrainingNotificationTrigger`: Tracks when training notifications were last triggered
- `lastMatchNotificationTrigger`: Tracks when match notifications were last triggered

## Migration Scripts

### 1. Migrate All Players (Recommended)

**Script**: `scripts/migrate-all-players-notifications.js`

Migrates all non-bot players to include notification fields.

```bash
node scripts/migrate-all-players-notifications.js
```

**What it does:**
- Finds all players that are NOT bots (excludes `ethAddress` starting with `0xbot` and `playerId` matching `bot_\d+`)
- Adds `lastTrainingNotificationTrigger: null` and `lastMatchNotificationTrigger: null` to players missing these fields
- Provides detailed migration results and verification

### 2. Migrate Specific Player (Testing)

**Script**: `scripts/test-migration-api.js`

For testing migration on a specific player address.

```bash
node scripts/test-migration-api.js
```

**API Endpoint**: `POST /api/migrate-notifications`
```json
{
  "ethAddress": "0x6be82ef4ad6534a66e8e7568956c523bb1b5e6e0"
}
```

## Bot Identification

Bots are automatically excluded from migration using these criteria:
- `ethAddress` starts with `'0xbot'`
- `playerId` matches pattern `bot_\d+` (e.g., `bot_1`, `bot_2`)

## Migration Process

### Pre-Migration Checklist
1. ✅ Ensure MongoDB connection is available
2. ✅ Verify `.env` file contains `MONGODB_URI`
3. ✅ Backup database (recommended for production)

### Running Migration

1. **Development/Testing**:
   ```bash
   # Test with specific player first
   node scripts/test-migration-api.js
   
   # Then migrate all players
   node scripts/migrate-all-players-notifications.js
   ```

2. **Production**:
   ```bash
   # Always backup first
   mongodump --uri="your-mongodb-uri" --out=backup-$(date +%Y%m%d)
   
   # Run migration
   node scripts/migrate-all-players-notifications.js
   ```

### Expected Output

```
🚀 Starting notification fields migration for all non-bot players...
📅 Started at: 2024-01-15T10:30:00.000Z
🔌 Connecting to MongoDB...
🔍 Finding non-bot players...
📊 Found 150 non-bot players to migrate
📈 Migration Results:
   • Players matched: 150
   • Players modified: 150
🔍 Verification - Sample of migrated players:
   1. John Doe (0x1234...)
      Training trigger: null
      Match trigger: null
✅ Migration completed successfully!
```

## Verification

After migration, verify the fields exist:

```javascript
// Check a specific player
db.players.findOne(
  { ethAddress: "0x1234..." },
  { 
    playerName: 1, 
    lastTrainingNotificationTrigger: 1, 
    lastMatchNotificationTrigger: 1 
  }
)

// Count players with notification fields
db.players.countDocuments({
  lastTrainingNotificationTrigger: { $exists: true },
  lastMatchNotificationTrigger: { $exists: true },
  ethAddress: { $not: /^0xbot/ }
})
```

## Rollback (If Needed)

To remove notification fields:

```javascript
db.players.updateMany(
  { ethAddress: { $not: /^0xbot/ } },
  { 
    $unset: { 
      lastTrainingNotificationTrigger: "",
      lastMatchNotificationTrigger: "" 
    } 
  }
)
```

## Integration with Neynar

After migration, the notification system will:

1. **Training Notifications**: Triggered when `lastTrainingDate` + 6 hours has passed
2. **Match Notifications**: Triggered when `lastGameDate` + 24 hours has passed
3. **Cooldown Management**: Prevents spam by tracking last trigger times

### API Usage

```typescript
// Trigger notification
const response = await fetch('/api/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ethAddress: userAddress,
    type: 'training' // or 'match'
  })
});

const result = await response.json();
if (result.success) {
  // Send Neynar notification
  await sendNeynarNotification(userFid, notificationMessage);
}
```

## Troubleshooting

### Common Issues

1. **"No players found"**: Check MongoDB connection and database name
2. **"Fields already exist"**: Normal if migration was run before or auto-migration occurred
3. **Permission errors**: Ensure database user has write permissions

### Debug Commands

```bash
# Check MongoDB connection
node -e "console.log(process.env.MONGODB_URI)"

# Test database access
mongosh "your-mongodb-uri" --eval "db.players.countDocuments()"

# Check for bots
mongosh "your-mongodb-uri" --eval "db.players.find({ethAddress: /^0xbot/}).count()"
```

## Future Migrations

For future notification-related migrations:

1. Create new migration script in `scripts/` directory
2. Follow naming convention: `migrate-[feature]-[date].js`
3. Update this documentation
4. Test on development environment first
5. Always include rollback instructions