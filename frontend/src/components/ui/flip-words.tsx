'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export function FlipWords({ words }: { words: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const indexRef = useRef(0);

  const flip = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      indexRef.current = (indexRef.current + 1) % words.length;
      setCurrentIndex(indexRef.current);
      setIsAnimating(false);
    }, 600);
  }, [words.length]);

  useEffect(() => {
    const interval = setInterval(flip, 3500);
    return () => clearInterval(interval);
  }, [flip]);

  return (
    <span
      className={`inline-block transition-all duration-500 ${
        isAnimating
          ? 'opacity-0 translate-y-2 scale-95'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      {words[currentIndex]}
    </span>
  );
}
