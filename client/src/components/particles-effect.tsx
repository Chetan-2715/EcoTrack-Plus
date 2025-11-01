import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  delay: number;
  duration: number;
}

export function ParticlesEffect({ count = 30 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        tx: (Math.random() - 0.5) * 200,
        ty: (Math.random() - 0.5) * 200,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 3,
      });
    }

    particles.forEach(particle => {
      const el = document.createElement('div');
      el.className = 'particle';
      el.style.left = `${particle.x}%`;
      el.style.top = `${particle.y}%`;
      el.style.setProperty('--tx', `${particle.tx}px`);
      el.style.setProperty('--ty', `${particle.ty}px`);
      el.style.animationDelay = `${particle.delay}s`;
      el.style.animationDuration = `${particle.duration}s`;
      containerRef.current?.appendChild(el);
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [count]);

  return <div ref={containerRef} className="particles-container" />;
}
