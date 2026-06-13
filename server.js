const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors');

// Enable open resource sharing across systems
app.use(cors());

// Initialize Socket.io to accept standard polling and websocket connections natively
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true // Backward compatibility for older socket client packages
});

// Health check endpoint for testing in your browser
app.get('/', (req, res) => {
    res.send('Jukebox sync server is live and healthy!');
});

// Explicitly handle Discord's default polling check route
app.get('/api/socket.io/', (req, res) => {
    res.status(200).send('Socket gateway ready.');
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
    console.log(`Backend engine fully operational on port ${PORT}`);
});
