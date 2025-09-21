import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "../styles/Chat.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const socket = io(API);

const Chat = ({ userData }) => {
  const [username, setUsername] = useState(userData?.name || "");
  const [role, setRole] = useState("user");
  const [loggedIn, setLoggedIn] = useState(false);

  const [publicMsgs, setPublicMsgs] = useState([]);
  const [privateMsgs, setPrivateMsgs] = useState([]);
  const [msg, setMsg] = useState("");
  const [activeChat, setActiveChat] = useState("public");
  const [partner, setPartner] = useState(null);

  // --- Auto-login with userData ---
  useEffect(() => {
    if (username) {
      socket.emit("setUser", { username, role });
      setLoggedIn(true);
      localStorage.setItem("chatUser", JSON.stringify({ username, role }));
    }
  }, [username, role]);

  // --- Load previous messages if needed ---
  useEffect(() => {
    const savedPublic = localStorage.getItem("publicMsgs");
    const savedPrivate = localStorage.getItem("privateMsgs");
    const savedPartner = localStorage.getItem("partner");

    if (savedPublic) setPublicMsgs(JSON.parse(savedPublic));
    if (savedPrivate) setPrivateMsgs(JSON.parse(savedPrivate));
    if (savedPartner) setPartner(JSON.parse(savedPartner));
  }, []);

  // --- Save data ---
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
      setPublicMsgs((prev) => [...prev, m].slice(-100))
    );

    socket.on("privateMessage", (m) =>
      setPrivateMsgs((prev) => [...prev, m].slice(-100))
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

  const logout = () => {
    localStorage.clear();
    setLoggedIn(false);
    setPublicMsgs([]);
    setPrivateMsgs([]);
    setPartner(null);
    window.location.reload(); // go back to landing page
  };

  // --- UI ---
  if (!loggedIn) return null; // no login UI needed anymore

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

      {/* Chat Main */}
      <div className="chat-main">
        <div className="chat-header">
          {activeChat === "private"
            ? `Private Chat with ${partner.name}`
            : "🌐 Public Chat"}
        </div>

        <div className="chat-messages">
          {(activeChat === "public" ? publicMsgs : privateMsgs).map((m, i) => (
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
            placeholder="Type a message..."
          />
          <button
            className="chat-send"
            onClick={() =>
              activeChat === "private"
                ? socket.emit("privateMessage", { to: partner.id, text: msg })
                : socket.emit("publicMessage", msg)
            }
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
