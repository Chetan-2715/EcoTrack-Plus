
import React, { useRef, useEffect } from 'react';
import './text-pressure.css';

interface TextPressureProps {
  text: string;
}

const TextPressure: React.FC<TextPressureProps> = ({ text }) => {
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);



  return (
    <h1 className="text-pressure-heading">
      {text.split('').map((char, i) => (
        <span
          key={i}
          ref={el => (lettersRef.current[i] = el)}
          className="pressure-letter"
        >
          {char}
        </span>
      ))}
    </h1>
  );
};

export default TextPressure;
