const express = require('express');
const app = express();
const proxy = require('express-http-proxy'); 
const http = require('http').createServer(app);

// 1. Setup Socket.io to listen natively to the raw path
const io = require('socket.io')(http, {
    path: '/socket.io', 
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 2. DISCORD TUNNEL ROUTER:
// This intercepts Discord's '/api' prefix and forwards it cleanly into your server engines
app.use('/api', proxy(`http://localhost:${process.env.PORT || 3000}`, {
    proxyReqPathResolver: function (req) {
        return req.url; // Strips out '/api' so Socket.io reads the underlying packet perfectly!
    }
}));

const PORT = process.env.PORT || 3000;
let roomStates = {};

io.on('connection', (socket) => {
    console.log('User joined sync array via Discord:', socket.id);

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
