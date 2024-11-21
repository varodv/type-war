import { createSharedComposable } from '@vueuse/core';
import type { Entity } from './types';

export const useEntity = createSharedComposable(setup);

function setup() {
  function create<Type extends Record<string, unknown>>(
    payload: Type,
  ): Entity<Type> {
    if ('id' in payload) {
      throw new Error("The given payload already has a property 'id'");
    }
    return {
      ...payload,
      id: crypto.randomUUID(),
    };
  }

  return {
    create,
  };
}
