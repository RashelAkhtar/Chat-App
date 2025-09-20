import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "../styles/Chat.css";

const API = import.meta.env.VITE_API_URL;
const socket = io(`${API}`);

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [myId, setMyId] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [isSet, setIsSet] = useState(false);
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      setMyId(socket.id);
    });

    socket.on("assignedPartner", (data) => {
      setPartner(data);
    });

    socket.on("privateMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("connect");
      socket.off("assignedPartner");
      socket.off("privateMessage");
    };
  }, []);

  const sendMessage = () => {
    if (msg.trim() && partner) {
      socket.emit("privateMessage", { to: partner.partnerId, text: msg });

      // Add to local messages (already echoed back, but safer)
      const myMsg = {
        from: myId,
        user: username,
        text: msg,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, myMsg]);
      setMsg("");
    }
  };

  const setUser = () => {
    if (username.trim() && role) {
      socket.emit("setUser", { username, role });
      setIsSet(true);
    }
  };

  if (!isSet) {
    return (
      <div className="auth-container">
        <h2 className="auth-title">Join Chat</h2>
        <input
          className="auth-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name..."
        />
        <select
          className="auth-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Select Role</option>
          <option value="user">User</option>
          <option value="therapist">Therapist</option>
        </select>
        <button className="auth-button" onClick={setUser}>
          Join
        </button>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="waiting">
        <h3>⏳ Waiting for a therapist...</h3>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-main">
        <div className="chat-header">Chat with {partner.partnerName}</div>

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`message ${m.from === myId ? "my-msg" : "other-msg"}`}
            >
              <div className="msg-user">{m.user}</div>
              <div className="msg-text">{m.text}</div>
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
            placeholder="Type a message..."
          />
          <button className="chat-send" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
