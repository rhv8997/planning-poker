"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";

const CARD_VALUES = ["0", "1", "2", "3", "5", "8", "13", "21", "?", "⏸"];


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
  const [sessionTotal, setSessionTotal] = useState(0);
  const [chosenCard, setChosenCard] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [inputName, setInputName] = useState("");
  const joinedRef = useRef(false);

  const [name, setName] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("name")
      : null
  );

  const isScrumMaster = room?.scrumMasterId === mySocketId;

  // Show name modal if no name exists
  useEffect(() => {
    if (typeof window !== "undefined" && !name) {
      setShowNameModal(true);
    }
  }, [name]);

  // Capture socket ID and join room
  useEffect(() => {
    // Set socket ID immediately if available
    if (socket.id) {
      setMySocketId(socket.id);
    }

    const handleConnect = () => {
      console.log("Socket connected with ID:", socket.id);
      setMySocketId(socket.id);

      // Join room after connection
      if (roomId && name && !joinedRef.current) {
        joinedRef.current = true;
        console.log("Joining room:", roomId, "as", name);
        socket.emit("joinRoom", { roomId, name }, (response) => {
          if (!response.success) {
            console.log("Failed to join room:", response.error);
            joinedRef.current = false; // Reset so they can try again
            // Clear the name and show modal again
            localStorage.removeItem("name");
            setName(null);
            setInputName("");
            alert(response.error === "Name already taken"
              ? "This name is already taken. Please choose a different name."
              : response.error);
          }
        });
      }
    };

    // If already connected, join immediately
    if (socket.connected && roomId && name && !joinedRef.current) {
      joinedRef.current = true;
      setMySocketId(socket.id);
      console.log("Already connected, joining room:", roomId, "as", name);
      socket.emit("joinRoom", { roomId, name }, (response) => {
        if (!response.success) {
          console.log("Failed to join room:", response.error);
          joinedRef.current = false; // Reset so they can try again
          // Clear the name and show modal again
          localStorage.removeItem("name");
          setName(null);
          setInputName("");
          alert(response.error === "Name already taken"
            ? "This name is already taken. Please choose a different name."
            : response.error);
        }
      });
    }

    socket.on("connect", handleConnect);
    return () => socket.off("connect", handleConnect);
  }, [roomId, name]);

  // Room updates
  useEffect(() => {
    console.log("Setting up roomState listener");
    const handler = (state) => {
      console.log("=== ROOM STATE RECEIVED ===");
      console.log("Room state:", state);
      console.log("My socket ID:", socket.id);
      console.log("Scrum master ID:", state.scrumMasterId);
      console.log("Am I scrum master?", socket.id === state.scrumMasterId);
      console.log("Setting room state...");
      setRoom(state);
      console.log("Room state set successfully");
      // Always update socket ID when we get room state
      if (socket.id) {
        setMySocketId(socket.id);
      }
    };
    socket.on("roomState", handler);
    console.log("roomState listener attached");
    return () => {
      console.log("Removing roomState listener");
      socket.off("roomState", handler);
    };
  }, []);

  // Handler for name submission (defined before early return)
  const handleNameSubmit = () => {
    if (!inputName.trim()) return alert("Enter your name");
    localStorage.setItem("name", inputName);
    setName(inputName);
    setShowNameModal(false);
  };

  if (!room) {
    return (
      <>
        <main style={{
          ...page,
          background: COLORS.bg,
          minHeight: "100vh"
        }}>
          <div>Loading room…</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 8 }}>
            Socket ID: {mySocketId || "connecting..."}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            Name: {name || "not set"}
          </div>
        </main>

        {/* Name Entry Modal */}
        {showNameModal && (
          <div style={modalOverlay} onClick={(e) => e.stopPropagation()}>
            <div style={modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: 24, fontSize: 24, color: COLORS.text }}>Enter Your Name</h2>
              <input
                placeholder="Your name"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: "#071425",
                  color: COLORS.text,
                  fontSize: 16,
                  width: "100%",
                  marginBottom: 24,
                  boxSizing: "border-box"
                }}
                autoFocus
              />
              <button onClick={handleNameSubmit} style={{
                padding: "14px 28px",
                background: COLORS.accent,
                color: COLORS.bg,
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                width: "100%"
              }}>
                Join Room
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const hasVoted = (id) => room.votes[id] !== undefined;

  // Calculate average
  const numericVotes = Object.values(room.votes)
    .filter(v => v !== "?" && v !== "—")
    .map(v => parseInt(v, 10))
    .filter(v => !isNaN(v));
  const average = numericVotes.length > 0
    ? (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length).toFixed(1)
    : "?";

  // Calculate session total (when votes are revealed)
  const handleRevealVotes = () => {
    socket.emit("revealVotes", roomId);
  };

  const handleChooseCard = (value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setChosenCard(value);
      setSessionTotal(prev => prev + numValue);
    }
  };

  const handleClearRound = () => {
    if (room.revealed && !chosenCard) {
      alert("Please choose a card before clearing the round");
      return;
    }
    setSelected(null);
    setChosenCard(null);
    socket.emit("resetVotes", roomId);
  };

  const handleClaimScrumMaster = () => {
    console.log("Claiming scrum master for room:", roomId);
    console.log("My socket ID:", mySocketId);
    console.log("Current scrum master:", room?.scrumMasterId);
    socket.emit("claimScrumMaster", roomId);
  };

  const handleRevokeScrumMaster = () => {
    console.log("Revoking scrum master for room:", roomId);
    socket.emit("revokeScrumMaster", roomId);
  };

  return (
    <div style={pageWrapper}>
      <main style={page}>
      <header style={header}>
        <h1>{room.roomName || `Room ${room.roomId}`}</h1>
        <span style={muted}>{room.users.length} players</span>
      </header>

      {/* PLAYER CARDS - CENTER */}
      <section style={playerCardsContainer}>
        <section style={players}>
          {room.users.map((u) => {
            const vote = room.votes[u.id];
            const isChosenCard = chosenCard === vote;

            return (
              <div key={u.id} style={player}>
                <div style={nameStyle}>{u.name}</div>

                {/* FLIP CARD */}
                <div
                  style={{
                    ...flipCard,
                    transform: room.revealed
                      ? "rotateY(180deg)"
                      : "rotateY(0deg)",
                    ...(isChosenCard && room.revealed ? { boxShadow: `0 0 20px ${COLORS.accent}` } : {})
                  }}
                  onClick={() => {
                    if (isScrumMaster && room.revealed && vote && vote !== "—") {
                      handleChooseCard(vote);
                    }
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
      </section>

      {/* VOTING CARDS - ALWAYS VISIBLE */}
      <section style={votingSection}>
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
                    ? "scale(1.25) translateY(-8px)"
                    : "scale(1)",
                fontSize: selected === value ? 36 : 28,
                opacity: room.revealed ? 0.5 : 1
              }}
              onClick={() => {
                if (!room.revealed) {
                  setSelected(value);
                  socket.emit("castVote", {
                    roomId,
                    value
                  });
                }
              }}
            >
              {value}
            </button>
          ))}
        </section>

      </section>

      {/* ACTIONS */}
      <footer style={footer}>
        {isScrumMaster && !room.revealed && (
          <button
            style={primaryButton}
            onClick={handleRevealVotes}
          >
            Reveal Votes
          </button>
        )}
        {isScrumMaster && room.revealed && !chosenCard && (
          <div style={warningMessage}>
            ⚠️ Please choose a card before clearing the round
          </div>
        )}
      </footer>
    </main>

    {/* STATS SIDEBAR */}
    <aside style={sidebar}>
      <div style={statsCard}>
        <div style={statsLabel}>Average</div>
        <div style={statsValue}>{room.revealed ? average : "?"}</div>
      </div>
      <div style={statsCard}>
        <div style={statsLabel}>Chosen Card</div>
        <div style={statsValue}>{chosenCard || "?"}</div>
      </div>
      <div style={statsCard}>
        <div style={statsLabel}>Session Total</div>
        <div style={statsValue}>{sessionTotal}</div>
      </div>
      <div style={statsCard}>
        <div style={statsLabel}>Votes In</div>
        <div style={statsValue}>{Object.keys(room.votes).length}</div>
      </div>
      <div style={statsCard}>
        <div style={statsLabel}>Players</div>
        <div style={statsValue}>{room.users.length}</div>
      </div>
      {isScrumMaster && (
        <button
          style={{
            ...secondaryButton,
            marginTop: 16,
            width: "100%",
            padding: "12px 8px",
            fontSize: 14
          }}
          onClick={handleClearRound}
        >
          Clear Round
        </button>
      )}
      {isScrumMaster && (
        <>
          <div style={{
            marginTop: 12,
            padding: 8,
            background: COLORS.accent,
            color: COLORS.bg,
            borderRadius: 8,
            textAlign: "center",
            fontWeight: 700,
            fontSize: 12
          }}>
            SCRUM MASTER
          </div>
          <button
            style={{
              ...secondaryButton,
              marginTop: 12,
              width: "100%",
              padding: "10px 8px",
              fontSize: 13,
              color: "#ff4444",
              borderColor: "#ff4444"
            }}
            onClick={handleRevokeScrumMaster}
          >
            Revoke Role
          </button>
        </>
      )}
      {!room.scrumMasterId && (
        <button
          style={{
            ...secondaryButton,
            marginTop: 16,
            width: "100%",
            padding: "12px 8px",
            fontSize: 14
          }}
          onClick={handleClaimScrumMaster}
        >
          Become Scrum Master
        </button>
      )}
      {room.scrumMasterId && !isScrumMaster && (
        <div style={{
          marginTop: 12,
          padding: 8,
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          textAlign: "center",
          fontSize: 12,
          color: COLORS.muted
        }}>
          Scrum Master: {room.users.find(u => u.id === room.scrumMasterId)?.name || "Unknown"}
        </div>
      )}
    </aside>

    {/* Name Entry Modal */}
    {showNameModal && (
      <div style={modalOverlay} onClick={(e) => e.stopPropagation()}>
        <div style={modalContent} onClick={(e) => e.stopPropagation()}>
          <h2 style={{ marginBottom: 24, fontSize: 24 }}>Enter Your Name</h2>
          <input
            placeholder="Your name"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            style={input}
            autoFocus
          />
          <button onClick={handleNameSubmit} style={primaryButton}>
            Join Room
          </button>
        </div>
      </div>
    )}
    </div>
  );
}

