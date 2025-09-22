import React, { useState, useEffect } from "react";
import LandingPage from "./Components/LandingPage";
import Chat from "./Components/Chat";

const App = () => {
  const [started, setStarted] = useState(false);
  const [userData, setUserData] = useState(null);

  // 🔹 Check localStorage on first load
  useEffect(() => {
    const savedUser = localStorage.getItem("chatUser");
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
      setStarted(true);
    }
  }, []);

  const handleStart = ({ name, email, role }) => {
    const user = { name, email, role };
    setUserData(user);
    setStarted(true);
    localStorage.setItem("chatUser", JSON.stringify(user)); // save for reload
  };

  return (
    <>
      {!started ? (
        <LandingPage onStart={handleStart} />
      ) : (
        <Chat userData={userData} />
      )}
    </>
  );
};

export default App;
