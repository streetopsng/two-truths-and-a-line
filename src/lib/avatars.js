// Shared GummyGum avatar library, hosted on the hub so every experience
// draws from the same illustrated set instead of maintaining its own.
export const GUMMYGUM_AVATAR_BASE_URL = 'https://gummygum.app/avatars';
export const AVATAR_IDS = Array.from({ length: 26 }, (_, i) => `av-${i + 1}`);
export const avatarUrl = (id) => `${GUMMYGUM_AVATAR_BASE_URL}/${id && AVATAR_IDS.includes(id) ? id : 'av-1'}.svg`;
