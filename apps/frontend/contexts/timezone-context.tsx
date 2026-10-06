"use client";

import { useSagraSettings } from "@/contexts/sagra-settings-context";

// Time zone of the sagra (settings → general), used to show dates and times
export function useTimezone(): string {
  return useSagraSettings().general.timezone;
}
