const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// In-memory room storage
const rooms = {};

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // CREATE ROOM
  socket.on("createRoom", ({ name }, callback) => {
    const roomId = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    rooms[roomId] = {
    roomId,
    users: [
        {
        id: socket.id,
        name,
        vote: null
        }
    ],
    revealed: false
    };

    socket.join(roomId);

    console.log(`Room ${roomId} created by ${name}`);

    callback(roomId);
    io.to(roomId).emit("roomUpdated", rooms[roomId]);
  });

  // JOIN ROOM
  socket.on("joinRoom", ({ roomId, name }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.users.push({
    id: socket.id,
    name,
    vote: null
    });    socket.join(roomId);

    console.log(`${name} joined room ${roomId}`);
    io.to(roomId).emit("roomUpdated", room);
  });

// CAST VOTE
    socket.on("vote", ({ roomId, card }) => {
    const room = rooms[roomId];
    if (!room || room.revealed) return;

    const user = room.users.find(u => u.id === socket.id);
    if (!user) return;

    user.vote = card;
    io.to(roomId).emit("roomUpdated", room);
    });
    // REVEAL VOTES
    socket.on("revealVotes", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.revealed = true;
    io.to(roomId).emit("roomUpdated", room);
    });
    // RESET ROUND
    socket.on("resetVotes", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.revealed = false;
    room.users.forEach(u => (u.vote = null));

    io.to(roomId).emit("roomUpdated", room);
    });

});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
