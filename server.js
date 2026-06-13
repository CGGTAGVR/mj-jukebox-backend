const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    path: '/api/socket.io', // Standardizes path mapping configurations
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

let roomStates = {};

io.on('connection', (socket) => {
    console.log('User joined sync array:', socket.id);

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
        console.log('User departed sync array:', socket.id);
    });
});

http.listen(PORT, () => {
    console.log(`Backend server operating on port ${PORT}`);
});
