import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());

const users = {}; // { socketId: { username, role } }
const pairs = {}; // { userId: therapistId }

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  socket.on("setUser", ({ username, role }) => {
    socket.username = username || "Anonymous";
    socket.role = role || "user";
    users[socket.id] = { username: socket.username, role: socket.role };

    // If user, auto-assign a therapist
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

    io.emit("userList", users);
  });

  // 🔹 Public chat (users only)
  socket.on("publicMessage", (text) => {
    if (socket.role !== "user") return; // therapists excluded

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

  // 🔹 Private chat (user ↔ therapist pair)
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
    io.emit("userList", users);
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
