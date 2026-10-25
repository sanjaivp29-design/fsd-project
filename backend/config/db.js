import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fleet_management';
  
  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri.replace(/\/\/[^@]*@/, '//***:***@')}`);
    
    // Connect with a 2000ms serverSelectionTimeoutMS so we fail fast to memory server if local mongod service isn't running
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (primaryErr) {
    console.warn(`[Database] Primary MongoDB service unavailable (${primaryErr.message}).`);
    console.log(`[Database] Booting embedded MongoMemoryServer engine for zero-configuration local execution...`);
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'fleet_management',
        },
        spawnTimeoutMS: 60000,
      });
      const memUri = memoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] Embedded MongoDB engine active at: ${memUri}`);
      console.log(`[Database] All standard Mongoose schemas, queries, and aggregations are 100% active.`);
      return conn;
    } catch (fallbackErr) {
      console.error(`[Database] Fatal error: Failed to start in-memory MongoDB fallback:`, fallbackErr);
      process.exit(1);
    }
  }
};

export const closeDB = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
  }
};
