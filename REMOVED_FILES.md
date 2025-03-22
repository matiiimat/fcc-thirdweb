# Removed Files Documentation

This document tracks files that are no longer needed in the project after UI changes.

## Files No Longer Needed

1. **src/app/leaderboard/page.tsx**

   - Reason: The leaderboard functionality has been replaced by the new League page.
   - Status: Can be removed

2. **src/app/settings/page.tsx**
   - Reason: The settings button has been removed from the header.
   - Status: Can be removed

## UI Changes Made

1. **Header Changes**:

   - Removed the settings button
   - Removed the leaderboard button
   - Added the store button (moved from footer)

2. **Footer Changes**:

   - Removed the store button (moved to header)
   - Added the League button with leaderboard icon

3. **New Pages**:
   - Created a new League page at `src/app/league/page.tsx`

## Note

While these files are no longer directly accessed from the UI, they may still be referenced elsewhere in the codebase. Before permanently deleting these files, ensure they are not imported or used by other components.
