export function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  if (process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN}`;
  }
  return "";
}
