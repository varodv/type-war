import { createSharedComposable } from '@vueuse/core';
import { useNow } from '@vueuse/core';
import { computed } from 'vue';
import type { Emitted, Event, TimeEvent } from '../event/types';
import { useEvents } from '../event/use-events';
import { usePlayer } from '../player/use-player';

export const useGame = createSharedComposable(setup);

function setup() {
  const { emittedEventsSinceLastPlay, emit } = useEvents();
  const now = useNow();
  const { health, getDeathEvent } = usePlayer();

  const elapsedTime = computed(() => {
    const lastPlayEvent = emittedEventsSinceLastPlay.value[0];
    if (!lastPlayEvent) {
      return 0;
    }
    return getElapsedTimeSince(lastPlayEvent, getDeathEvent());
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
    return emit({ type: 'PLAY' })[0];
  }

  function pause() {
    if (health.value === 0) {
      throw new Error('The game is not in progress');
    }
    if (paused.value) {
      throw new Error('The game is already paused');
    }
    return emit({ type: 'PAUSE' })[0];
  }

  function resume() {
    if (health.value === 0) {
      throw new Error('The game is not in progress');
    }
    if (!paused.value) {
      throw new Error('The game is already resumed');
    }
    return emit({ type: 'RESUME' })[0];
  }

  function getElapsedTimeSince(
    targetEvent: Emitted<Event>,
    limitEvent?: Emitted<Event>,
  ) {
    const targetEventIndex = emittedEventsSinceLastPlay.value.findIndex(
      (ev) => ev.id === targetEvent.id,
    );
    if (targetEventIndex < 0) {
      throw new Error(
        "The passed target event hasn't been emitted since the last 'PLAY'",
      );
    }
    let limitEventIndex: number | undefined;
    if (limitEvent) {
      limitEventIndex = emittedEventsSinceLastPlay.value.findIndex(
        (ev) => ev.id === limitEvent.id,
      );
      if (limitEventIndex < 0) {
        throw new Error(
          "The passed limit event hasn't been emitted since the last 'PLAY'",
        );
      }
    }
    const limitTime = limitEvent?.timestamp.getTime() ?? now.value.getTime();
    let result = limitTime - targetEvent.timestamp.getTime();
    let lastPauseEvent: Emitted<TimeEvent> | undefined;
    emittedEventsSinceLastPlay.value
      .slice(targetEventIndex, limitEventIndex)
      .forEach((ev) => {
        if (ev.type === 'PAUSE') {
          lastPauseEvent = ev;
        } else if (lastPauseEvent && ev.type === 'RESUME') {
          result -= ev.timestamp.getTime() - lastPauseEvent.timestamp.getTime();
          lastPauseEvent = undefined;
        }
      });
    if (lastPauseEvent) {
      result -= limitTime - lastPauseEvent.timestamp.getTime();
    }
    return result;
  }

  return {
    elapsedTime,
    paused,
    play,
    pause,
    resume,
    getElapsedTimeSince,
  };
}
