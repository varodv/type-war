import { computed, ref } from 'vue';
import { mockCrypto } from '../../../__tests__/tests.utils';
import { useEvents } from '../../event/use-events';
import { MAX_HEALTH } from '../../player/player.consts';
import { useGame } from '../use-game';

const now = ref(new Date());

describe('useGame', () => {
  const {
    paused,
    over,
    elapsedTime,
    play,
    pause,
    resume,
    getElapsedTimeSince,
  } = useGame();
  const { emittedEvents, emit } = useEvents();

  function setTime(milliseconds: number): void {
    now.value = new Date(milliseconds);
    vi.setSystemTime(now.value);
  }

  function advanceTime(milliseconds: number): void {
    setTime(now.value.getTime() + milliseconds);
  }

  beforeEach(() => {
    emittedEvents.value = [];

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
      play();
      expect(over.value).toBeFalsy();
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
      expect(over.value).toBeTruthy();
      play();
      expect(over.value).toBeFalsy();
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
});
