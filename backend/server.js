import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const FRONTEND_URLS = (process.env.FRONTEND_URLS || "").split(",");

const app = express();

// Allow multiple frontend URLs
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow local tools
      if (FRONTEND_URLS.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (FRONTEND_URLS.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// User storage
const users = {};

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("setUsername", (username) => {
    socket.username = username || "Anonymous";
    users[socket.id] = socket.username;
    io.emit("userList", users);
  });

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

  socket.on("privateMessage", ({ to, text }) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    socket.to(to).emit("privateMessage", {
      from: socket.id,
      user: socket.username,
      text,
      time: timestamp,
    });

    socket.emit("privateMessage", {
      from: socket.id,
      user: socket.username,
      text,
      time: timestamp,
    });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("userList", users);
  });
});

server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
