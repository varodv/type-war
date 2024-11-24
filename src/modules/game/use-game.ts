import { createSharedComposable } from '@vueuse/core';
import { useNow } from '@vueuse/core';
import { computed } from 'vue';
import type { Emitted, TimeEvent } from '../event/types';
import { useEvents } from '../event/use-events';
import { usePlayer } from '../player/use-player';

export const useGame = createSharedComposable(setup);

function setup() {
  const { emittedEventsSinceLastPlay, emit } = useEvents();
  const now = useNow();
  const { health } = usePlayer();

  const elapsedTime = computed(() => {
    const lastPlayEvent = emittedEventsSinceLastPlay.value[0];
    if (!lastPlayEvent) {
      return 0;
    }
    let result = now.value.getTime() - lastPlayEvent.timestamp.getTime();
    let lastPauseEvent: Emitted<TimeEvent> | undefined;
    emittedEventsSinceLastPlay.value.forEach((event) => {
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
    const lastTimeEvent = emittedEventsSinceLastPlay.value.findLast(
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
    elapsedTime,
    paused,
    play,
    pause,
    resume,
  };
}
