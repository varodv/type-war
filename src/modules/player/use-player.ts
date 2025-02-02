import type { Enemy } from '../enemy/types';
import { createSharedComposable } from '@vueuse/core';
import { computed, watch } from 'vue';
import { useEnemies } from '../enemy/use-enemies';
import { useEvents } from '../event/use-events';
import { useGame } from '../game/use-game';
import { useKeyboard } from '../keyboard/use-keyboard';
import { MAX_HEALTH } from './player.consts';

export const usePlayer = createSharedComposable(setup);

function setup() {
  const { emittedEventsSinceLastPlay, emit } = useEvents();
  const { enemies, getHealth, getSpawnEvent } = useEnemies();
  const { getKeystrokesMatching } = useKeyboard();
  const { overEvent, isPausedAt } = useGame();

  const health = computed(() => {
    if (!emittedEventsSinceLastPlay.value.length) {
      return 0;
    }
    return emittedEventsSinceLastPlay.value.reduce((result, event) => {
      if (event.type === 'HIT' && 'source' in event.payload) {
        result -= 1;
      }
      return Math.max(result, 0);
    }, MAX_HEALTH);
  });

  const target = computed<Enemy | undefined>(
    () =>
      enemies.value
        .filter(enemy => getHealth(enemy) > 0 && getKeystrokesToHit(enemy).length > 0)
        .sort(
          (target1, target2) =>
            getKeystrokesToHit(target1)[0].timestamp.getTime()
            - getKeystrokesToHit(target2)[0].timestamp.getTime() || -1,
        )[0],
  );

  const keystrokesToHitTarget = computed(() =>
    target.value ? getKeystrokesToHit(target.value) : [],
  );

  function getKeystrokesToHit(enemy: Enemy) {
    const spawnEvent = getSpawnEvent(enemy);
    if (!spawnEvent) {
      throw new Error(
        'The passed enemy hasn\'t been spawned since the last \'PLAY\'',
      );
    }
    return getKeystrokesMatching(enemy.word, (keystroke) => {
      const lastHitEvent = emittedEventsSinceLastPlay.value.findLast(
        event => event.type === 'HIT' && 'target' in event.payload,
      );
      return (
        keystroke.timestamp >= spawnEvent.timestamp
        && !isPausedAt(keystroke.timestamp)
        && (!overEvent.value || keystroke.timestamp < overEvent.value.timestamp)
        && (!lastHitEvent || keystroke.timestamp > lastHitEvent.timestamp)
      );
    });
  }

  watch(
    keystrokesToHitTarget,
    (value) => {
      if (target.value && value.length === target.value.word.length) {
        emit({ type: 'HIT', payload: { target: target.value } });
      }
    },
    { deep: true },
  );

  return {
    health,
    target,
    keystrokesToHitTarget,
  };
}
