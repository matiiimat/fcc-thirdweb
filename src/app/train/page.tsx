"use client";

import { useRouter } from "next/navigation";
import Header from "../components/Header"; // Import the Header
import Footer from "../components/Footer";

export default function TrainingPage() {
  const router = useRouter();

  return (
    <>
      {/* Pass the pageName prop to the Header */}
      <Header pageName="Train" />
      <div className="flex flex-col items-center justify-center min-h-screen">
        <button
          //onClick={handleTrain} HAVE THE TRAINING FUNCTION HERE => LOCKED UNTIL NEXT DAY => COUNT DAYS IN A ROW AND ADDS IT TO WORK ETHIC
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          TRAIN
        </button>
      </div>
      {/* <div className="flex flex-col items-center space-y-2">
        <div>
          <div>Strength: 0</div>
          <div>Stamina: 0</div>
          <div>Passing: 0</div>
          <div>Shooting: 0</div>
          <div>Defending: 0</div>
          <div>Speed: 0</div>
          <div>Positioning: 0</div>
        </div>
      </div> */}
      <Footer />
    </>
  );
}
