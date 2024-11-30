import { createSharedComposable } from '@vueuse/core';
import { computed } from 'vue';
import type { Emitted, HitEvent } from '../event/types';
import { useEvents } from '../event/use-events';

export const usePlayer = createSharedComposable(setup);

function setup() {
  const { emittedEventsSinceLastPlay } = useEvents();

  const MAX_HEALTH = 25;

  const health = computed(() => {
    if (!emittedEventsSinceLastPlay.value.length) {
      return 0;
    }
    return emittedEventsSinceLastPlay.value.reduce((result, event) => {
      if (event.type === 'HIT' && 'source' in event.payload) {
        result -= event.payload.source.word.length;
      }
      return Math.max(result, 0);
    }, MAX_HEALTH);
  });

  function getDeathEvent() {
    if (!health.value) {
      return emittedEventsSinceLastPlay.value.findLast(
        (event) => event.type === 'HIT' && 'source' in event.payload,
      ) as Emitted<HitEvent>;
    }
  }

  return {
    MAX_HEALTH,
    health,
    getDeathEvent,
  };
}
