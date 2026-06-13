const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    path: '/api/socket.io', // Tells your backend to listen precisely to the Discord tunnel traffic
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Living state tracking for the synchronized rooms
let roomStates = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (instanceId) => {
        socket.join(instanceId);
        if (!roomStates[instanceId]) {
            roomStates[instanceId] = { songId: null, progress: 0, playing: false, lastUpdated: Date.now() };
        }
        socket.emit('room-sync', roomStates[instanceId]);
    });

    socket.on('play-track', (data) => {
        const { instanceId, songId } = data;
        roomStates[instanceId] = {
            songId: songId,
            progress: 0,
            playing: true,
            lastUpdated: Date.now()
        };
        io.to(instanceId).emit('room-sync', roomStates[instanceId]);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

http.listen(PORT, () => {
    console.log(`Backend synchronization server running on port ${PORT}`);
});
