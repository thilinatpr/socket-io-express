require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { startMonitoring } = require('./fillMonitor');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Update to your frontend URL if hosted separately
    methods: ["GET", "POST"]
  }
});

// Serve static files (like index.html in /public)
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('🔌 Client connected');
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
  });
});

// Start Hyperliquid fills monitoring
startMonitoring(io);

// Use Render-provided PORT or fallback for local
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
