// Single source of truth for outbound app/store links, so the homepage banner
// and the footer can't drift apart (the banner previously pointed at the Play
// Store home page instead of the app's own listing).
export const ANDROID_PACKAGE = "com.mouradmek.blossom";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
export const SUPPORT_EMAIL = "mourad.meknioui@gmail.com";
