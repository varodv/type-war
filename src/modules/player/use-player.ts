import { computed } from 'vue';
import { useEvents } from '../event/use-events';

const { emittedEvents } = useEvents();

const MAX_HEALTH = 25;

export function usePlayer() {
  const health = computed(() => {
    const lastPlayEventIndex = emittedEvents.value.findLastIndex(
      (event) => event.type === 'PLAY',
    );
    return emittedEvents.value.reduce((result, event, index) => {
      if (
        index > lastPlayEventIndex &&
        event.type === 'HIT' &&
        'source' in event.payload
      ) {
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
