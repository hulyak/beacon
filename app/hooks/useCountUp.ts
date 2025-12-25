'use client';

import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  decimals?: number;
  startOnMount?: boolean;
}

export function useCountUp(
  end: number,
  options: UseCountUpOptions = {}
): { value: number; start: () => void; isComplete: boolean } {
  const { duration = 2000, decimals = 0, startOnMount = false } = options;
  const [value, setValue] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  const animate = (timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

    // Easing function for smooth animation (ease-out-cubic)
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);

    const currentValue = easeOutCubic * end;
    setValue(Number(currentValue.toFixed(decimals)));

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setValue(end);
      setIsComplete(true);
    }
  };

  const start = () => {
    // Reset state
    startTimeRef.current = null;
    setIsComplete(false);
    setValue(0);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (startOnMount) {
      start();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration, startOnMount]);

  return { value, start, isComplete };
}

// Hook that starts counting when element is in view
export function useCountUpOnView(
  end: number,
  options: UseCountUpOptions = {}
): { value: number; ref: React.RefObject<HTMLDivElement | null>; isComplete: boolean } {
  const { duration = 2000, decimals = 0 } = options;
  const [value, setValue] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  const animate = (timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = easeOutCubic * end;
    setValue(Number(currentValue.toFixed(decimals)));

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setValue(end);
      setIsComplete(true);
    }
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
            animationRef.current = requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration, hasStarted]);

  return { value, ref, isComplete };
}

export default useCountUp;
