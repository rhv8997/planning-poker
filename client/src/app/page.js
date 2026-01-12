"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

const CARDS = ["0", "1", "2", "3", "5", "8", "13", "21", "?"];

export default function Home() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState(null);

  useEffect(() => {
    socket.on("roomUpdated", setRoom);
    return () => socket.off("roomUpdated");
  }, []);

  const createRoom = () => {
    if (!name) return alert("Enter your name");

    socket.emit("createRoom", { name }, (id) => {
      setRoomId(id);
    });
  };

  const joinRoom = () => {
    if (!name || !roomId) return alert("Missing fields");
    socket.emit("joinRoom", { roomId, name });
  };

  const vote = (card) => {
    socket.emit("vote", { roomId, card });
  };

  if (!room) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Planning Poker</h1>

        <input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <div style={{ marginTop: 10 }}>
          <button onClick={createRoom}>Create Room</button>
        </div>

        <div style={{ marginTop: 20 }}>
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={e => setRoomId(e.target.value.toUpperCase())}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h2>Room {room.roomId}</h2>

      <h3>Players</h3>
      {room.users.map(u => (
        <div key={u.id}>
          {u.name}:{" "}
          {room.revealed
            ? u.vote ?? "-"
            : u.vote
            ? "✓"
            : "-"}
        </div>
      ))}

      <h3 style={{ marginTop: 20 }}>Choose a card</h3>
      {CARDS.map(card => (
        <button
          key={card}
          disabled={room.revealed}
          onClick={() => vote(card)}
          style={{ marginRight: 5 }}
        >
          {card}
        </button>
      ))}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => socket.emit("revealVotes", roomId)}>
          Reveal
        </button>

        <button
          style={{ marginLeft: 10 }}
          onClick={() => socket.emit("resetVotes", roomId)}
        >
          Reset
        </button>
      </div>
    </main>
  );
}
