const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors');

app.use(cors());

// Set Socket.io to its standard path (which is what Discord forwards to Render)
const io = require('socket.io')(http, {
    path: '/socket.io',
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// HEALTH CHECKS & FALLBACKS
app.get('/', (req, res) => {
    res.send('Jukebox sync server is live!');
});

// If Discord doesn't strip the /api prefix, this custom handler manually passes it to Socket.io
app.get('/api/socket.io/*', (req, res) => {
    req.url = req.url.replace('/api', '');
    io.engine.handleRequest(req, res);
});

const PORT = process.env.PORT || 3000;
let roomStates = {};

io.on('connection', (socket) => {
    console.log('User linked to sync array:', socket.id);

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
    console.log(`Backend engine operational on port ${PORT}`);
});
