/** Platform detector. */
export const ios = navigator.platform === 'iPhone' || (navigator.platform === 'MacIntel' && 'ontouchend' in document);
export const android = navigator.userAgent.includes('Android');
export const mobile = ios || android;
export const mac = navigator.platform === 'MacIntel' && !('ontouchend' in document);
export const windows = navigator.platform === 'Win32';
export const linux = navigator.platform.startsWith('Linux');
