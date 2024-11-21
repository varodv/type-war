import { createSharedComposable } from '@vueuse/core';
import { computed } from 'vue';
import { useEvents } from '../event/use-events';

export const usePlayer = createSharedComposable(setup);

function setup() {
  const { emittedEvents } = useEvents();

  const MAX_HEALTH = 25;

  const health = computed(() => {
    const lastPlayEventIndex = emittedEvents.value.findLastIndex(
      (event) => event.type === 'PLAY',
    );
    if (lastPlayEventIndex < 0) {
      return 0;
    }
    return emittedEvents.value
      .slice(lastPlayEventIndex + 1)
      .reduce((result, event) => {
        if (event.type === 'HIT' && 'source' in event.payload) {
          result -= event.payload.source.word.length;
        }
        return Math.max(result, 0);
      }, MAX_HEALTH);
  });

  return {
    MAX_HEALTH,
    health,
  };
}
