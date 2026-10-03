// Plain module (no "use client"): the settings page, a server component, needs the real values
export const SETTINGS_TABS = ["sagra", "users", "api-keys"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];
