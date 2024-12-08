import { createSharedComposable, useNow } from '@vueuse/core';
import { computed } from 'vue';
import type { Emitted, Event, TimeEvent } from '../event/types';
import { useEvents } from '../event/use-events';
import { MAX_HEALTH } from '../player/player.consts';

export const useGame = createSharedComposable(setup);

function setup() {
  const { emittedEventsSinceLastPlay, emit } = useEvents();
  const now = useNow();

  const paused = computed(() => {
    const lastTimeEvent = emittedEventsSinceLastPlay.value.findLast(
      (event) =>
        event.type === 'PLAY' ||
        event.type === 'PAUSE' ||
        event.type === 'RESUME',
    );
    return lastTimeEvent?.type === 'PAUSE';
  });

  const over = computed(() => {
    const enemyDamage = emittedEventsSinceLastPlay.value.reduce(
      (result, event) => {
        if (event.type === 'HIT' && 'source' in event.payload) {
          result += event.payload.source.word.length;
        }
        return result;
      },
      0,
    );
    return enemyDamage >= MAX_HEALTH;
  });

  const elapsedTime = computed(() => {
    const lastPlayEvent = emittedEventsSinceLastPlay.value[0];
    if (!lastPlayEvent) {
      return 0;
    }
    const overEvent = over.value
      ? emittedEventsSinceLastPlay.value[
          emittedEventsSinceLastPlay.value.length - 1
        ]
      : undefined;
    return getElapsedTimeSince(lastPlayEvent, overEvent);
  });

  function play() {
    return emit({ type: 'PLAY' })[0] as Emitted<TimeEvent>;
  }

  function pause() {
    if (!emittedEventsSinceLastPlay.value.length) {
      throw new Error('The game is not in progress');
    }
    if (over.value) {
      throw new Error('The game is over');
    }
    if (paused.value) {
      throw new Error('The game is already paused');
    }
    return emit({ type: 'PAUSE' })[0] as Emitted<TimeEvent>;
  }

  function resume() {
    if (!emittedEventsSinceLastPlay.value.length) {
      throw new Error('The game is not in progress');
    }
    if (over.value) {
      throw new Error('The game is over');
    }
    if (!paused.value) {
      throw new Error('The game is already resumed');
    }
    return emit({ type: 'RESUME' })[0] as Emitted<TimeEvent>;
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
    paused,
    over,
    elapsedTime,
    play,
    pause,
    resume,
    getElapsedTimeSince,
  };
}
