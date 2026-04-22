"use client";

import React, { useRef, useState, KeyboardEvent, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  isError?: boolean;
  isSuccess?: boolean;
  errorMessage?: string;
  onResend?: () => void;
}

export function OTPInput({ 
  length = 4, 
  value, 
  onChange, 
  onSubmit, 
  isError, 
  isSuccess,
  errorMessage = "Invalid OTP verification code.",
  onResend 
}: OTPInputProps) {
  const [internalValues, setInternalValues] = useState<string[]>(
    Array(length).fill("").map((_, i) => value[i] || "")
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(60);

  // Sync internal state with external value changes (like clear)
  useEffect(() => {
    setInternalValues(Array(length).fill("").map((_, i) => value[i] || ""));
  }, [value, length]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const triggerChange = (newValues: string[]) => {
    const val = newValues.join("");
    onChange(val);
    if (val.length === length && onSubmit) {
      onSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      const newValues = [...internalValues];
      newValues[index] = "";
      setInternalValues(newValues);
      triggerChange(newValues);
      return;
    }

    const char = val[val.length - 1]; 
    const newValues = [...internalValues];
    newValues[index] = char;
    setInternalValues(newValues);
    triggerChange(newValues);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !internalValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pastedData) return;

    const newValues = [...internalValues];
    for (let i = 0; i < pastedData.length; i++) {
        newValues[i] = pastedData[i];
    }
    setInternalValues(newValues);
    triggerChange(newValues);
    
    const nextFocusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const shakeVariants = {
    shake: { x: [0, -10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.4 } },
    idle: { x: 0 }
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className="flex gap-3 justify-center relative"
        variants={shakeVariants}
        animate={isError ? "shake" : "idle"}
      >
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={internalValues[i]}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            disabled={isSuccess}
            className={cn(
              "w-12 h-14 md:w-14 md:h-16 text-center text-xl font-semibold rounded-xl border bg-background shadow-sm transition-all duration-200 outline-none focus-visible:ring-4",
              isError 
                ? "border-red-500 focus-visible:ring-red-500/20 text-red-500" 
                : isSuccess
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-muted-foreground/20 focus-visible:ring-accent/10 focus-visible:border-accent text-foreground"
            )}
          />
        ))}

        {/* Success Checkmark Animation overlay (if desired) */}
        {isSuccess && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute -right-8 top-1/2 -translate-y-1/2 text-green-500 bg-green-100 p-1 rounded-full"
            >
              <Check size={18} strokeWidth={3} />
            </motion.div>
        )}
      </motion.div>
      
      <div className="min-h-6 mt-3 text-center">
        {isError ? (
          <p className="text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">{errorMessage}</p>
        ) : (
          <div className="text-sm text-muted-foreground">
            {timer > 0 ? (
              <span>Resend code in {timer}s</span>
            ) : (
              <button 
                type="button" 
                onClick={() => {
                  setTimer(60);
                  onResend?.();
                }} 
                className="font-medium text-foreground hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
