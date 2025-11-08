import React from 'react';

export const GeminiIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12.5 3.5A2.5 2.5 0 1 0 10 6l4 4-4 4a2.5 2.5 0 1 0 2.5 2.5" />
    <path d="M12.5 14.5A2.5 2.5 0 1 0 15 12l-4-4 4-4a2.5 2.5 0 1 0-2.5-2.5" />
  </svg>
);
