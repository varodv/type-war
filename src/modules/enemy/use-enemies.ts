import { createSharedComposable } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useEntity } from '../entity/use-entity';
import type { Emitted, HitEvent, SpawnEvent } from '../event/types';
import { useEvents } from '../event/use-events';
import { useGame } from '../game/use-game';
import { useGlossary } from '../glossary/use-glossary';
import { SPEED as PLAYER_SPEED } from '../player/player.consts';
import type { Position } from '../position/types';
import { usePosition } from '../position/use-position';
import { MAX_DISTANCE, SPEED } from './enemy.consts';
import type { Enemy } from './types';

export const useEnemies = createSharedComposable(setup);

function setup() {
  const { emittedEventsSinceLastPlay, emit } = useEvents();
  const { create } = useEntity();
  const { getNextWord } = useGlossary();
  const { getRandomPosition } = usePosition();
  const { elapsedTime, overEvent, getElapsedTimeSince } = useGame();

  const nextSpawnTime = ref(0);

  const enemies = computed(() =>
    emittedEventsSinceLastPlay.value.reduce<Array<Enemy>>((result, event) => {
      if (event.type === 'SPAWN') {
        result.push(event.payload.entity);
      }
      return result;
    }, []),
  );

  function spawn(quantity = 1) {
    const events: Array<SpawnEvent> = [];
    for (let i = 0; i < quantity; i++) {
      events.push({
        type: 'SPAWN',
        payload: {
          entity: create({
            word: getNextWord(),
            speed: SPEED,
          }),
          position: getRandomPosition(),
        },
      });
    }
    return emit(...events) as Array<SpawnEvent>;
  }

  function getHealth(enemy: Enemy) {
    if (!getSpawnEvent(enemy)) {
      throw new Error(
        "The passed enemy hasn't been spawned since the last 'PLAY'",
      );
    }
    return !getHitEvent(enemy) ? 1 : 0;
  }

  function getDistance(enemy: Enemy) {
    const spawnEvent = getSpawnEvent(enemy);
    if (!spawnEvent) {
      throw new Error(
        "The passed enemy hasn't been spawned since the last 'PLAY'",
      );
    }
    let result = MAX_DISTANCE;
    const hitEvent = getHitEvent(enemy);
    const elapsedTimeBeforeHit = getElapsedTimeSince(
      spawnEvent,
      hitEvent ?? overEvent.value,
    );
    result -= (enemy.speed - PLAYER_SPEED) * (elapsedTimeBeforeHit / 1000);
    if (hitEvent) {
      const elapsedTimeAfterHit = getElapsedTimeSince(
        hitEvent,
        overEvent.value,
      );
      result -= PLAYER_SPEED * (elapsedTimeAfterHit / 1000);
    }
    return result;
  }

  function getPosition(enemy: Enemy) {
    const spawnEvent = getSpawnEvent(enemy);
    if (!spawnEvent) {
      throw new Error(
        "The passed enemy hasn't been spawned since the last 'PLAY'",
      );
    }
    const result = [...spawnEvent.payload.position] as Position;
    const hitEvent = getHitEvent(enemy);
    const elapsedTimeBeforeHit = getElapsedTimeSince(
      spawnEvent,
      hitEvent ?? overEvent.value,
    );
    const maxElapsedTimeBeforeHit =
      (MAX_DISTANCE / (enemy.speed - PLAYER_SPEED)) * 1000;
    const elapsedTimeBeforeHitPct =
      elapsedTimeBeforeHit / maxElapsedTimeBeforeHit;
    result.forEach((coordinate, index) => {
      result[index] = coordinate - coordinate * elapsedTimeBeforeHitPct;
    });
    if (hitEvent) {
      const elapsedTimeAfterHit = getElapsedTimeSince(
        hitEvent,
        overEvent.value,
      );
      const traveledDistanceAfterHit =
        PLAYER_SPEED * (elapsedTimeAfterHit / 1000);
      result.forEach((coordinate, index) => {
        result[index] =
          coordinate > 0
            ? coordinate + traveledDistanceAfterHit
            : coordinate - traveledDistanceAfterHit;
      });
    }
    return result;
  }

  function getSpawnEvent(enemy: Enemy) {
    return emittedEventsSinceLastPlay.value.find(
      (event) => event.type === 'SPAWN' && event.payload.entity.id === enemy.id,
    ) as Emitted<SpawnEvent>;
  }

  function getHitEvent(enemy: Enemy) {
    return emittedEventsSinceLastPlay.value.find(
      (event) =>
        event.type === 'HIT' &&
        (('source' in event.payload && event.payload.source.id === enemy.id) ||
          ('target' in event.payload && event.payload.target.id === enemy.id)),
    ) as Emitted<HitEvent>;
  }

  watch(elapsedTime, (value) => {
    if (
      emittedEventsSinceLastPlay.value[
        emittedEventsSinceLastPlay.value.length - 1
      ]?.type === 'PLAY'
    ) {
      nextSpawnTime.value = 0;
    }
    if (value >= nextSpawnTime.value) {
      spawn();
      nextSpawnTime.value += 2000;
    }
    enemies.value.forEach((enemy) => {
      if (getHealth(enemy) > 0 && getDistance(enemy) <= 0) {
        emit({ type: 'HIT', payload: { source: enemy } });
      }
    });
  });

  return {
    enemies,
    spawn,
    getHealth,
    getDistance,
    getPosition,
    getSpawnEvent,
    getHitEvent,
  };
}
