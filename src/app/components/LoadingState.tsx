import Header from "./Header";
import Footer from "./Footer";

interface LoadingStateProps {
  pageName: string;
}

export default function LoadingState({ pageName }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName={pageName} xp={0} />
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <p className="mt-2 text-green-400">Loading...</p>
      </div>
      <Footer />
    </div>
  );
}
