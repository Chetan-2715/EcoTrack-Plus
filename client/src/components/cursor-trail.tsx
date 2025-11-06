import { useEffect, useRef } from 'react';

export function CursorTrail() {
  const lastPos = useRef({ x: 0, y: 0 });
  const lastEmojiPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      lastPos.current = { x: e.pageX, y: e.pageY };
    };

    window.addEventListener('mousemove', onMouseMove);

    const interval = setInterval(() => {
      if (lastPos.current.x !== lastEmojiPos.current.x || lastPos.current.y !== lastEmojiPos.current.y) {
        const trail = document.createElement('span');
        trail.className = 'cursor-trail';
        trail.innerHTML = '🌱';
        document.body.appendChild(trail);

        trail.style.left = `${lastPos.current.x}px`;
        trail.style.top = `${lastPos.current.y}px`;

        lastEmojiPos.current = { x: lastPos.current.x, y: lastPos.current.y };

        setTimeout(() => {
          trail.remove();
        }, 200);
      }
    }, 200);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      clearInterval(interval);
    };
  }, []);

  return null;
}