/* ================= STYLES ================= */

const pageWrapper = {
  display: "flex",
  minHeight: "100vh",
  background: COLORS.bg,
  gap: 20
};

const page = {
  flex: 1,
  color: COLORS.text,
  padding: 32,
  display: "flex",
  flexDirection: "column",
  gap: 32,
  alignItems: "center",
  overflow: "auto"
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  maxWidth: 1200
};

const playerCardsContainer = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  flex: 1
};

const players = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
  justifyContent: "center",
  alignItems: "flex-start"
};

const votingSection = {
  display: "flex",
  justifyContent: "center",
  width: "100%"
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
  width: 160,
  height: 230,
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
  fontSize: 56,
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
  width: "100%"
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

// Selected card styling is applied dynamically with transform and scale

const specialCardsSection = {
  display: "flex",
  gap: 12,
  marginTop: 16,
  justifyContent: "center",
  flexWrap: "wrap"
};

const specialCard = {
  width: 80,
  height: 120,
  fontSize: 28,
  fontWeight: 700,
  background: COLORS.panel,
  color: COLORS.text,
  borderRadius: 16,
  border: `2px solid ${COLORS.border}`,
  cursor: "pointer",
  transition: "all 0.15s ease",
  padding: 0
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

const warningMessage = {
  marginTop: 16,
  padding: "12px 16px",
  background: "#F59E0B20",
  border: "2px solid #F59E0B",
  borderRadius: 8,
  color: "#F59E0B",
  fontWeight: 600,
  fontSize: 14,
  textAlign: "center"
};

/* --- SIDEBAR --- */

const sidebar = {
  width: 200,
  background: COLORS.panel,
  padding: 20,
  borderLeft: `2px solid ${COLORS.border}`,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  paddingTop: 32
};

const statsCard = {
  textAlign: "center",
  padding: 16,
  background: COLORS.bg,
  borderRadius: 12,
  border: `2px solid ${COLORS.border}`
};

const statsLabel = {
  fontSize: 12,
  color: COLORS.muted,
  marginBottom: 8,
  textTransform: "uppercase",
  fontWeight: 600
};

const statsValue = {
  fontSize: 28,
  fontWeight: 700,
  color: COLORS.accent
};

/* --- MODAL --- */

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

const input = {
  padding: "12px 14px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: "#071425",
  color: COLORS.text,
  fontSize: 16,
  width: "100%",
  marginBottom: 24
};
