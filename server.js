const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); // broadcast
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Listen on Render-assigned port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
