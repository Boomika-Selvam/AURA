import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDatabase } from './services/database.js';
import { createRealtimeServer } from './sockets/realtime.js';

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = createRealtimeServer(server);
app.set('io', io);

connectDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`AURA API listening on ${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed', error);
    process.exit(1);
  });
