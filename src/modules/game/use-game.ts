import { useNow } from '@vueuse/core';
import { computed } from 'vue';
import type { Emitted, TimeEvent } from '../event/types';
import { useEvents } from '../event/use-events';
import { usePlayer } from '../player/use-player';

const { emittedEvents, emit } = useEvents();
const now = useNow();
const { health } = usePlayer();

export function useGame() {
  const time = computed(() => {
    const lastPlayEvent = emittedEvents.value.findLast(
      (event) => event.type === 'PLAY',
    );
    if (!lastPlayEvent) {
      return 0;
    }
    let result = now.value.getTime() - lastPlayEvent.timestamp.getTime();
    let lastPauseEvent: Emitted<TimeEvent> | undefined;
    emittedEvents.value
      .slice(emittedEvents.value.indexOf(lastPlayEvent))
      .forEach((event) => {
        if (event.type === 'PAUSE') {
          lastPauseEvent = event;
        } else if (lastPauseEvent && event.type === 'RESUME') {
          result -=
            event.timestamp.getTime() - lastPauseEvent.timestamp.getTime();
          lastPauseEvent = undefined;
        }
      });
    if (lastPauseEvent) {
      result -= now.value.getTime() - lastPauseEvent.timestamp.getTime();
    }
    return result;
  });

  const paused = computed(() => {
    const lastTimeEvent = emittedEvents.value.findLast(
      (event) =>
        event.type === 'PLAY' ||
        event.type === 'PAUSE' ||
        event.type === 'RESUME',
    );
    return lastTimeEvent?.type === 'PAUSE';
  });

  function play() {
    return emit({ type: 'PLAY' });
  }

  function pause() {
    if (health.value === 0) {
      throw new Error('The game is not in progress');
    }
    if (paused.value) {
      throw new Error('The game is already paused');
    }
    return emit({ type: 'PAUSE' });
  }

  function resume() {
    if (health.value === 0) {
      throw new Error('The game is not in progress');
    }
    if (!paused.value) {
      throw new Error('The game is already resumed');
    }
    return emit({ type: 'RESUME' });
  }

  return {
    time,
    paused,
    play,
    pause,
    resume,
  };
}
