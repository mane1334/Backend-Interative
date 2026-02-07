import { useEffect, useRef } from 'react';

export default function useIntervalManager() {
  const intervalRef = useRef(null);

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = (callback, delay) => {
    // Always clear any existing interval before starting a new one
    stop();
    if (typeof delay === 'number' && delay > 0) {
      intervalRef.current = setInterval(callback, delay);
    }
  };

  useEffect(() => {
    // Ensure cleanup on unmount
    return () => stop();
  }, []);

  const isRunning = () => intervalRef.current != null;

  return { start, stop, isRunning };
}

