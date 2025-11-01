import { useEffect, useState } from 'react';

export function GrassBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>

      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-50"
        style={{
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px) scale(1.1)`,
          transition: 'transform 0.3s ease-out',
          pointerEvents: 'none',
        }}
      >
        <source src="https://cdn.coverr.co/videos/coverr-grass-swaying-in-the-wind-6129/1080p.mp4" type="video/mp4" />
      </video>
    </>
  );
}
