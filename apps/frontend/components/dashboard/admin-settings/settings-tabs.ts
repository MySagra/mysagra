// Plain module (no "use client"): the settings page, a server component, needs the real values
export const SETTINGS_TABS = ["general", "cashier", "users", "api-keys"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];
