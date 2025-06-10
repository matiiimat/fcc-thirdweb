import { TRAINING_CONSTANTS } from './constants';

/**
 * Send notification via internal API endpoint
 */
export async function sendFrameNotification(
  token: string,
  title: string,
  body: string,
  targetUrl: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        title,
        body,
        targetUrl,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Frame notification failed:', result);
      return false;
    }

    return result.success;
    
  } catch (error) {
    console.error('Error sending frame notification:', error);
    return false;
  }
}

/**
 * Check if notification should be triggered based on cooldown
 */
export function shouldTriggerNotification(
  lastActionDate: Date | null,
  lastTriggerDate: Date | null,
  cooldownHours: number
): boolean {
  if (!lastActionDate) return false;
  
  const now = new Date();
  const actionTime = new Date(lastActionDate).getTime();
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const notificationTime = actionTime + cooldownMs;
  
  // If cooldown hasn't passed yet, no notification
  if (now.getTime() < notificationTime) {
    return false;
  }
  
  // If we already triggered a notification for this cooldown period, don't trigger again
  if (lastTriggerDate) {
    const triggerTime = new Date(lastTriggerDate).getTime();
    // If trigger was after the action, we already notified for this cooldown
    if (triggerTime >= actionTime) {
      return false;
    }
  }
  
  return true;
}

/**
 * Trigger training notification if conditions are met
 */
export async function triggerTrainingNotification(
  player: any,
  token: string,
  targetUrl?: string
): Promise<{ success: boolean; sent?: boolean; error?: string }> {
  try {
    // Check if notification should be triggered
    const shouldNotify = shouldTriggerNotification(
      player.lastTrainingDate,
      player.lastTrainingNotificationTrigger,
      TRAINING_CONSTANTS.TRAINING_COOLDOWN_HOURS
    );
    
    if (!shouldNotify) {
      return { success: true, sent: false };
    }
    
    // Send notification
    const sent = await sendFrameNotification(
      token,
      '⚽ Training Available!',
      `${player.playerName}, your training cooldown is over! Time to improve your skills.`,
      targetUrl || `${process.env.NEXT_PUBLIC_APP_URL}/train`
    );
    
    return { success: true, sent };
    
  } catch (error) {
    console.error('Error triggering training notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Trigger match notification if conditions are met
 */
export async function triggerMatchNotification(
  player: any,
  token: string,
  targetUrl?: string
): Promise<{ success: boolean; sent?: boolean; error?: string }> {
  try {
    // Check if notification should be triggered
    const shouldNotify = shouldTriggerNotification(
      player.lastGameDate,
      player.lastMatchNotificationTrigger,
      TRAINING_CONSTANTS.GAME_COOLDOWN_HOURS
    );
    
    if (!shouldNotify) {
      return { success: true, sent: false };
    }
    
    // Send notification
    const sent = await sendFrameNotification(
      token,
      '🏆 Match Ready!',
      `${player.playerName}, you can now play a solo match! Show your skills on the pitch.`,
      targetUrl || `${process.env.NEXT_PUBLIC_APP_URL}/solomatch`
    );
    
    return { success: true, sent };
    
  } catch (error) {
    console.error('Error triggering match notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}