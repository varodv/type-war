import type { Entity } from './types';

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

export function useEntity() {
  return {
    create,
  };
}
