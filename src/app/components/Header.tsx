"use client";

interface HeaderProps {
  pageName: string;
}

export default function Header({ pageName }: HeaderProps) {
  return (
    <header className="relative h-16 bg-black text-white border-b border-gray-300">
      <h1 className="absolute top-2 left-2 font-bold text-[32px]">
        {pageName}
      </h1>
      <button
        className="absolute top-2 right-2 bg-transparent text-white text-xl"
        aria-label="Settings"
      >
        ⚙️
      </button>
    </header>
  );
}
