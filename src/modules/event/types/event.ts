import type { Enemy } from '../../enemy/types';
import type { Entity } from '../../entity/types';
import type { Position } from '../../shared/types';

export type Event = PlayEvent | SpawnEvent | HitEvent;

export type PlayEvent = BaseEvent<'PLAY'>;

export type SpawnEvent = BaseEvent<
  'SPAWN',
  {
    entity: Enemy;
    position: Position;
  }
>;

export type HitEvent = BaseEvent<
  'HIT',
  | {
      source: Enemy;
    }
  | {
      target: Enemy;
    }
>;

export type Emitted<EventType extends Event> = Entity<
  EventType & { timestamp: Date }
>;

type BaseEvent<
  Type extends 'PLAY' | 'SPAWN' | 'HIT',
  PlayloadType extends object | undefined = undefined,
> = {
  type: Type;
} & (PlayloadType extends object
  ? { payload: PlayloadType }
  : { payload?: Record<string, never> });
