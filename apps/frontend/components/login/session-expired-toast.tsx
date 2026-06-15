"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";

export function SessionExpiredToast() {
  const params = useSearchParams();
  const { t } = useLocale();

  useEffect(() => {
    if (params.get("reason") === "expired") {
      toast.error(t.login.sessionExpired);
    }
  }, []);

  return null;
}
