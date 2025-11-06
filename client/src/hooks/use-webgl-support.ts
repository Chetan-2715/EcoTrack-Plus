import { useEffect, useState } from 'react';

export function useWebGLSupport() {
  const [isSupported, setSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setSupported(false);
      }
    } catch (e) {
      setSupported(false);
    }
  }, []);

  return isSupported;
}
