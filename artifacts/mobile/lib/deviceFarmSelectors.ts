export const DEVICE_FARM_TEST_IDS = {
  stagingBuildMarker: "mwm-staging-build-marker",
  loginScreen: "mwm-login-screen",
  loginEmail: "mwm-login-email",
  loginPassword: "mwm-login-password",
  loginSubmit: "mwm-login-submit",
  discoverScreen: "mwm-screen-discover",
  discoverTab: "mwm-tab-discover",
  mapScreen: "mwm-screen-map",
  mapTab: "mwm-tab-map",
  safetyScreen: "mwm-screen-safety",
  safetyTab: "mwm-tab-safety",
  businessProfileScreen: "mwm-screen-business-profile",
  businessProfileTitle: "mwm-business-profile-title",
  businessProfileBack: "mwm-business-profile-back",
  kinfolkLauncher: "mwm-kinfolk-launcher",
  kinfolkPanel: "mwm-kinfolk-panel",
  kinfolkClose: "mwm-kinfolk-close",
  kinfolkInput: "mwm-kinfolk-input",
  kinfolkSend: "mwm-kinfolk-send",
  kinfolkAnswer: "mwm-kinfolk-answer",
} as const;

export function deviceFarmBusinessCardTestID(businessId: string): string {
  return `mwm-business-card-${businessId}`;
}
