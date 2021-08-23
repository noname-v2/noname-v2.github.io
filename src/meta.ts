export * from '../build/meta';

/** Enable debug mode in http */
export const debug = globalThis.location.protocol === 'http:';