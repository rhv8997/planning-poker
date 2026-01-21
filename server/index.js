import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8080",
  /https:\/\/.*\.railway\.app/,
  /https:\/\/.*\.github\.io\/planning-poker/
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
    roomName: room.roomName,
    players: room.users.length,
    revealed: room.revealed,
    createdAt: room.createdAt
  }));

  io.emit("activeRooms", activeRooms);
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Send rooms immediately
  socket.emit("activeRooms",
    Object.entries(rooms).map(([id, room]) => ({
      id,
      roomName: room.roomName,
      players: room.users.length,
      revealed: room.revealed
    }))
  );

  socket.on("createRoom", (data, callback) => {
    // Support both old format (just name) and new format ({ name, roomName })
    const name = typeof data === 'string' ? data : data.name;
    const roomName = typeof data === 'object' ? data.roomName : null;

    if (!name) return;

    const roomId = generateRoomId();

    rooms[roomId] = {
      users: [{ id: socket.id, name }],
      votes: {},
      revealed: false,
      scrumMasterId: null,
      roomName: roomName || roomId,
      createdAt: Date.now()
    };

    socket.join(roomId);
    console.log(`Room ${roomId} (${roomName || roomId}) created by ${name}`);

    broadcastRooms();

    if (typeof callback === "function") {
      callback(roomId);
    }
  });

  socket.on("joinRoom", ({ roomId, name }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      console.log(`Room ${roomId} not found`);
      if (typeof callback === "function") {
        callback({ success: false, error: "Room not found" });
      }
      return;
    }

    const exists = room.users.some(u => u.id === socket.id);

    // Check if name is already taken by a different socket
    const existingUser = room.users.find(u => u.name === name && u.id !== socket.id);
    if (existingUser) {
      // Replace the old socket with the new one (handles multiple tabs/refresh)
      console.log(`Replacing old socket for "${name}" in room ${roomId}`);

      // Transfer votes if they had any
      if (room.votes[existingUser.id]) {
        room.votes[socket.id] = room.votes[existingUser.id];
        delete room.votes[existingUser.id];
      }

      // Transfer scrum master role if they were scrum master
      if (room.scrumMasterId === existingUser.id) {
        room.scrumMasterId = socket.id;
      }

      // Remove old user and add new one
      room.users = room.users.filter(u => u.id !== existingUser.id);
      room.users.push({ id: socket.id, name });
      console.log(`${name} (${socket.id}) replaced old connection in room ${roomId}`);
    } else if (!exists) {
      room.users.push({ id: socket.id, name });
      console.log(`${name} (${socket.id}) joined room ${roomId}`);
    } else {
      // Update the name if user is rejoining
      const user = room.users.find(u => u.id === socket.id);
      if (user) {
        user.name = name;
      }
      console.log(`${name} (${socket.id}) rejoined room ${roomId}`);
    }

    // Always join the socket to the room
    socket.join(roomId);

    console.log(`Room ${roomId} state:`, {
      users: room.users.map(u => `${u.name}(${u.id})`),
      scrumMasterId: room.scrumMasterId
    });

    // Send success callback
    if (typeof callback === "function") {
      callback({ success: true });
    }

    // Broadcast to ALL users in the room (including the one who just joined)
    io.to(roomId).emit("roomState", {
      roomId,
      roomName: room.roomName,
      users: room.users,
      votes: room.votes,
      revealed: room.revealed,
      scrumMasterId: room.scrumMasterId,
      createdAt: room.createdAt
    });

    broadcastRooms();
  });

  socket.on("castVote", ({ roomId, value }) => {
    const room = rooms[roomId];
    if (!room || room.revealed) return;

    room.votes[socket.id] = value;

    io.to(roomId).emit("roomState", {
      roomId,
      roomName: room.roomName,
      users: room.users,
      votes: room.votes,
      revealed: room.revealed,
      scrumMasterId: room.scrumMasterId,
      createdAt: room.createdAt
    });
  });

  socket.on("revealVotes", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.revealed = true;
    broadcastRooms();

    io.to(roomId).emit("roomState", {
      roomId,
      roomName: room.roomName,
      users: room.users,
      votes: room.votes,
      revealed: room.revealed,
      scrumMasterId: room.scrumMasterId,
      createdAt: room.createdAt
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
      roomName: room.roomName,
      users: room.users,
      votes: room.votes,
      revealed: room.revealed,
      scrumMasterId: room.scrumMasterId,
      createdAt: room.createdAt
    });
  });

  socket.on("claimScrumMaster", (roomId) => {
    const room = rooms[roomId];
    if (!room) {
      console.log(`claimScrumMaster: Room ${roomId} not found`);
      return;
    }

    console.log(`claimScrumMaster request from ${socket.id} for room ${roomId}`);
    console.log(`Current scrum master: ${room.scrumMasterId}`);

    // Only allow claiming if no scrum master exists
    if (!room.scrumMasterId) {
      room.scrumMasterId = socket.id;
      const user = room.users.find(u => u.id === socket.id);
      console.log(`${user?.name || socket.id} claimed scrum master in room ${roomId}`);

      io.to(roomId).emit("roomState", {
        roomId,
        roomName: room.roomName,
        users: room.users,
        votes: room.votes,
        revealed: room.revealed,
        scrumMasterId: room.scrumMasterId,
        createdAt: room.createdAt
      });
    } else {
      console.log(`Scrum master already exists: ${room.scrumMasterId}`);
    }
  });

  socket.on("revokeScrumMaster", (roomId) => {
    const room = rooms[roomId];
    if (!room) {
      console.log(`revokeScrumMaster: Room ${roomId} not found`);
      return;
    }

    console.log(`revokeScrumMaster request from ${socket.id} for room ${roomId}`);
    console.log(`Current scrum master: ${room.scrumMasterId}`);

    // Only allow revoking if the requester is the current scrum master
    if (room.scrumMasterId === socket.id) {
      const user = room.users.find(u => u.id === socket.id);
      console.log(`${user?.name || socket.id} revoked scrum master in room ${roomId}`);

      room.scrumMasterId = null;

      io.to(roomId).emit("roomState", {
        roomId,
        roomName: room.roomName,
        users: room.users,
        votes: room.votes,
        revealed: room.revealed,
        scrumMasterId: room.scrumMasterId,
        createdAt: room.createdAt
      });
    } else {
      console.log(`Only the current scrum master can revoke the role`);
    }
  });

  socket.on("disconnect", () => {
    for (const id in rooms) {
      const wasInRoom = rooms[id].users.some(u => u.id === socket.id);

      rooms[id].users = rooms[id].users.filter(
        u => u.id !== socket.id
      );
      delete rooms[id].votes[socket.id];

      // Clear scrum master if they disconnect
      if (rooms[id].scrumMasterId === socket.id) {
        rooms[id].scrumMasterId = null;
      }

      // Broadcast updated room state if someone left
      if (wasInRoom && rooms[id].users.length > 0) {
        io.to(id).emit("roomState", {
          roomId: id,
          roomName: rooms[id].roomName,
          users: rooms[id].users,
          votes: rooms[id].votes,
          revealed: rooms[id].revealed,
          scrumMasterId: rooms[id].scrumMasterId
        });
      }

      if (rooms[id].users.length === 0) {
        delete rooms[id];
      }
    }

    broadcastRooms();
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
