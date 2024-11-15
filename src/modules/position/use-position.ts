import type { Position } from './types';

function getRandomPosition(): Position {
  const x = Math.random() < 0.5 ? 0 : 100;
  const y = Math.random() * 100;
  return [x, y];
}

export function usePosition() {
  return {
    getRandomPosition,
  };
}
