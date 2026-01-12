import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function broadcastRooms() {
  const activeRooms = Object.entries(rooms).map(([id, room]) => ({
    id,
    players: room.users.length,
    revealed: room.revealed
  }));

  io.emit("activeRooms", activeRooms);
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Send rooms immediately
  socket.emit("activeRooms",
    Object.entries(rooms).map(([id, room]) => ({
      id,
      players: room.users.length,
      revealed: room.revealed
    }))
  );

  socket.on("createRoom", (name, callback) => {
    if (!name) return;

    const roomId = generateRoomId();

    rooms[roomId] = {
      users: [{ id: socket.id, name }],
      votes: {},
      revealed: false
    };

    socket.join(roomId);
    console.log(`Room ${roomId} created by ${name}`);

    broadcastRooms();

    if (typeof callback === "function") {
      callback(roomId);
    }
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    const room = rooms[roomId];
    if (!room) return;

    const exists = room.users.some(u => u.id === socket.id);
    if (!exists) {
      room.users.push({ id: socket.id, name });
      socket.join(roomId);
      console.log(`${name} joined room ${roomId}`);
    }

    socket.emit("roomState", {
      roomId,
      users: room.users,
      votes: room.votes,
      revealed: room.revealed
    });

    broadcastRooms();
  });

  socket.on("castVote", ({ roomId, value }) => {
    const room = rooms[roomId];
    if (!room || room.revealed) return;

    room.votes[socket.id] = value;

    io.to(roomId).emit("roomState", {
      roomId,
      users: room.users,
      votes: room.votes,
      revealed: room.revealed
    });
  });

  socket.on("revealVotes", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.revealed = true;
    broadcastRooms();

    io.to(roomId).emit("roomState", {
      roomId,
      users: room.users,
      votes: room.votes,
      revealed: room.revealed
    });
  });

  socket.on("resetVotes", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.votes = {};
    room.revealed = false;
    broadcastRooms();

    io.to(roomId).emit("roomState", {
      roomId,
      users: room.users,
      votes: room.votes,
      revealed: room.revealed
    });
  });

  socket.on("disconnect", () => {
    for (const id in rooms) {
      rooms[id].users = rooms[id].users.filter(
        u => u.id !== socket.id
      );
      delete rooms[id].votes[socket.id];

      if (rooms[id].users.length === 0) {
        delete rooms[id];
      }
    }

    broadcastRooms();
  });
});

server.listen(4000, () => {
  console.log("Server running on port 4000");
});
