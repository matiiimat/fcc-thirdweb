# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas for your soccer game application.

## Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Fill in your details and create your account

## Step 2: Create a Free Cluster

1. Choose "Shared" (Free) cluster option
2. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
3. Choose a region closest to your users
4. Select "M0 Sandbox" (Free tier) for cluster tier
5. Give your cluster a name (e.g., "soccer-game")
6. Click "Create Cluster"

## Step 3: Set Up Database Access

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Enter a username and password
   - Username: (choose a username)
   - Password: (create a secure password)
   - Make sure to save these credentials!
5. Under "Database User Privileges" select "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. For development, you can click "Allow Access from Anywhere" (ALLOW ALL: 0.0.0.0/0)
   - Note: For production, you should restrict this to your application's IP
4. Click "Confirm"

## Step 5: Get Your Connection String

1. In the cluster view, click "Connect"
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string
5. Replace `<password>` with your database user's password
6. Replace `<dbname>` with `soccer-game`

## Step 6: Configure Your Application

1. In your project's `.env.local` file, add your connection string:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/soccer-game?retryWrites=true&w=majority
```

## Testing the Connection

1. Start your development server:

```bash
npm run dev
```

2. Try creating a new player through the application
3. Check your MongoDB Atlas dashboard to see if the data appears in the collections

## Common Issues and Solutions

### Can't Connect to Database

- Verify your IP is whitelisted in Network Access
- Check if your connection string is correct in .env.local
- Ensure your database user credentials are correct

### Data Not Appearing

- Check if your database user has write permissions
- Verify you're connecting to the correct database
- Look for any errors in your application console

## Security Best Practices

1. Never commit your .env.local file to version control
2. Regularly rotate your database passwords
3. Restrict IP access in production
4. Use the principle of least privilege for database users
5. Enable MongoDB Atlas backup for your data

## Next Steps

1. Monitor your database performance in the Atlas dashboard
2. Set up alerts for unusual activity
3. Consider upgrading your cluster if you need more resources
4. Implement database indexing for better performance

For additional help, refer to:

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver Documentation](https://docs.mongodb.com/drivers/node/)
