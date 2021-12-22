import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

const app = express();
app.use(cors());
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'],
  },
});

interface ChatMessage {
  author: string;
  content: string;
}

server.listen(8080, () => {
  console.log('Listening on 8080');
});

io.on('connection', (socket) => {
  console.log(socket.handshake.address);

  socket.on('test', (data) => {
    console.log(data);
  });

  socket.on('newMessage', (data: ChatMessage) => {
    console.log(`New message: ${JSON.stringify(data)}`);
  });
});
