import mongoose from 'mongoose';

// Only try to connect to MongoDB during runtime, not during build time
const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // During build time, return null to prevent connection attempts
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'build') {
    console.log('Skipping MongoDB connection during build');
    return null;
  }

  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  // Log the connection string (without credentials)
  const sanitizedUri = MONGODB_URI.replace(
    /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
    'mongodb+srv://[username]:[password]@'
  );
  console.log('Connecting to MongoDB:', sanitizedUri);

  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 20,      // Increased from 10 to 20
      minPoolSize: 5,       // Added minimum pool size
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4,            // Use IPv4, faster DNS resolution
    };

    console.log('Creating new MongoDB connection');
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        mongoose.connection.on('error', (error) => {
          console.error('MongoDB connection error:', error);
        });
        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB disconnected');
        });
        mongoose.connection.on('reconnected', () => {
          console.log('MongoDB reconnected');
        });
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('Error while awaiting MongoDB connection:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;