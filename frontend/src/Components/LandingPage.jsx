import React, { useState } from "react";
import "../styles/LandingPage.css";

const LandingPage = ({ onStart }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onStart({ name, email, role });
  };

  return (
    <div className="landing-container">
      {/* Left side illustration */}
      <div className="landing-left">
        <div className="illustration">
          <div className="bubble bubble1">💬</div>
          <div className="bubble bubble2">😊</div>
          <div className="bubble bubble3">🤝</div>
          <h2>Start meaningful conversations</h2>
        </div>
      </div>

      {/* Right side form */}
      <div className="landing-right">
        <form className="landing-form" onSubmit={handleSubmit}>
          <h2>Join Maitri</h2>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* 👇 Role selector */}
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="therapist">Therapist</option>
          </select>

          <button type="submit">Start Chatting</button>
        </form>

        <p className="landing-text">
          Maitri is your friendly AI companion where you can make friends, share
          your thoughts, or talk with a certified therapist. Our goal is to
          provide a safe, supportive, and engaging space for everyone.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
