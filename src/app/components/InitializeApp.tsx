"use client";

import { useEffect } from "react";

export default function InitializeApp() {
  useEffect(() => {
    // Call the init route to create database indexes
    fetch("/api/init")
      .then((response) => response.json())
      .catch((error) => console.error("Error initializing app:", error));
  }, []);

  return null;
}
