import { createServer } from 'node:http';

import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
});

io.on('connection', (socket) => {
  socket.emit('connected', { id: socket.id });
});

httpServer.listen(5000, () => {
  // eslint-disable-next-line no-console
  console.log('Realtime service listening on :5000');
});
