import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fleet_management';
  
  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri.replace(/\/\/[^@]*@/, '//***:***@')}`);
    
    // For remote/Atlas connections, allow up to 15 seconds for DNS resolution and TLS handshake; local connections fail fast (2.5s) to memory server
    const isRemote = uri.includes('mongodb+srv://') || (!uri.includes('127.0.0.1') && !uri.includes('localhost'));
    const timeoutMS = isRemote ? 15000 : 2500;

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMS,
      connectTimeoutMS: timeoutMS,
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
