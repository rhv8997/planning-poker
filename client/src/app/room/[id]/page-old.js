"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { socket } from "@/lib/socket";

/* ---------- Animation Styles ---------- */
const animationStyles = `
  @keyframes flipCard {
    0% {
      transform: rotateY(0deg);
    }
    50% {
      transform: rotateY(90deg);
    }
    100% {
      transform: rotateY(0deg);
    }
  }

  .vote-card-flip {
    animation: flipCard 0.4s ease-in-out;
  }
`;

// Inject styles into the page
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = animationStyles;
  document.head.appendChild(style);
}

/* ---------- Styles ---------- */

const page = {
  minHeight: "100vh",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  padding: "var(--spacing-xl)",
  display: "flex",
  flexDirection: "column"
};

const title = {
  fontSize: "var(--font-size-2xl)",
  marginBottom: "var(--spacing-xl)",
  fontWeight: 700
};

const section = {
  marginBottom: "var(--spacing-2xl)"
};

const sectionTitle = {
  fontSize: "var(--font-size-lg)",
  fontWeight: 600,
  marginBottom: "var(--spacing-lg)",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "var(--spacing-md)",
  marginBottom: "var(--spacing-xl)"
};

const userCard = (revealed) => ({
  background: "var(--bg-secondary)",
  border: `1px solid var(--border)`,
  borderRadius: "var(--radius-lg)",
  padding: "var(--spacing-lg)",
  textAlign: "center",
  transition: "var(--transition-base)",
  opacity: revealed ? 1 : 0.8,
  cursor: "default",
  perspective: "1000px",
  transformStyle: "preserve-3d"
});

const userName = {
  color: "var(--text-secondary)",
  fontSize: "var(--font-size-sm)",
  marginBottom: "var(--spacing-md)",
  fontWeight: 500
};

const voteCard = {
  fontSize: "var(--font-size-3xl)",
  fontWeight: 700,
  color: "var(--accent)",
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const controls = {
  display: "flex",
  gap: "var(--spacing-md)",
  flexWrap: "wrap"
};

const baseButton = {
  padding: "var(--spacing-md) var(--spacing-lg)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  fontWeight: 600,
  fontSize: "var(--font-size-base)",
  cursor: "pointer",
  transition: "var(--transition-base)",
  minWidth: "60px"
};

const voteButton = (isSelected) => ({
  ...baseButton,
  background: isSelected ? "var(--accent)" : "var(--bg-secondary)",
  color: isSelected ? "var(--bg-primary)" : "var(--text-primary)",
  border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
  fontWeight: 700
});

const primaryButton = {
  ...baseButton,
  background: "var(--accent)",
  color: "var(--bg-primary)",
  border: "none",
  boxShadow: "var(--shadow-lg)"
};

const secondaryButton = {
  ...baseButton,
  background: "var(--bg-secondary)",
  color: "var(--text-primary)"
};

/* ---------- Component ---------- */

export default function RoomPage() {
  const { id: roomId } = useParams();
  const searchParams = useSearchParams();

  const [room, setRoom] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [previousRevealed, setPreviousRevealed] = useState(false);
  const [flipKeys, setFlipKeys] = useState(new Set());
  const [displayRoom, setDisplayRoom] = useState(null);

  const name = searchParams.get("name") ? decodeURIComponent(searchParams.get("name")) : localStorage.getItem("name");
  
  const userId =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`room-${roomId}`)
      : null;

  useEffect(() => {
    if (!name || !userId || !roomId) {
      console.log("Missing required data:", { name, userId, roomId });
      return;
    }

    console.log("=== Joining room ===");
    console.log("Name from URL:", searchParams.get("name"));
    console.log("Name final:", name);
    console.log("UserId from sessionStorage:", userId);
    console.log("RoomId:", roomId);

    socket.emit("joinRoom", {
      roomId,
      name,
      userId
    });

    const handleRoomUpdate = (updatedRoom) => {
      console.log("Room updated:", updatedRoom);
      
      // Trigger flip animation when votes are revealed
      if (!previousRevealed && updatedRoom.revealed) {
        setFlipKeys(new Set(updatedRoom.users.map(u => u.id)));
        // Keep the old display for the animation duration
        setTimeout(() => {
          setDisplayRoom(updatedRoom);
          setFlipKeys(new Set()); // Clear animation keys after animation
        }, 400);
      } else {
        setDisplayRoom(updatedRoom);
      }
      
      setPreviousRevealed(updatedRoom.revealed);
      setRoom(updatedRoom);
    };

    socket.on("roomUpdate", handleRoomUpdate);

    return () => {
      socket.off("roomUpdate", handleRoomUpdate);
    };
  }, []);

  const castVote = (value) => {
    setMyVote(value);
    socket.emit("vote", { roomId, userId, value });
  };

  const revealVotes = () => {
    socket.emit("revealVotes", roomId);
  };

  const resetVotes = () => {
    setMyVote(null);
    socket.emit("resetVotes", roomId);
  };

  const calculateAverage = () => {
    if (!room || !room.revealed) return null;
    
    const votes = room.users
      .map(user => room.votes[user.id])
      .filter(vote => vote && vote !== "?");
    
    if (votes.length === 0) return null;
    
    const numericVotes = votes.map(v => parseInt(v, 10)).filter(v => !isNaN(v));
    if (numericVotes.length === 0) return null;
    
    const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
    return average.toFixed(1);
  };

  if (!room) {
    return <div style={page}><p style={{ color: "var(--text-secondary)" }}>Loading room…</p></div>;
  }

  // Use displayRoom during animation, otherwise use room
  const renderRoom = displayRoom || room;

  return (
    <main style={page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-2xl)" }}>
        <h1 style={title}>Room {room.id}</h1>
        {room.revealed && calculateAverage() && (
          <div style={{
            background: "var(--bg-secondary)",
            border: "2px solid var(--accent)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-md) var(--spacing-lg)",
            textAlign: "center"
          }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-xs)" }}>
              Average
            </div>
            <div style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, color: "var(--accent)" }}>
              {calculateAverage()}
            </div>
          </div>
        )}
      </div>

      {/* USERS */}
      <section style={section}>
        <h2 style={sectionTitle}>Participants</h2>
        <div style={grid}>
          {renderRoom.users.map((user) => {
            const vote = renderRoom.votes[user.id];
            const isFlipping = flipKeys.has(user.id);

            return (
              <div 
                key={user.id} 
                style={userCard(room.revealed)}
                className={isFlipping ? 'vote-card-flip' : ''}
              >
                <div style={userName}>{user.name}</div>
                <div style={voteCard}>
                  {room.revealed
                    ? vote ?? "—"
                    : vote
                    ? "✓"
                    : "…"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VOTING CONTROLS */}
      <section style={section}>
        <h2 style={sectionTitle}>Your Vote</h2>
        <div style={controls}>
          {["1", "2", "3", "5", "8", "13", "?", "☕"].map((v) => (
            <button
              key={v}
              onClick={() => castVote(v)}
              style={voteButton(myVote === v)}
              title={v === "☕" ? "Take a break!" : ""}
            >
              {v}
            </button>
          ))}
        </div>
      </section>

      {/* HOST CONTROLS */}
      <section style={section}>
        <h2 style={sectionTitle}>Controls</h2>
        <div style={controls}>
          <button
            onClick={revealVotes}
            style={primaryButton}
          >
            Reveal Votes
          </button>

          <button
            onClick={resetVotes}
            style={secondaryButton}
          >
            Reset
          </button>
        </div>
      </section>
    </main>
  );
}
