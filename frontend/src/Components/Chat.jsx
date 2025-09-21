import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "../styles/Chat.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const socket = io(API);

const Chat = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [loggedIn, setLoggedIn] = useState(false);

  const [publicMsgs, setPublicMsgs] = useState([]);
  const [privateMsgs, setPrivateMsgs] = useState([]);
  const [msg, setMsg] = useState("");
  const [activeChat, setActiveChat] = useState("public");

  const [partner, setPartner] = useState(null);

  // --- Login ---
  const login = () => {
    if (!username.trim()) return;
    socket.emit("setUser", { username, role });
    setLoggedIn(true);

    // Save to localStorage
    localStorage.setItem("chatUser", JSON.stringify({ username, role }));
  };

  const logout = () => {
    localStorage.clear();
    setLoggedIn(false);
    setUsername("");
    setRole("user");
    setPublicMsgs([]);
    setPrivateMsgs([]);
    setPartner(null);
  };

  // --- Load saved data on first mount ---
  useEffect(() => {
    const savedUser = localStorage.getItem("chatUser");
    if (savedUser) {
      const { username, role } = JSON.parse(savedUser);
      setUsername(username);
      setRole(role);
      setLoggedIn(true);
      socket.emit("setUser", { username, role });
    }

    const savedPublic = localStorage.getItem("publicMsgs");
    const savedPrivate = localStorage.getItem("privateMsgs");
    const savedPartner = localStorage.getItem("partner");

    if (savedPublic) setPublicMsgs(JSON.parse(savedPublic));
    if (savedPrivate) setPrivateMsgs(JSON.parse(savedPrivate));
    if (savedPartner) setPartner(JSON.parse(savedPartner));
  }, []);

  // --- Save data when it changes ---
  useEffect(() => {
    localStorage.setItem("publicMsgs", JSON.stringify(publicMsgs));
  }, [publicMsgs]);

  useEffect(() => {
    localStorage.setItem("privateMsgs", JSON.stringify(privateMsgs));
  }, [privateMsgs]);

  useEffect(() => {
    if (partner) {
      localStorage.setItem("partner", JSON.stringify(partner));
    } else {
      localStorage.removeItem("partner");
    }
  }, [partner]);

  // --- Socket Listeners ---
  useEffect(() => {
    socket.on("publicMessage", (m) =>
      setPublicMsgs((prev) => {
        const updated = [...prev, m];
        return updated.slice(-100); // keep last 100
      })
    );

    socket.on("privateMessage", (m) =>
      setPrivateMsgs((prev) => {
        const updated = [...prev, m];
        return updated.slice(-100);
      })
    );

    socket.on("assignedPartner", ({ partnerId, partnerName }) => {
      setPartner({ id: partnerId, name: partnerName });
    });

    return () => {
      socket.off("publicMessage");
      socket.off("privateMessage");
      socket.off("assignedPartner");
    };
  }, []);

  // --- Send messages ---
  const sendPublic = () => {
    if (msg.trim()) {
      socket.emit("publicMessage", msg);
      setMsg("");
    }
  };

  const sendPrivate = () => {
    if (msg.trim() && partner) {
      socket.emit("privateMessage", { to: partner.id, text: msg });
      setMsg("");
    }
  };

  // --- UI ---
  if (!loggedIn) {
    return (
      <div className="auth-container">
        <h2 className="auth-title">Login</h2>
        <input
          className="auth-input"
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <select
          className="auth-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="user">User</option>
          <option value="therapist">Therapist</option>
        </select>
        <button className="auth-button" onClick={login}>
          Join Chat
        </button>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          {username} ({role})
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
        <div
          className={`sidebar-user ${activeChat === "public" ? "active" : ""}`}
          onClick={() => setActiveChat("public")}
        >
          🌐 Public Chat
        </div>

        {partner && (
          <div
            className={`sidebar-user ${
              activeChat === "private" ? "active" : ""
            }`}
            onClick={() => setActiveChat("private")}
          >
            💬 {role === "user" ? "My Therapist" : partner.name}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          {activeChat === "private"
            ? `Private Chat with ${partner.name}`
            : "🌐 Public Chat"}
        </div>

        <div className="chat-messages">
          {activeChat === "public"
            ? publicMsgs.map((m, i) => (
                <div
                  key={i}
                  className={`message ${
                    m.user === username ? "my-msg" : "other-msg"
                  }`}
                >
                  <div className="msg-user">{m.user}</div>
                  <div>{m.text}</div>
                  <div className="msg-time">
                    {new Date(m.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            : privateMsgs.map((m, i) => (
                <div
                  key={i}
                  className={`message ${
                    m.user === username ? "my-msg" : "other-msg"
                  }`}
                >
                  <div className="msg-user">{m.user}</div>
                  <div>{m.text}</div>
                  <div className="msg-time">
                    {new Date(m.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
        </div>

        {/* Input */}
        <div className="chat-input-box">
          <input
            className="chat-input"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder={
              partner ? "Type a private message..." : "Type a public message..."
            }
          />
          <button
            className="chat-send"
            onClick={activeChat === "private" ? sendPrivate : sendPublic}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
