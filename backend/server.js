import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const FRONTEND_URLS = (process.env.FRONTEND_URLS || "").split(",");

// Normalize function removes trailing slashes
const normalize = (url) => url?.replace(/\/$/, "");
const allowedOrigins = FRONTEND_URLS.map(normalize);

const app = express();

// --- Express CORS ---
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = normalize(origin);
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
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

// --- Socket.IO CORS ---
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = normalize(origin);
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --- Storage ---
const users = {}; // { socketId: { username, role } }
const pairs = {}; // { userId: therapistId }

function assignTherapist(userId) {
  const therapist = Object.entries(users).find(
    ([, u]) => u.role === "therapist"
  );
  if (therapist) {
    pairs[userId] = therapist[0];
    io.to(userId).emit("assignedPartner", {
      partnerId: therapist[0],
      partnerName: therapist[1].username,
    });
    io.to(therapist[0]).emit("assignedPartner", {
      partnerId: userId,
      partnerName: users[userId].username,
    });
  }
}

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("setUser", ({ username, role }) => {
    socket.username = username || "Anonymous";
    socket.role = role || "user";
    users[socket.id] = { username: socket.username, role: socket.role };

    // Assign therapist if user
    if (role === "user") {
      assignTherapist(socket.id);
    }

    io.emit("userList", users);
  });

  socket.on("privateMessage", ({ to, text }) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Security: only allow messaging between pairs
    const therapistId = pairs[socket.id];
    const userId = Object.keys(pairs).find((uid) => pairs[uid] === socket.id);

    let allowed = false;
    if (therapistId && therapistId === to) allowed = true; // user → therapist
    if (userId && userId === to) allowed = true; // therapist → user

    if (!allowed) return;

    // Send to target
    socket.to(to).emit("privateMessage", {
      from: socket.id,
      user: socket.username,
      text,
      time: timestamp,
    });

    // Echo back to sender
    socket.emit("privateMessage", {
      from: socket.id,
      user: socket.username,
      text,
      time: timestamp,
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    delete users[socket.id];

    // Remove pair
    if (pairs[socket.id]) {
      delete pairs[socket.id];
    } else {
      const userId = Object.keys(pairs).find((uid) => pairs[uid] === socket.id);
      if (userId) delete pairs[userId];
    }

    io.emit("userList", users);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
