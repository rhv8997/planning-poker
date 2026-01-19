"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";

const CARD_VALUES = ["0", "1", "2", "3", "5", "8", "13", "21", "?"];

export async function generateStaticParams() {
  return [];
}

export const dynamic = 'force-dynamic';

const COLORS = {
  bg: "#050B16",
  panel: "#0B1C2D",
  border: "#1E3A5F",
  accent: "#7FFFD4",
  text: "#E6F1FF",
  muted: "#8AA4BF",
  cardBack: "#071425"
};

export default function RoomPage() {
  const { id: roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [selected, setSelected] = useState(null);
  const joinedRef = useRef(false);

  const name =
    typeof window !== "undefined"
      ? localStorage.getItem("name")
      : null;

  // Join once
  useEffect(() => {
    if (!roomId || !name || joinedRef.current) return;
    joinedRef.current = true;
    socket.emit("joinRoom", { roomId, name });
  }, [roomId, name]);

  // Room updates
  useEffect(() => {
    const handler = (state) => setRoom(state);
    socket.on("roomState", handler);
    return () => socket.off("roomState", handler);
  }, []);

  if (!room) {
    return <main style={page}>Loading room…</main>;
  }

  const hasVoted = (id) => room.votes[id] !== undefined;

  return (
    <main style={page}>
      <header style={header}>
        <h1>Room {room.roomId}</h1>
        <span style={muted}>{room.users.length} players</span>
      </header>

      {/* PLAYER CARDS */}
      <section style={players}>
        {room.users.map((u) => {
          const vote = room.votes[u.id];

          return (
            <div key={u.id} style={player}>
              <div style={nameStyle}>{u.name}</div>

              {/* FLIP CARD */}
              <div
                style={{
                  ...flipCard,
                  transform: room.revealed
                    ? "rotateY(180deg)"
                    : "rotateY(0deg)"
                }}
              >
                {/* BACK */}
                <div style={{ ...cardFace, ...cardBack }}>
                  {hasVoted(u.id) ? "✓" : "—"}
                </div>

                {/* FRONT */}
                <div style={{ ...cardFace, ...cardFront }}>
                  {vote ?? "—"}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* VOTING */}
      {!room.revealed && (
        <section style={cards}>
          {CARD_VALUES.map((value) => (
            <button
              key={value}
              style={{
                ...voteCard,
                borderColor:
                  selected === value
                    ? COLORS.accent
                    : COLORS.border,
                transform:
                  selected === value
                    ? "translateY(-6px)"
                    : "none"
              }}
              onClick={() => {
                setSelected(value);
                socket.emit("castVote", {
                  roomId,
                  value
                });
              }}
            >
              {value}
            </button>
          ))}
        </section>
      )}

      {/* ACTIONS */}
      <footer style={footer}>
        {!room.revealed ? (
          <button
            style={primaryButton}
            onClick={() => socket.emit("revealVotes", roomId)}
          >
            Reveal Votes
          </button>
        ) : (
          <button
            style={secondaryButton}
            onClick={() => {
              setSelected(null);
              socket.emit("resetVotes", roomId);
            }}
          >
            Reset Round
          </button>
        )}
      </footer>
    </main>
  );
}

/* ================= STYLES ================= */

const page = {
  minHeight: "100vh",
  background: COLORS.bg,
  color: COLORS.text,
  padding: 32,
  display: "flex",
  flexDirection: "column",
  gap: 32
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const players = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap"
};

const player = {
  textAlign: "center"
};

const nameStyle = {
  marginBottom: 8,
  fontWeight: 600
};

/* --- FLIP CARD --- */

const flipCard = {
  width: 90,
  height: 130,
  position: "relative",
  transformStyle: "preserve-3d",
  transition: "transform 0.6s cubic-bezier(.4,.2,.2,1)"
};

const cardFace = {
  position: "absolute",
  width: "100%",
  height: "100%",
  borderRadius: 14,
  backfaceVisibility: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 32,
  fontWeight: 700,
  border: `2px solid ${COLORS.border}`
};

const cardBack = {
  background: COLORS.cardBack,
  color: COLORS.muted
};

const cardFront = {
  background: COLORS.panel,
  color: COLORS.accent,
  transform: "rotateY(180deg)"
};

/* --- VOTING CARDS --- */

const cards = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
  gap: 16,
  maxWidth: 600,
  margin: "0 auto"
};

const voteCard = {
  height: 120,
  fontSize: 28,
  fontWeight: 700,
  background: COLORS.panel,
  color: COLORS.text,
  borderRadius: 16,
  border: `2px solid ${COLORS.border}`,
  cursor: "pointer",
  transition: "all 0.15s ease"
};

/* --- ACTIONS --- */

const footer = {
  textAlign: "center"
};

const primaryButton = {
  padding: "14px 28px",
  background: COLORS.accent,
  color: COLORS.bg,
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer"
};

const secondaryButton = {
  padding: "14px 28px",
  background: "transparent",
  color: COLORS.accent,
  border: `2px solid ${COLORS.accent}`,
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer"
};

const muted = { color: COLORS.muted };
