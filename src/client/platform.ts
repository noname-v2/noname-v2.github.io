export const platform = { 
    ios: false,
    android: false,
    mobile: false,
    mac: false,
    windows: false,
    linux: false
};

if (navigator.userAgent.includes('Android')) {
    platform.android = true;
    platform.mobile = true;
}
else if (navigator.platform === 'iPhone' || (navigator.platform === 'MacIntel' && 'ontouchend' in document)) {
    platform.ios = true;
    platform.mobile = true;
}
else if (navigator.platform === 'MacIntel') {
    platform.mac = true;
}
else if (navigator.platform === 'Win32') {
    platform.windows = true;
}
else if (navigator.platform.startsWith('Linux')) {
    platform.linux = true;
}