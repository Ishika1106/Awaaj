'use client';
import React, { useMemo } from 'react';

const GRID_SIZE = 24;

export function BackgroundGrid() {
  const cells = useMemo(
    () =>
      Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
        id: i,
        row: Math.floor(i / GRID_SIZE),
        col: i % GRID_SIZE,
      })),
    []
  );

  return (
    <div
      className="absolute inset-0 z-10"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
      }}
    >
      {cells.map((cell) => (
        <div
          key={cell.id}
          className="border-[0.5px] border-white/10 transition-all hover:bg-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:border-white/30"
          style={{ transitionDuration: '1.5s' }}
        />
      ))}
    </div>
  );
}
