import http from 'http';
import express from 'express';
import cors from 'cors';
import colyseus from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { TacticsRoom } from './rooms/TacticsRoom.js';

const { Server, matchMaker } = colyseus;

const app = express();
const port = Number(process.env.PORT || 2567);

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*'
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Browse open lobbies endpoint
app.get('/api/lobbies', async (_req, res) => {
  try {
    const rooms = await matchMaker.query({ name: 'tactics_room' });
    const openRooms = rooms
      .filter(r => (r.metadata?.phase || 'lobby') === 'lobby' && !r.locked)
      .map(r => ({
        roomId: r.roomId,
        roomCode: r.metadata?.roomCode || '',
        clients: r.clients,
        maxClients: r.maxClients
      }));
    res.json({ lobbies: openRooms });
  } catch (err: any) {
    res.json({ lobbies: [] });
  }
});

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

gameServer.define('tactics_room', TacticsRoom)
  .filterBy(['roomCode']);

gameServer.listen(port).then(() => {
  console.log(`[TinyTactics Server] Real-time game server listening on http://localhost:${port}`);
});
