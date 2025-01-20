"use client";
import { useState } from "react";

export default function Header() {
  // For now, let's just hard-code some money value
  const [money] = useState(100);

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "center", // Center the content horizontally
        padding: "0.5rem", // Half the original padding
        background: "black", // Black background
        color: "white", // White text for contrast
        borderBottom: "1px solid #ccc",
      }}
    >
      <div>
        {/* Removed "Player Money:" text, just display the integer + icon */}
        {money} 💰
      </div>
    </header>
  );
}
