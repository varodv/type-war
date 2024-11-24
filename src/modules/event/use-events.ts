import { createSharedComposable } from '@vueuse/core';
import { ref, computed } from 'vue';
import type { Emitted, Event } from './types';
import { useEntity } from '../entity/use-entity';

export const useEvents = createSharedComposable(setup);

function setup() {
  const { create } = useEntity();

  const emittedEvents = ref<Array<Emitted<Event>>>([]);

  const emittedEventsSinceLastPlay = computed(() => {
    const lastPlayEventIndex = emittedEvents.value.findLastIndex(
      (event) => event.type === 'PLAY',
    );
    if (lastPlayEventIndex < 0) {
      return [];
    }
    return emittedEvents.value.slice(lastPlayEventIndex);
  });

  function emit(...events: Array<Event>) {
    const timestamp = new Date();
    const newEvents = events.map<Emitted<Event>>((event) =>
      create({
        ...event,
        timestamp,
      }),
    );
    emittedEvents.value.push(...newEvents);
    return newEvents;
  }

  return {
    emittedEvents,
    emittedEventsSinceLastPlay,
    emit,
  };
}
