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

const TEAMS = ["Discovery", "CCOE", "Dentsu"];

export default function LobbyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [team, setTeam] = useState(TEAMS[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rooms, setRooms] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [joinName, setJoinName] = useState("");

  useEffect(() => {
    console.log("Socket connected:", socket.connected);
    console.log("Socket ID:", socket.id);

    const handleActiveRooms = (activeRooms) => {
      console.log("Received active rooms:", activeRooms);
      setRooms(activeRooms);
    };

    const handleConnect = () => {
      console.log("Socket connected!");
    };

    socket.on("connect", handleConnect);
    socket.on("activeRooms", handleActiveRooms);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("activeRooms", handleActiveRooms);
    };
  }, []);

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const createRoom = () => {
    if (!name.trim()) return alert("Enter your name");
    localStorage.setItem("name", name);

    const roomName = `${team}-${formatDate(date)}`;
    socket.emit("createRoom", { name, roomName }, (roomId) => {
      router.push(`/room/${roomId}`);
    });
  };

  const openJoinModal = (roomId) => {
    setSelectedRoomId(roomId);
    setJoinName(name); // Pre-fill with current name if available
    setShowJoinModal(true);
  };

  const closeJoinModal = () => {
    setShowJoinModal(false);
    setSelectedRoomId(null);
    setJoinName("");
  };

  const joinRoom = () => {
    if (!joinName.trim()) return alert("Enter your name");
    localStorage.setItem("name", joinName);
    setName(joinName); // Update the main name field
    router.push(`/room/${selectedRoomId}`);
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

        <select
          value={team}
          onChange={e => setTeam(e.target.value)}
          style={input}
        >
          {TEAMS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={input}
        />

        <button onClick={createRoom} style={primaryButton}>
          Create New Room
        </button>
      </section>

      <section style={roomsPanel}>
        <h2 style={roomsTitle}>Active Rooms</h2>
        <p style={muted}>Rooms count: {rooms.length}</p>

        {rooms.length === 0 && (
          <p style={muted}>No active rooms</p>
        )}

        <div style={roomList}>
          {rooms.map(room => (
            <button
              key={room.id}
              style={roomCard}
              onClick={() => openJoinModal(room.id)}
            >
              <div>
                <strong>{room.roomName || `Room ${room.id}`}</strong>
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

      {/* Join Room Modal */}
      {showJoinModal && (
        <div style={modalOverlay} onClick={closeJoinModal}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 24, fontSize: 24 }}>Join Room</h2>
            <input
              placeholder="Enter your name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              style={input}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={joinRoom} style={primaryButton}>
                Join
              </button>
              <button onClick={closeJoinModal} style={secondaryButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  color: COLORS.text,
  cursor: "pointer",
  fontSize: 16
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
};

const modalContent = {
  background: COLORS.panel,
  padding: 32,
  borderRadius: 12,
  border: `1px solid ${COLORS.border}`,
  minWidth: 400,
  maxWidth: 500
};

const secondaryButton = {
  padding: "14px 18px",
  background: "transparent",
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer",
  width: "fit-content"
};
