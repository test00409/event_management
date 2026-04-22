"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type AuthFlow = "signup" | "signin";

interface AuthTabsProps {
  flow: AuthFlow;
  onChange: (flow: AuthFlow) => void;
}

export function AuthTabs({ flow, onChange }: AuthTabsProps) {
  // Prevent hydration mismatch with layoutId/motion
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative flex w-full max-w-sm mx-auto rounded-xl bg-muted/50 p-1 mb-8">
      <button
        type="button"
        onClick={() => onChange("signup")}
        className={cn(
          "relative z-10 flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent",
          flow === "signup" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Sign Up
      </button>
      <button
        type="button"
        onClick={() => onChange("signin")}
        className={cn(
          "relative z-10 flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent",
          flow === "signin" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Sign In
      </button>

      {mounted && (
        <div className="absolute inset-y-1 left-1 right-1 pointer-events-none flex">
          <motion.div
            className="w-1/2 h-full rounded-lg shadow-sm bg-background border border-black/[0.04]"
            initial={false}
            animate={{
              x: flow === "signup" ? "0%" : "100%",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>
      )}
    </div>
  );
}
