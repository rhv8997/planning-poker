import { io } from "socket.io-client";

const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://planning-poker-production-31f9.up.railway.app";

export const socket = io(SERVER_URL, {
  autoConnect: true
});
