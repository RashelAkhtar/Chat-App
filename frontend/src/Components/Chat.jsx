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

  const [partner, setPartner] = useState(null);

  const login = () => {
    if (!username) return;
    socket.emit("setUser", { username, role });
    setLoggedIn(true);
  };

  useEffect(() => {
    socket.on("publicMessage", (m) => setPublicMsgs((p) => [...p, m]));
    socket.on("privateMessage", (m) => setPrivateMsgs((p) => [...p, m]));
    socket.on("assignedPartner", ({ partnerId, partnerName }) => {
      setPartner({ id: partnerId, name: partnerName });
    });

    return () => {
      socket.off("publicMessage");
      socket.off("privateMessage");
      socket.off("assignedPartner");
    };
  }, []);

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
        </div>
        <div className="sidebar-user active" onClick={() => setPartner(null)}>
          🌐 Public Chat
        </div>
        {partner && (
          <div
            className="sidebar-user active"
            onClick={() => setPartner(partner)}
          >
            💬 {role === "user" ? "My Therapist" : partner.name}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          {partner ? `Private Chat with ${partner.name}` : "🌐 Public Chat"}
        </div>

        <div className="chat-messages">
          {!partner
            ? publicMsgs.map((m, i) => (
                <div
                  key={i}
                  className={`message ${
                    m.user === username ? "my-msg" : "other-msg"
                  }`}
                >
                  <div className="msg-user">{m.user}</div>
                  <div>{m.text}</div>
                  <div className="msg-time">{m.time}</div>
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
                  <div className="msg-time">{m.time}</div>
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
            onClick={partner ? sendPrivate : sendPublic}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
