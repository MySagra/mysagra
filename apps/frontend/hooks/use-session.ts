"use client";

import { useState, useEffect } from "react";

export type AppRole = "admin" | "maintainer" | "operator";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
}

export interface SessionData {
  user: SessionUser;
}

function parseUserCookie(): SessionData | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("myamministratore_user="));
  if (!match) return null;
  try {
    const token = match.trim().slice("myamministratore_user=".length);
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));
    return {
      user: {
        id: payload.userId,
        name: payload.username,
        email: `${payload.username}@myamministratore.local`,
        role: payload.role as AppRole,
      },
    };
  } catch {
    return null;
  }
}

export function useSession() {
  const [data, setData] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const session = parseUserCookie();
    setData(session);
    setStatus(session ? "authenticated" : "unauthenticated");
  }, []);

  return { data, status };
}
