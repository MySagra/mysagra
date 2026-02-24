"use client";

import { SessionProvider as NextAuthSessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function SessionErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session, pathname]);

  return <>{children}</>;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider refetchInterval={4 * 60} refetchOnWindowFocus={true}>
      <SessionErrorHandler>{children}</SessionErrorHandler>
    </NextAuthSessionProvider>
  );
}
