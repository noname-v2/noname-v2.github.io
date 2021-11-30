/** Type for point location */
export type Point = {x: number, y: number};

/** Type for an area */
export type Region = {x: [number, number], y: [number, number]};

/** Options for ui.animate(). */
export type { AnimationOptions } from './client/ui';

/** Transition duration names. */
export type { TransitionDuration } from './components/component';

/** All component classes. */
export * from '../build/component-types';

/** Color literals. */
export * from '../build/literals';

/** Shared types. */
export * from './types';
