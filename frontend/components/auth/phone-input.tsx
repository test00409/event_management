"use client";

import React from "react";
import { Input } from "../ui/input";

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  return (
    <div className="relative w-full">
      {/* The top spacing is to align with the Input label. Label is roughly 24px height + 6px gap = 30px */}
      <div className="absolute left-4 top-[34px] flex items-center gap-1.5 pointer-events-none z-10 text-foreground font-medium">
        <span className="text-base select-none">🇮🇳</span>
        <span className="text-sm select-none">+91</span>
        <div className="w-px h-4 bg-muted-foreground/30 mx-1 select-none" />
      </div>
      <Input
        type="tel"
        label="Mobile Number"
        placeholder="98765 43210"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        className="pl-[84px] text-base"
        error={error}
      />
    </div>
  );
}
