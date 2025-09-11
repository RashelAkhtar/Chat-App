import express from "express";
import { Server } from "socket.io"; // this create a WebSocket Live server
import { createServer } from "http"; // We use it to wrap Express so that both HTTP and WebSocket requests go through the same server.
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;
const FRONTEND_PORT = process.env.FRONTEND_PORT;

const app = express();
app.use(cors());

// Creates an HTTP server based on our Express app
const server = createServer(app);

// create a new Socket.IO server and bind it to our HTTP server
const io = new Server(server, {
  cors: {
    origin: FRONTEND_PORT, // which frontend are allowed
    methods: ["GET", "POST"], // which HTTP methods are allowed
  },
});

// Stores active users (id -> username)
const users = {};

//Fired when a new client connects to the server
//The callback gives us a socket object representing that specific client
io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  // Save username when client sets it
  socket.on("setUsername", (username) => {
    socket.username = username || "Anonymous";
    users[socket.id] = socket.username;
    console.log(`User ${socket.id} set username: ${socket.username}`);

    // Send updated user list to everyone
    io.emit("userList", users);
  });

  // When a client sends a message
  socket.on("chatMessage", (msg) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    io.emit("chatMessage", {
      id: socket.id,
      user: socket.username || "Anonymous",
      text: msg,
      time: timestamp,
    });
  });

  // Handle private messages
  socket.on("privateMessage", ({ to, text }) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send only to target user
    socket.to(to).emit("privateMessage", {
      from: socket.id,
      user: socket.username,
      text,
      time: timestamp,
    });

    // Also send back to sender (so they see their own message)
    socket.emit("privateMessage", {
      from: socket.id,
      user: socket.username,
      text,
      time: timestamp,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
    delete users[socket.id];
    io.emit("userList", users);
  });
});

server.listen(3000, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
