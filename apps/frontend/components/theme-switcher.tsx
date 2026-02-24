"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-1 p-2">
        <Button variant="outline" size="sm" className="flex-1">
          <SunIcon className="h-4 w-4 mr-2" />
          Chiaro
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <MoonIcon className="h-4 w-4 mr-2" />
          Scuro
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1 p-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme("light")}
        className={
          theme === "light"
            ? "flex-1 !bg-primary !text-primary-foreground !border-primary hover:!bg-primary hover:!text-primary-foreground"
            : "flex-1"
        }
      >
        <SunIcon className="h-4 w-4 mr-2" />
        Chiaro
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme("dark")}
        className={
          theme === "dark"
            ? "flex-1 !bg-yellow-500 hover:!bg-yellow-500 !text-black hover:!text-black !border-yellow-500 font-medium"
            : "flex-1"
        }
      >
        <MoonIcon className="h-4 w-4 mr-2" />
        Scuro
      </Button>
    </div>
  );
}
