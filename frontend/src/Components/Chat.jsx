import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "../styles/Chat.css";

const socket = io("http://localhost:3000");

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
      <div className="login">
        <input
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">User</option>
          <option value="therapist">Therapist</option>
        </select>
        <button onClick={login}>Join</button>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <h2>Public Chat (Users Only)</h2>
      <div className="chat-box">
        {publicMsgs.map((m, i) => (
          <div key={i}>
            <b>{m.user}:</b> {m.text} <span>({m.time})</span>
          </div>
        ))}
      </div>
      {role === "user" && (
        <>
          <h2>Private Chat with Therapist</h2>
          <div className="chat-box">
            {privateMsgs.map((m, i) => (
              <div key={i}>
                <b>{m.user}:</b> {m.text} <span>({m.time})</span>
              </div>
            ))}
          </div>
        </>
      )}
      {role === "therapist" && partner && (
        <>
          <h2>Private Chat with {partner.name}</h2>
          <div className="chat-box">
            {privateMsgs.map((m, i) => (
              <div key={i}>
                <b>{m.user}:</b> {m.text} <span>({m.time})</span>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="input-box">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendPublic}>Send Public</button>
        {partner && <button onClick={sendPrivate}>Send Private</button>}
      </div>
    </div>
  );
};

export default Chat;
