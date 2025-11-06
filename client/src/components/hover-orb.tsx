import { useState } from 'react';

export function HoverOrb() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-eco-primary/10 z-2 flex items-center justify-center transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        <span className="text-6xl">🌱</span>
      ) : null}
    </div>
  );
}
