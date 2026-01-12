"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

const COLORS = {
  bg: "#050B16",
  panel: "#0B1C2D",
  border: "#1E3A5F",
  accent: "#7FFFD4",
  text: "#E6F1FF",
  muted: "#8AA4BF"
};

export default function LobbyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    socket.on("activeRooms", setRooms);
    return () => socket.off("activeRooms");
  }, []);

  const createRoom = () => {
    if (!name.trim()) return alert("Enter your name");
    localStorage.setItem("name", name);

    socket.emit("createRoom", name, (roomId) => {
      router.push(`/room/${roomId}`);
    });
  };

  const joinRoom = (roomId) => {
    if (!name.trim()) return alert("Enter your name first");
    localStorage.setItem("name", name);
    router.push(`/room/${roomId}`);
  };

  return (
    <main style={page}>
      <section style={hero}>
        <h1 style={title}>
          Planning <span style={{ color: COLORS.accent }}>Poker</span>
        </h1>
        <p style={subtitle}>Estimate together, reveal together.</p>

        <input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={input}
        />

        <button onClick={createRoom} style={primaryButton}>
          Create New Room
        </button>
      </section>

      <section style={roomsPanel}>
        <h2 style={roomsTitle}>Active Rooms</h2>

        {rooms.length === 0 && (
          <p style={muted}>No active rooms</p>
        )}

        <div style={roomList}>
          {rooms.map(room => (
            <button
              key={room.id}
              style={roomCard}
              onClick={() => joinRoom(room.id)}
            >
              <div>
                <strong>Room {room.id}</strong>
                <p style={muted}>
                  {room.players} players
                </p>
              </div>

              <span style={{
                color: room.revealed
                  ? COLORS.muted
                  : COLORS.accent
              }}>
                {room.revealed ? "Revealed" : "Voting"}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ---------- Styles ---------- */

const page = {
  minHeight: "100vh",
  background: COLORS.bg,
  color: COLORS.text,
  display: "grid",
  gridTemplateColumns: "1fr 1fr"
};

const hero = {
  padding: "80px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 20
};

const title = {
  fontSize: 56,
  fontWeight: 700
};

const subtitle = {
  fontSize: 18,
  color: COLORS.muted
};

const roomsPanel = {
  padding: "60px",
  background: COLORS.panel,
  borderLeft: `1px solid ${COLORS.border}`,
  overflowY: "auto"
};

const roomsTitle = {
  fontSize: 24,
  marginBottom: 24
};

const roomList = {
  display: "flex",
  flexDirection: "column",
  gap: 12
};

const roomCard = {
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer"
};

const input = {
  padding: "12px 14px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: "#071425",
  color: COLORS.text,
  fontSize: 16
};

const primaryButton = {
  padding: "14px 18px",
  background: COLORS.accent,
  color: COLORS.bg,
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer",
  width: "fit-content"
};

const muted = { color: COLORS.muted };
