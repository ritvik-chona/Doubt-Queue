import dns from 'node:dns';
import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) throw new Error('MONGO_URI is not set');

  // Some local networks (common on Windows) refuse the SRV lookup that mongodb+srv:// needs.
  // DNS_SERVERS=8.8.8.8,1.1.1.1 works around it; leave unset in production.
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()));
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
