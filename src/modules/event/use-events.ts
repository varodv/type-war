import { ref } from 'vue';
import type { Emitted, Event } from './types';
import { useEntity } from '../entity/use-entity';

const { create: createEntity } = useEntity();

const emittedEvents = ref<Array<Emitted<Event>>>([]);

function emit(...events: Array<Event>) {
  const timestamp = new Date();
  const newEvents = events.map<Emitted<Event>>((event) =>
    createEntity({
      ...event,
      timestamp,
    }),
  );
  emittedEvents.value.push(...newEvents);
  return newEvents;
}

export function useEvents() {
  return {
    emittedEvents,
    emit,
  };
}
