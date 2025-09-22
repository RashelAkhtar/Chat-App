import React, { useState } from "react";
import LandingPage from "./Components/LandingPage";
import Chat from "./Components/Chat";

const App = () => {
  const [started, setStarted] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleStart = ({ name, email, role }) => {
    setUserData({ name, email, role });
    setStarted(true);
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
