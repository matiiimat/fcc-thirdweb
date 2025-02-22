# Database Environment Setup

## Current Setup

Currently, the application uses a single MongoDB connection string defined in `.env.local` through the `MONGODB_URI` environment variable. The connection is managed in `src/app/lib/mongodb.ts`.

## Plan for Dev/Prod Database Separation

### 1. Environment Variables

We'll need to modify the environment setup to handle both development and production databases:

```env
# .env.local (development)
MONGODB_URI=mongodb+srv://<username>:<password>@<dev-cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# .env.production
MONGODB_URI=mongodb+srv://<username>:<password>@<prod-cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### 2. Steps to Implement

1. **Create New Production Database Cluster**

   - Log into MongoDB Atlas
   - Create a new cluster for production
   - Set up network access and database user credentials
   - Get the new connection string

2. **Environment Configuration**

   - Keep the current connection string in `.env.local` for development
   - Create `.env.production` with the production database connection string
   - Update `.env.example` to show both development and production examples
   - Add `.env.production` to `.gitignore` if not already present

3. **Verification Steps**
   - Ensure local development still works with dev database
   - Test production build locally using production environment
   - Verify data isolation between environments

### 3. Best Practices

1. **Data Isolation**

   - Development and production data will be completely separate
   - No risk of development operations affecting production data
   - Ability to test with different data sets in each environment

2. **Security**

   - Use different database users for dev and prod
   - Different connection strings ensure proper access control
   - Production database should have stricter security settings

3. **Monitoring**
   - Set up separate monitoring for each environment
   - Different alert thresholds for dev vs prod
   - Easier to track issues in each environment

### 4. Additional Considerations

1. **Data Migration**

   - Plan for how to migrate data from dev to prod when needed
   - Consider creating scripts for data synchronization
   - Document the process for future reference

2. **Backup Strategy**
   - Set up appropriate backup schedules for each environment
   - More frequent backups for production
   - Regular testing of backup restoration

## Implementation Notes

The current MongoDB connection setup in `src/app/lib/mongodb.ts` already handles different environments through `process.env.NODE_ENV`, so no code changes are required. The system will automatically use the correct connection string based on the environment.

## Next Steps

1. Create the new production cluster in MongoDB Atlas
2. Set up the new database user and access controls
3. Create `.env.production` with the new connection string
4. Test the setup in both environments
