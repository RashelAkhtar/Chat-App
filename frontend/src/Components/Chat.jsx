import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "../styles/Chat.css";

const API = import.meta.env.VITE_API_URL;

const socket = io(`${API}`);

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [privateMsgs, setPrivateMsgs] = useState({});
  const [msg, setMsg] = useState("");
  const [myId, setMyId] = useState("");
  const [username, setUsername] = useState("");
  const [isSet, setIsSet] = useState(false);
  const [users, setUsers] = useState({});
  const [dmTarget, setDmTarget] = useState("public");

  useEffect(() => {
    socket.on("connect", () => {
      setMyId(socket.id);
    });

    socket.on("chatMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("userList", (data) => {
      setUsers(data);
    });

    socket.on("privateMessage", (data) => {
      setPrivateMsgs((prev) => {
        const updated = { ...prev };
        if (!updated[data.from]) updated[data.from] = [];
        updated[data.from] = [...updated[data.from], data];
        return updated;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("chatMessage");
      socket.off("userList");
      socket.off("privateMessage");
    };
  }, []);

  const sendMessage = () => {
    if (msg.trim()) {
      if (dmTarget !== "public") {
        const myMsg = {
          from: myId,
          user: username,
          text: msg,
          time: new Date().toLocaleTimeString(),
        };
        setPrivateMsgs((prev) => {
          const updated = { ...prev };
          if (!updated[dmTarget]) updated[dmTarget] = [];
          updated[dmTarget] = [...updated[dmTarget], myMsg];
          return updated;
        });
        socket.emit("privateMessage", { to: dmTarget, text: msg });
      } else {
        socket.emit("chatMessage", msg);
      }
      setMsg("");
    }
  };

  const setUser = () => {
    if (username.trim()) {
      socket.emit("setUsername", username);
      setIsSet(true);
    }
  };

  if (!isSet) {
    return (
      <div className="auth-container">
        <h2 className="auth-title">Enter Username</h2>
        <input
          className="auth-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name..."
        />
        <button className="auth-button" onClick={setUser}>
          Join Chat
        </button>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      {/* Sidebar */}
      <div className="sidebar">
        <h3 className="sidebar-title">Chats</h3>

        {/* Public Chat Option */}
        <div
          className={`sidebar-user ${dmTarget === "public" ? "active" : ""}`}
          onClick={() => setDmTarget("public")}
        >
          🌐 Public Chat
        </div>

        {/* Online Users */}
        <h4 className="sidebar-subtitle">Users</h4>
        {Object.entries(users).map(([id, name]) => (
          <div
            key={id}
            className={`sidebar-user ${dmTarget === id ? "active" : ""}`}
            onClick={() => setDmTarget(id === myId ? "public" : id)}
          >
            {name} {id === myId && "(You)"}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          {dmTarget === "public"
            ? "🌐 Public Chat"
            : `Private Chat with ${users[dmTarget]}`}
        </div>

        <div className="chat-messages">
          {dmTarget === "public"
            ? messages.map((m, i) => (
                <div
                  key={i}
                  className={`message ${
                    m.id === myId ? "my-msg" : "other-msg"
                  }`}
                >
                  <div className="msg-user">{m.user}</div>
                  <div className="msg-text">{m.text}</div>
                  <div className="msg-time">{m.time}</div>
                </div>
              ))
            : (privateMsgs[dmTarget] || []).map((m, i) => (
                <div
                  key={i}
                  className={`message ${
                    m.from === myId ? "my-msg" : "other-msg"
                  }`}
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
            placeholder={
              dmTarget === "public"
                ? "Type a public message..."
                : "Send private message..."
            }
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
