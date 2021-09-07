/** Base component class */
export { Component } from './client/component';

/** Type for point location */
export type Point = {x: number, y: number};

/** Type for an area */
export type Region = {x: [number, number], y: [number, number]};

/** Transition duration names. */
export type TransitionDuration = 'normal' | 'fast' | 'slow' | 'faster' | 'slower' | null;

/** Options for ui.animate(). */
export type { AnimationOptions } from './client/ui';

/** All component classes. */
export * from '../build/components';

/** Color literals. */
export * from '../build/literals';