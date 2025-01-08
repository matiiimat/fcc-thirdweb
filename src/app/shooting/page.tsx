// pages/index.tsx
import React from "react";
import PenaltyMiniGame from "./PenaltyMiniGame";

const Home: React.FC = () => {
  return (
    <div>
      <h1>Welcome to the Shooting Training</h1>
      <PenaltyMiniGame />
    </div>
  );
};

export default Home;
