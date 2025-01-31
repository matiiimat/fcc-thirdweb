# Netlify Setup Guide

## Environment Variables

You need to set up the following environment variable in your Netlify project:

1. Go to your Netlify project dashboard
2. Navigate to Site settings > Build & deploy > Environment
3. Click "Edit variables"
4. Add the following environment variable:

```
MONGODB_URI=mongodb+srv://mathieulr21:CHBTkLgXd9Hq2llV@fccfc.ofxet.mongodb.net/fccfc?retryWrites=true&w=majority&appName=fccfc
```

## Build Settings

Ensure your build settings in Netlify are configured correctly:

1. Build command: `yarn build`
2. Publish directory: `.next`
3. Node.js version: 18.x (or higher)

## Next.js Plugin

Make sure the Next.js plugin is installed:

1. Go to Site settings > Build & deploy > Continuous Deployment
2. Under "Build plugins", verify that "@netlify/plugin-nextjs" is installed
3. If not, install it from the plugins directory

## Deployment

After setting up the environment variables:

1. Trigger a new deployment:

   - Go to the Deploys tab
   - Click "Trigger deploy" > "Clear cache and deploy site"

2. Monitor the deployment logs for any issues

## Troubleshooting

If you encounter build errors:

1. Verify the environment variables are set correctly
2. Check the build logs for specific error messages
3. Ensure MongoDB Atlas IP whitelist includes Netlify's IPs
4. Try clearing the build cache and redeploying

## MongoDB Atlas Settings

1. Network Access:

   - Go to MongoDB Atlas > Network Access
   - Add 0.0.0.0/0 to IP whitelist (for production)
   - This allows access from any IP address

2. Database Access:
   - Verify the database user has correct permissions
   - Ensure the connection string is correct

## Important Notes

1. The MongoDB connection is now configured to skip during build time to prevent build errors
2. Database connections will only be attempted during runtime
3. Make sure to clear the Netlify cache when redeploying after environment variable changes

## Local Development

For local development:

1. Continue using the `.env.local` file
2. The environment variables in Netlify will only be used in production
3. Local development should work as before with no changes needed
