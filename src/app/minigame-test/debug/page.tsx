"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function DebugPage() {
  const [ballLoaded, setBallLoaded] = useState(false);
  const [pitchLoaded, setPitchLoaded] = useState(false);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Debug Images</h1>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl mb-2">Ball Image:</h2>
            <div className="bg-gray-800 p-4 rounded-lg">
              <Image
                src="/images/ball.png"
                alt="Ball"
                width={60}
                height={60}
                onLoad={() => setBallLoaded(true)}
                onError={(e) => console.error("Ball load error:", e)}
                className="bg-white"
              />
              <p className="mt-2">
                Status: {ballLoaded ? "✅ Loaded" : "⏳ Loading..."}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl mb-2">Pitch Image:</h2>
            <div className="bg-gray-800 p-4 rounded-lg">
              <Image
                src="/images/pitch.png"
                alt="Pitch"
                width={600}
                height={400}
                onLoad={() => setPitchLoaded(true)}
                onError={(e) => console.error("Pitch load error:", e)}
              />
              <p className="mt-2">
                Status: {pitchLoaded ? "✅ Loaded" : "⏳ Loading..."}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl mb-2">Image Information:</h2>
            <pre className="text-sm">
              {`Ball Image: ${ballLoaded ? "Loaded" : "Not Loaded"}
Pitch Image: ${pitchLoaded ? "Loaded" : "Not Loaded"}
Images Path: /images/
Expected Files:
- /images/ball.png
- /images/pitch.png`}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
