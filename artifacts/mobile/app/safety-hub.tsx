/**
 * Settings and deep-link entry points share the tabbed Safety Hub surface.
 * Keeping one implementation prevents consent and privacy-copy drift between
 * Safety Hub navigation paths.
 */
export { default } from "./(tabs)/safety-hub";
