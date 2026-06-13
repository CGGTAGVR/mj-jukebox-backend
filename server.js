const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    // The proxy strips '/api', so the request arrives here as '/socket.io'
    path: '/socket.io',
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
    console.log('Connection established through Discord Tunnel');
    
    socket.on('join-room', (room) => socket.join(room));
    
    socket.on('play-track', (data) => {
        io.to(data.instanceId).emit('room-sync', { 
            songId: data.songId, 
            playing: true 
        });
    });
});

http.listen(PORT, () => console.log(`Server live on ${PORT}`));
