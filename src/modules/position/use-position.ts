import { createSharedComposable } from '@vueuse/core';
import type { Position } from './types';

export const usePosition = createSharedComposable(setup);

function setup() {
  function getRandomPosition(): Position {
    const x = Math.random() < 0.5 ? 0 : 100;
    const y = Math.random() * 100;
    return [x, y];
  }

  return {
    getRandomPosition,
  };
}
