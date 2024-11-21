import type { Enemy } from '../../enemy/types';
import type { Entity } from '../../entity/types';
import type { Position } from '../../position/types';

export type Event = TimeEvent | SpawnEvent | HitEvent;

export type TimeEvent = BaseEvent<'PLAY' | 'PAUSE' | 'RESUME'>;

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
  Type extends 'PLAY' | 'PAUSE' | 'RESUME' | 'SPAWN' | 'HIT',
  PlayloadType extends object | undefined = undefined,
> = {
  type: Type;
} & (PlayloadType extends object
  ? { payload: PlayloadType }
  : { payload?: Record<string, never> });
