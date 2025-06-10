# Farcaster Notification System Setup

This document explains how to set up and use the notification system for training and match cooldowns in the Farcaster mini-app.

## Overview

The notification system allows players to receive notifications when their training (6-hour cooldown) or match (24-hour cooldown) actions are available again.

## API Endpoint

**POST** `/api/trigger`

### Request Body

```json
{
  "ethAddress": "0x...", // Player's Ethereum address
  "type": "training" | "match" // Type of notification to trigger
}
```

### Response

**Success (cooldown passed):**
```json
{
  "success": true
}
```

**Cooldown active:**
```json
{
  "success": false,
  "remaining": 21600000 // Remaining time in milliseconds
}
```

**Error:**
```json
{
  "error": "Error message"
}
```

## Setup Steps

### 1. Run the Migration Script

First, add the notification fields to existing players:

```bash
node scripts/add-notification-fields.js
```

This will add `lastTrainingNotificationTrigger` and `lastMatchNotificationTrigger` fields to the test player.

### 2. Test the API

Run the test script to verify the API works:

```bash
node scripts/test-trigger-api.js
```

### 3. Integration with Farcaster Frame

In your Farcaster frame, you can get the user's FID and ETH address from the context:

```typescript
import sdk, { Context } from "@farcaster/frame-sdk";

// Get context
const context = await sdk.context;
const fid = context?.user?.fid;
const ethAddress = context?.user?.verifiedAddresses?.eth_addresses?.[0];

// Trigger notification
const response = await fetch('/api/trigger', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ethAddress: ethAddress,
    type: 'training' // or 'match'
  })
});

const result = await response.json();
if (result.success) {
  // Notification triggered successfully
  console.log('Notification set up!');
} else {
  // Still on cooldown
  const remainingHours = Math.floor(result.remaining / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((result.remaining % (1000 * 60 * 60)) / (1000 * 60));
  console.log(`Cooldown active: ${remainingHours}h ${remainingMinutes}m remaining`);
}
```

## Database Schema Changes

The following optional fields were added to the Player model:

- `lastTrainingNotificationTrigger?: Date | null` - Timestamp of last training notification trigger
- `lastMatchNotificationTrigger?: Date | null` - Timestamp of last match notification trigger

These fields are optional to maintain compatibility with existing players.

## Cooldown Periods

- **Training**: 6 hours (`TRAINING_CONSTANTS.TRAINING_COOLDOWN_HOURS`)
- **Match**: 24 hours (`TRAINING_CONSTANTS.GAME_COOLDOWN_HOURS`)

## Error Handling

The API handles the following error cases:

- Invalid HTTP method (405)
- Missing or invalid ethAddress (400)
- Missing or invalid type (400)
- Player not found (404)
- Database errors (500)

## Security Considerations

- The API validates all input parameters
- ETH addresses are normalized to lowercase for consistent lookup
- MongoDB operations use proper error handling
- Rate limiting should be considered for production use

## Next Steps

1. Integrate with Neynar's notification system
2. Add rate limiting to prevent abuse
3. Consider adding notification preferences per player
4. Add logging for monitoring notification triggers