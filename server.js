require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { startMonitoring } = require('./fillMonitor');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Client connected');
});

startMonitoring(io); // pass socket instance for broadcasting

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
