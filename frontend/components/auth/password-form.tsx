"use client";

import React, { useState } from "react";
import { Input } from "../ui/input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFormProps {
  value: string;
  onChange: (val: string) => void;
  confirmValue: string;
  onConfirmChange: (val: string) => void;
  error?: string;
  isLogin?: boolean;
}

export function PasswordForm({ value, onChange, confirmValue, onConfirmChange, error, isLogin = false }: PasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="Enter your password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error && !isLogin ? undefined : error} // Only show the main error on the confirm unless login
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-[32px] p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {!isLogin && (
        <div className="relative animate-in slide-in-from-top-2 fade-in">
          <Input
            type={showConfirm ? "text" : "password"}
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmValue}
            onChange={(e) => onConfirmChange(e.target.value)}
            error={error}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-[32px] p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}
