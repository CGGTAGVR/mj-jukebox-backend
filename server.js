const express = require('express');
const app = express();
const proxy = require('express-http-proxy'); 
const http = require('http').createServer(app);

// Setup Socket.io to accept direct WebSocket connections from proxy tunnels
const io = require('socket.io')(http, {
    path: '/socket.io', 
    transports: ['websocket'],
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Intercepts Discord's '/api' prefix and forwards it straight into local loops
app.use('/api', proxy(`http://localhost:${process.env.PORT || 3000}`, {
    proxyReqPathResolver: function (req) {
        return req.url; 
    }
}));

const PORT = process.env.PORT || 3000;
let roomStates = {};

io.on('connection', (socket) => {
    console.log('User joined sync array via WebSocket:', socket.id);

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
    console.log(`Backend server fully operating on port ${PORT}`);
});
