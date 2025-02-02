import type { Position } from './types';
import { createSharedComposable } from '@vueuse/core';

export const usePosition = createSharedComposable(setup);

function setup() {
  function getRandomPosition(): Position {
    const x = Math.random() < 0.5 ? -50 : 50;
    const y = Math.random() * 100 - 50;
    return [x, y];
  }

  return {
    getRandomPosition,
  };
}
