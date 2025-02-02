import type { Emitted, Event, TimeEvent } from '../event/types';
import { createSharedComposable, useNow } from '@vueuse/core';
import { computed, watch } from 'vue';
import { useEvents } from '../event/use-events';
import { useKeyboard } from '../keyboard/use-keyboard';
import { MAX_HEALTH } from '../player/player.consts';
import { PAUSE_KEY, PLAY_WORD } from './game.consts';

export const useGame = createSharedComposable(setup);

function setup() {
  const { emittedEventsSinceLastPlay, emit } = useEvents();
  const now = useNow();
  const { keystrokes, getKeystrokesMatching } = useKeyboard();

  const paused = computed(() => isPausedAt(now.value));

  const over = computed(() => {
    const enemyDamage = emittedEventsSinceLastPlay.value.reduce(
      (result, event) => {
        if (event.type === 'HIT' && 'source' in event.payload) {
          result += 1;
        }
        return result;
      },
      0,
    );
    return enemyDamage >= MAX_HEALTH;
  });

  const overEvent = computed(() =>
    over.value
      ? emittedEventsSinceLastPlay.value.findLast(
          event => event.type === 'HIT' && 'source' in event.payload,
        )
      : undefined,
  );

  const elapsedTime = computed(() => {
    if (!emittedEventsSinceLastPlay.value.length) {
      return 0;
    }
    return getElapsedTimeSince(emittedEventsSinceLastPlay.value[0], overEvent.value);
  });

  const keystrokesToPlay = computed(() =>
    getKeystrokesMatching(PLAY_WORD, keystroke =>
      !overEvent.value
        ? !emittedEventsSinceLastPlay.value.length
        || keystroke.timestamp <= emittedEventsSinceLastPlay.value[0].timestamp
        : keystroke.timestamp >= overEvent.value.timestamp),
  );

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
      event => event.id === targetEvent.id,
    );
    if (targetEventIndex < 0) {
      throw new Error(
        'The passed target event hasn\'t been emitted since the last \'PLAY\'',
      );
    }
    let limitEventIndex: number | undefined;
    if (limitEvent) {
      limitEventIndex = emittedEventsSinceLastPlay.value.findIndex(
        event => event.id === limitEvent.id,
      );
      if (limitEventIndex < 0) {
        throw new Error(
          'The passed limit event hasn\'t been emitted since the last \'PLAY\'',
        );
      }
    }
    const limitTime = limitEvent?.timestamp.getTime() ?? now.value.getTime();
    let result = limitTime - targetEvent.timestamp.getTime();
    let lastPauseEvent: Emitted<TimeEvent> | undefined;
    emittedEventsSinceLastPlay.value
      .slice(targetEventIndex, limitEventIndex)
      .forEach((event) => {
        if (event.type === 'PAUSE') {
          lastPauseEvent = event;
        }
        else if (lastPauseEvent && event.type === 'RESUME') {
          result
            -= event.timestamp.getTime() - lastPauseEvent.timestamp.getTime();
          lastPauseEvent = undefined;
        }
      });
    if (lastPauseEvent) {
      result -= limitTime - lastPauseEvent.timestamp.getTime();
    }
    return result;
  }

  function isPausedAt(timestamp: Date): boolean {
    const lastTimeEvent = emittedEventsSinceLastPlay.value.findLast(
      event =>
        event.timestamp.getTime() <= timestamp.getTime()
        && (event.type === 'PLAY'
          || event.type === 'PAUSE'
          || event.type === 'RESUME'),
    );
    return lastTimeEvent?.type === 'PAUSE';
  }

  watch(
    keystrokes,
    (value) => {
      if (!emittedEventsSinceLastPlay.value.length || over.value) {
        if (keystrokesToPlay.value.length === PLAY_WORD.length) {
          play();
        }
      }
      else if (value[value.length - 1]?.key === PAUSE_KEY) {
        if (!paused.value) {
          pause();
        }
        else {
          resume();
        }
      }
    },
    { deep: true },
  );

  return {
    paused,
    over,
    overEvent,
    elapsedTime,
    keystrokesToPlay,
    play,
    pause,
    resume,
    getElapsedTimeSince,
    isPausedAt,
  };
}
