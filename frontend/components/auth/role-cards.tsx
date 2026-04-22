"use client";

import { cn } from "@/lib/utils";
import { ShieldAlert, Wrench, BriefcaseBusiness, Construction } from "lucide-react";

export type AuthRole = "admin" | "worker";

interface RoleCardsProps {
  role: AuthRole;
  onChange: (role: AuthRole) => void;
}

export function RoleCards({ role, onChange }: RoleCardsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onChange("admin")}
        className={cn(
          "relative flex flex-col items-center justify-center p-4 w-[110px] h-[110px] rounded-2xl border transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-accent/20",
          role === "admin"
            ? "border-accent bg-accent/5 shadow-sm"
            : "border-muted/60 bg-background hover:border-muted-foreground/30 hover:bg-muted/30"
        )}
      >
        <BriefcaseBusiness
          size={28}
          className={cn("mb-3 transition-colors duration-300", role === "admin" ? "text-accent" : "text-muted-foreground")}
        />
        <span className={cn("text-sm font-semibold transition-colors duration-300", role === "admin" ? "text-foreground" : "text-muted-foreground")}>
          Event Admin
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange("worker")}
        className={cn(
          "relative flex flex-col items-center justify-center p-4 w-[110px] h-[110px] rounded-2xl border transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-accent/20",
          role === "worker"
            ? "border-accent bg-accent/5 shadow-sm"
            : "border-muted/60 bg-background hover:border-muted-foreground/30 hover:bg-muted/30"
        )}
      >
        <Construction
          size={28}
          className={cn("mb-3 transition-colors duration-300", role === "worker" ? "text-accent" : "text-muted-foreground")}
        />
        <span className={cn("text-sm font-semibold transition-colors duration-300", role === "worker" ? "text-foreground" : "text-muted-foreground")}>
          Worker
        </span>
      </button>
    </div>
  );
}
