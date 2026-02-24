"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login/login-card/login-form";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>

      <div className="absolute bottom-0 text-sm text-muted-foreground select-none">
        <Link
          href="https://www.mysagra.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {"Powered by"}
          <Button variant="link" className="text-primary p-1.5">
            {"MySagra"}
          </Button>
        </Link>
      </div>
      <div className="absolute bottom-0 right-0 m-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted &&
            (theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            ))}
        </Button>
      </div>
    </div>
  );
}
