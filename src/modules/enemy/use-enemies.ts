import { createSharedComposable } from '@vueuse/core';
import { computed } from 'vue';
import { useEntity } from '../entity/use-entity';
import type { SpawnEvent } from '../event/types';
import { useEvents } from '../event/use-events';
import { useGlossary } from '../glossary/use-glossary';
import { usePosition } from '../position/use-position';
import type { Enemy } from './types';

export const useEnemies = createSharedComposable(setup);

function setup() {
  const { emittedEvents, emit } = useEvents();
  const { create } = useEntity();
  const { getNextWord } = useGlossary();
  const { getRandomPosition } = usePosition();

  const enemies = computed(() => {
    const lastPlayEventIndex = emittedEvents.value.findLastIndex(
      (event) => event.type === 'PLAY',
    );
    if (lastPlayEventIndex < 0) {
      return [];
    }
    return emittedEvents.value
      .slice(lastPlayEventIndex + 1)
      .reduce<Array<Enemy>>((result, event) => {
        if (event.type === 'SPAWN') {
          result.push(event.payload.entity);
        }
        return result;
      }, []);
  });

  function spawn(quantity = 1) {
    const events: Array<SpawnEvent> = [];
    for (let i = 0; i < quantity; i++) {
      events.push({
        type: 'SPAWN',
        payload: {
          entity: create({
            word: getNextWord(),
          }),
          position: getRandomPosition(),
        },
      });
    }
    return emit(...events) as Array<SpawnEvent>;
  }

  return {
    enemies,
    spawn,
  };
}
