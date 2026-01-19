import { io } from "socket.io-client";

export const socket = io("https://planning-poker-production-31f9.up.railway.app", {
  autoConnect: true
});
