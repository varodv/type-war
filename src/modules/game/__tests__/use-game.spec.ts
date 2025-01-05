import { computed, nextTick, ref } from 'vue';
import { mockCrypto, stroke } from '../../../__tests__/tests.utils';
import type { Emitted, HitEvent, TimeEvent } from '../../event/types';
import { useEvents } from '../../event/use-events';
import { useKeyboard } from '../../keyboard/use-keyboard';
import { MAX_HEALTH } from '../../player/player.consts';
import { useGame } from '../use-game';

const now = ref(new Date());

describe('useGame', () => {
  const {
    paused,
    over,
    overEvent,
    elapsedTime,
    keystrokesToPlay,
    play,
    pause,
    resume,
    getElapsedTimeSince,
  } = useGame();
  const { emittedEvents, emit } = useEvents();
  const { keystrokes } = useKeyboard();

  function setTime(milliseconds: number): void {
    now.value = new Date(milliseconds);
    vi.setSystemTime(now.value);
  }

  function advanceTime(milliseconds: number): void {
    setTime(now.value.getTime() + milliseconds);
  }

  beforeEach(() => {
    emittedEvents.value = [];
    keystrokes.value = [];

    mockCrypto();

    vi.mock('@vueuse/core', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...(actual as object),
        useNow: () => computed(() => now.value),
      };
    });
    setTime(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('paused', () => {
    it('returns the proper pause status on every scenario', () => {
      expect(paused.value).toBeFalsy();
      play();
      expect(paused.value).toBeFalsy();
      pause();
      expect(paused.value).toBeTruthy();
      resume();
      expect(paused.value).toBeFalsy();
      pause();
      expect(paused.value).toBeTruthy();
      play();
      expect(paused.value).toBeFalsy();
    });
  });

  describe('over', () => {
    it('returns the proper over status on every scenario', () => {
      expect(over.value).toBeFalsy();
      expect(overEvent.value).toBeUndefined();
      play();
      expect(over.value).toBeFalsy();
      expect(overEvent.value).toBeUndefined();
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-1',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      expect(over.value).toBeFalsy();
      expect(overEvent.value).toBeUndefined();
      const lastHitEvent: HitEvent = {
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-2',
            word: '-'.repeat(MAX_HEALTH - 10),
            speed: 10,
          },
        },
      };
      emit(lastHitEvent);
      expect(over.value).toBeTruthy();
      expect(overEvent.value).toEqual({
        ...lastHitEvent,
        id: 'u-u-i-d-3',
        timestamp: new Date(0),
      });
      play();
      expect(over.value).toBeFalsy();
      expect(overEvent.value).toBeUndefined();
    });
  });

  describe('elapsedTime', () => {
    it('returns the last game elapsed time excluding all the pauses', () => {
      expect(elapsedTime.value).toEqual(0);
      play();
      const interval = 5000;
      advanceTime(interval);
      expect(elapsedTime.value).toEqual(interval);
      pause();
      advanceTime(interval);
      expect(elapsedTime.value).toEqual(interval);
      resume();
      advanceTime(interval);
      expect(elapsedTime.value).toEqual(interval * 2);
      play();
      expect(elapsedTime.value).toEqual(0);
    });

    it("stops at the last enemy 'HIT' if player dies", () => {
      expect(elapsedTime.value).toEqual(0);
      play();
      const interval = 5000;
      advanceTime(interval);
      expect(elapsedTime.value).toEqual(interval);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-1',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      advanceTime(interval);
      expect(elapsedTime.value).toEqual(interval * 2);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-2',
            word: '-'.repeat(MAX_HEALTH - 10),
            speed: 10,
          },
        },
      });
      advanceTime(interval);
      expect(elapsedTime.value).toEqual(interval * 2);
    });
  });

  describe('keystrokesToPlay', () => {
    it("returns the keystrokes matching the play word during all the game's lifecycle", async () => {
      const timestamp = new Date(0),
        interval = 1;
      expect(keystrokesToPlay.value).toEqual([]);
      stroke('w', 'a');
      expect(keystrokesToPlay.value).toEqual([
        {
          key: 'w',
          timestamp,
        },
        {
          key: 'a',
          timestamp,
        },
      ]);
      stroke('t');
      expect(keystrokesToPlay.value).toEqual([]);
      stroke('w', 'a', 'r');
      expect(keystrokesToPlay.value).toEqual([
        {
          key: 'w',
          timestamp,
        },
        {
          key: 'a',
          timestamp,
        },
        {
          key: 'r',
          timestamp,
        },
      ]);

      await nextTick();
      expect(keystrokesToPlay.value).toEqual([
        {
          key: 'w',
          timestamp,
        },
        {
          key: 'a',
          timestamp,
        },
        {
          key: 'r',
          timestamp,
        },
      ]);
      advanceTime(interval);
      stroke('t');
      expect(keystrokesToPlay.value).toEqual([
        {
          key: 'w',
          timestamp,
        },
        {
          key: 'a',
          timestamp,
        },
        {
          key: 'r',
          timestamp,
        },
      ]);

      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy',
            word: '-'.repeat(MAX_HEALTH),
            speed: 10,
          },
        },
      });
      expect(keystrokesToPlay.value).toEqual([]);
      stroke('w');
      expect(keystrokesToPlay.value).toEqual([
        {
          key: 'w',
          timestamp: new Date(timestamp.getTime() + interval),
        },
      ]);
    });
  });

  describe('play', () => {
    it("emits and returns a 'PLAY' event", () => {
      expect(play()).toEqual(emittedEvents.value[0]);
    });
  });

  describe('pause', () => {
    it("emits and returns a 'PAUSE' event if the game is in progress", () => {
      play();
      expect(pause()).toEqual(emittedEvents.value[1]);
    });

    it('throws an error if the game is not in progress', () => {
      expect(() => pause()).toThrowError('The game is not in progress');
    });

    it('throws an error if the game is over', () => {
      play();
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-1',
            word: '-'.repeat(MAX_HEALTH),
            speed: 10,
          },
        },
      });
      expect(() => pause()).toThrowError('The game is over');
    });

    it('throws an error if the game is already paused', () => {
      play();
      expect(pause()).toEqual(emittedEvents.value[1]);
      expect(() => pause()).toThrowError('The game is already paused');
    });
  });

  describe('resume', () => {
    it("emits and returns a 'RESUME' event if the game is paused", () => {
      play();
      pause();
      expect(resume()).toEqual(emittedEvents.value[2]);
    });

    it('throws an error if the game is not in progress', () => {
      expect(() => resume()).toThrowError('The game is not in progress');
    });

    it('throws an error if the game is over', () => {
      play();
      pause();
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-1',
            word: '-'.repeat(MAX_HEALTH),
            speed: 10,
          },
        },
      });
      expect(() => resume()).toThrowError('The game is over');
    });

    it('throws an error if the game is already resumed', () => {
      play();
      expect(() => resume()).toThrowError('The game is already resumed');
      pause();
      expect(resume()).toEqual(emittedEvents.value[2]);
      expect(() => resume()).toThrowError('The game is already resumed');
    });
  });

  describe('getElapsedTimeSince', () => {
    it('returns the elapsed time since the passed event excluding all the pauses', () => {
      play();
      expect(getElapsedTimeSince(emittedEvents.value[0])).toEqual(0);
      const interval = 5000;
      advanceTime(interval);
      expect(getElapsedTimeSince(emittedEvents.value[0])).toEqual(interval);
      pause();
      advanceTime(interval);
      expect(getElapsedTimeSince(emittedEvents.value[0])).toEqual(interval);
      expect(getElapsedTimeSince(emittedEvents.value[1])).toEqual(0);
      advanceTime(interval);
      expect(getElapsedTimeSince(emittedEvents.value[0])).toEqual(interval);
      expect(getElapsedTimeSince(emittedEvents.value[1])).toEqual(0);
      resume();
      advanceTime(interval);
      expect(getElapsedTimeSince(emittedEvents.value[0])).toEqual(interval * 2);
      expect(getElapsedTimeSince(emittedEvents.value[1])).toEqual(interval);
      expect(getElapsedTimeSince(emittedEvents.value[2])).toEqual(interval);

      expect(
        getElapsedTimeSince(emittedEvents.value[0], emittedEvents.value[1]),
      ).toEqual(interval);
      expect(
        getElapsedTimeSince(emittedEvents.value[1], emittedEvents.value[2]),
      ).toEqual(0);
      expect(
        getElapsedTimeSince(emittedEvents.value[0], emittedEvents.value[2]),
      ).toEqual(interval);
      expect(
        getElapsedTimeSince(emittedEvents.value[0], emittedEvents.value[0]),
      ).toEqual(0);

      play();
      advanceTime(interval);
      expect(getElapsedTimeSince(emittedEvents.value[3])).toEqual(interval);
    });

    it("throws an error if the passed target event hasn't been emitted since the last 'PLAY'", () => {
      play();
      play();
      expect(() => getElapsedTimeSince(emittedEvents.value[0])).toThrowError(
        "The passed target event hasn't been emitted since the last 'PLAY'",
      );
      expect(() =>
        getElapsedTimeSince(emittedEvents.value[1]),
      ).not.toThrowError();
    });

    it("throws an error if the passed limit event hasn't been emitted since the last 'PLAY'", () => {
      play();
      play();
      expect(() =>
        getElapsedTimeSince(emittedEvents.value[1], emittedEvents.value[0]),
      ).toThrowError(
        "The passed limit event hasn't been emitted since the last 'PLAY'",
      );
      expect(() =>
        getElapsedTimeSince(emittedEvents.value[1], emittedEvents.value[1]),
      ).not.toThrowError();
      expect(() =>
        getElapsedTimeSince(emittedEvents.value[0], emittedEvents.value[0]),
      ).toThrowError(
        "The passed target event hasn't been emitted since the last 'PLAY'",
      );
    });
  });

  describe('WATCH keystrokes', () => {
    it("controls game's lifecycle emitting time events", async () => {
      const timestamp = new Date(0),
        interval = 1;
      expect(emittedEvents.value).toEqual([]);
      stroke('Escape');
      await nextTick();
      expect(emittedEvents.value).toEqual([]);
      stroke('w', 'a');
      await nextTick();
      expect(emittedEvents.value).toEqual([]);
      stroke('w', 'a', 'r');
      await nextTick();
      const playEvent: Emitted<TimeEvent> = {
        id: 'u-u-i-d-1',
        timestamp,
        type: 'PLAY',
      };
      expect(emittedEvents.value).toEqual([playEvent]);

      advanceTime(interval);
      stroke('w', 'a', 'r');
      await nextTick();
      expect(emittedEvents.value).toEqual([playEvent]);

      advanceTime(interval);
      stroke('Escape');
      await nextTick();
      const pauseEvent: Emitted<TimeEvent> = {
        id: 'u-u-i-d-2',
        timestamp: new Date(timestamp.getTime() + interval * 2),
        type: 'PAUSE',
      };
      expect(emittedEvents.value).toEqual([playEvent, pauseEvent]);

      advanceTime(interval);
      stroke('Escape');
      await nextTick();
      const resumeEvent: Emitted<TimeEvent> = {
        id: 'u-u-i-d-3',
        timestamp: new Date(timestamp.getTime() + interval * 3),
        type: 'RESUME',
      };
      expect(emittedEvents.value).toEqual([playEvent, pauseEvent, resumeEvent]);

      advanceTime(interval);
      const hitEvent: Emitted<HitEvent> = {
        id: 'u-u-i-d-4',
        timestamp: new Date(timestamp.getTime() + interval * 4),
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy',
            word: '-'.repeat(MAX_HEALTH),
            speed: 10,
          },
        },
      };
      emit({
        type: hitEvent.type,
        payload: hitEvent.payload,
      });
      stroke('Escape');
      await nextTick();
      expect(emittedEvents.value).toEqual([
        playEvent,
        pauseEvent,
        resumeEvent,
        hitEvent,
      ]);
      stroke('w', 'a', 'r');
      await nextTick();
      const newPlayEvent: Emitted<TimeEvent> = {
        id: 'u-u-i-d-5',
        timestamp: new Date(timestamp.getTime() + interval * 4),
        type: 'PLAY',
      };
      expect(emittedEvents.value).toEqual([
        playEvent,
        pauseEvent,
        resumeEvent,
        hitEvent,
        newPlayEvent,
      ]);
    });
  });
});
