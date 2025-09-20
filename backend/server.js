import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const FRONTEND_URLS = (process.env.FRONTEND_URLS || "").split(",");

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

const users = {}; // { socketId: { username, role } }
const pairs = {}; // { userId: therapistId }

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  socket.on("setUser", ({ username, role }) => {
    socket.username = username || "Anonymous";
    socket.role = role || "user";
    users[socket.id] = { username: socket.username, role: socket.role };

    if (role === "user") {
      const availableTherapist = Object.entries(users).find(
        ([, u]) => u.role === "therapist"
      );
      if (availableTherapist) {
        pairs[socket.id] = availableTherapist[0];
        io.to(socket.id).emit("assignedPartner", {
          partnerId: availableTherapist[0],
          partnerName: availableTherapist[1].username,
        });
        io.to(availableTherapist[0]).emit("assignedPartner", {
          partnerId: socket.id,
          partnerName: socket.username,
        });
      }
    }
  });

  // user-only public chat
  socket.on("publicMessage", (text) => {
    if (socket.role !== "user") return;
    const msg = {
      user: socket.username,
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    io.emit("publicMessage", msg);
  });

  // private chat (paired)
  socket.on("privateMessage", ({ to, text }) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const therapistId = pairs[socket.id];
    const userId = Object.keys(pairs).find((uid) => pairs[uid] === socket.id);

    let allowed = false;
    if (therapistId && therapistId === to) allowed = true;
    if (userId && userId === to) allowed = true;
    if (!allowed) return;

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
    console.log("❌ Disconnected:", socket.id);
    delete users[socket.id];
    delete pairs[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
