# Environment Setup for Test and Live Data

## Current Situation

- Single MongoDB cluster handling all data
- Environment configured through MONGODB_URI in .env.local
- Need to separate test and live data environments

## Implementation Plan

### 1. Environment Configuration

#### A. Local Development (.env.local)

```env
# Test Environment (for development)
MONGODB_URI_TEST=mongodb+srv://<username>:<password>@<test-cluster>.mongodb.net/soccer-game?retryWrites=true&w=majority

# Live Environment (for production)
MONGODB_URI_LIVE=mongodb+srv://<username>:<password>@<live-cluster>.mongodb.net/soccer-game?retryWrites=true&w=majority

# Active Environment Selection
MONGODB_ENV=test  # Switch between 'test' and 'live'
```

#### B. Netlify Environment Variables

Configure the same variables in Netlify:

1. MONGODB_URI_TEST
2. MONGODB_URI_LIVE
3. MONGODB_ENV=live (for production)

### 2. Code Changes Required

#### A. Update MongoDB Connection Logic (src/app/lib/mongodb.ts)

- Modify the connection logic to use the appropriate URI based on MONGODB_ENV
- Add environment-specific logging
- Implement connection validation

#### B. Create Data Migration Scripts

1. Script to copy data between environments (for initial setup)
2. Script to clear all data from live environment
3. Backup script for safety

### 3. Implementation Steps

1. **Setup New Test Cluster**

   - Follow MONGODB_SETUP.md to create new cluster
   - Configure network access and user permissions
   - Get connection string for test environment

2. **Update Environment Configuration**

   - Create new .env.local with both URIs
   - Update Netlify environment variables
   - Test connection to both clusters

3. **Code Updates**

   - Modify mongodb.ts to support dual environments
   - Create migration utilities
   - Add environment indicators in admin interface

4. **Data Migration**
   - Backup current live data
   - Clear live environment data
   - Verify test environment setup

### 4. Testing Plan

1. **Local Testing**

   - Test connection to both clusters
   - Verify environment switching
   - Test data isolation between environments

2. **Netlify Testing**
   - Deploy to preview branch
   - Verify production environment connection
   - Test environment separation

### 5. Deployment Strategy

1. **Pre-Deployment**

   - Backup all current data
   - Verify all migration scripts
   - Update documentation

2. **Deployment**

   - Update Netlify environment variables
   - Deploy code changes
   - Execute data cleanup
   - Verify system operation

3. **Post-Deployment**
   - Monitor system for issues
   - Verify data isolation
   - Update team documentation

### 6. Rollback Plan

1. **Code Rollback**

   - Keep previous mongodb.ts version
   - Maintain backup of environment variables

2. **Data Rollback**
   - Keep backup of original data
   - Document restore procedures

## Security Considerations

1. **Environment Separation**

   - Ensure complete isolation between test/live data
   - Different database users for each environment
   - Separate connection strings and access controls

2. **Access Control**
   - Restrict test environment access to development team
   - Maintain strict access controls for live environment
   - Regular security audits

## Monitoring and Maintenance

1. **Monitoring**

   - Set up separate monitoring for each environment
   - Configure alerts for unusual activity
   - Regular connection health checks

2. **Maintenance**
   - Regular backup schedule for both environments
   - Periodic security reviews
   - Update access controls as team changes

## Next Steps

1. Create new MongoDB cluster for test environment
2. Update environment variables in both local and Netlify settings
3. Implement code changes for environment support
4. Execute data migration and cleanup
5. Deploy and verify changes
