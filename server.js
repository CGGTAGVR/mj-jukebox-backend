const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
    socket.on('join-room', (instanceId) => socket.join(instanceId));
    socket.on('play-track', (data) => {
        io.to(data.instanceId).emit('room-sync', { 
            songId: data.songId, 
            playing: true, 
            progress: 0 
        });
    });
});

http.listen(PORT, () => console.log(`Server running on ${PORT}`));
