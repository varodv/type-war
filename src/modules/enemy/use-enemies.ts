import { computed } from 'vue';
import { useEntity } from '../entity/use-entity';
import type { SpawnEvent } from '../event/types';
import { useEvents } from '../event/use-events';
import { useGlossary } from '../glossary/use-glossary';
import { usePosition } from '../position/use-position';
import type { Enemy } from './types';

const { emittedEvents, emit } = useEvents();
const { create } = useEntity();
const { getNextWord } = useGlossary();
const { getRandomPosition } = usePosition();

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

export function useEnemies() {
  const enemies = computed(() => {
    const lastPlayEventIndex = emittedEvents.value.findLastIndex(
      (event) => event.type === 'PLAY',
    );
    return emittedEvents.value.reduce<Array<Enemy>>((result, event, index) => {
      if (index > lastPlayEventIndex && event.type === 'SPAWN') {
        result.push(event.payload.entity);
      }
      return result;
    }, []);
  });

  return {
    enemies,
    spawn,
  };
}
