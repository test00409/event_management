"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Phone, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  label: string;
  error?: boolean;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ icon, label, error, className, type = "text", ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const currentType = isPassword && showPassword ? "text" : type;

    return (
      <div className="relative group w-full flex flex-col gap-1.5 text-left mb-5">
        <label className="text-[13px] font-semibold text-muted-foreground ml-1">
          {label}
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-foreground">
            {icon}
          </div>

          <input
            {...props}
            ref={ref}
            type={currentType}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full h-[52px] pl-11 pr-12 bg-black/5 text-foreground rounded-xl border outline-none font-medium transition-all duration-300 placeholder:text-muted-foreground/50 placeholder:font-normal focus:bg-background ${error
                ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] focus:border-red-500"
                : "border-transparent focus:border-black/20 focus:shadow-[0_0_20px_rgba(0,0,0,0.06)]"
              } ${className || ""}`}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/50 hover:text-foreground transition-colors rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-black/10"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

          {/* "+91" static prefix for Phone Input */}
          {props.name === "phone" && (
            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-foreground font-semibold text-sm mr-1 pointer-events-none">
              +91 <span className="opacity-30 inline-block ml-1">|</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
InputField.displayName = "InputField";

export function AdminLoginCard() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isValidSubmit = phone.length === 10 && password.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidSubmit || isLoading) return;

    setIsLoading(true);
    setErrorMessage("");
    setIsError(false);

    // Mock Backend Validation
    setTimeout(() => {
      // Intentionally fail if password isn't 'admin123'
      if (password !== "admin123") {
        setErrorMessage("Invalid credentials. Access denied.");
        setIsError(true);
        setIsLoading(false);
        // Reset shake state after animation
        setTimeout(() => setIsError(false), 800);
      } else {
        // Success scenario
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = "/super-dashboard"; // Simulate redirect
        }, 1500);
      }
    }, 1000);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] mx-auto bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-black/[0.04] p-10 flex flex-col items-center justify-center min-h-[400px]"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.3)] mb-6 text-white"
        >
          <ShieldCheck size={40} />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Access Granted</h2>
        <p className="text-sm text-muted-foreground text-center">Redirecting to Super Admin terminal...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 0 }}
      animate={isError ? { x: [-10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="w-full max-w-[420px] mx-auto bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 p-8 md:p-10 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative text-center mb-8">
        <motion.div
          className="mx-auto w-16 h-16 bg-[#101010] rounded-2xl flex items-center justify-center mb-5 shadow-lg border border-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Lock size={28} className="text-white" />
        </motion.div>
        <h2 className="text-[28px] leading-tight font-bold tracking-tight text-foreground mb-1.5">
          Super Admin
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-semibold tracking-wide uppercase border border-red-500/10">
          <ShieldCheck size={14} />
          Restricted Access
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10">
        <InputField
          name="phone"
          label="Mobile Number"
          icon={<Phone size={18} />}
          placeholder="000 000 0000"
          value={phone}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
            setPhone(val);
          }}
          className="pl-[76px]" // Extra padding for the static +91
          error={isError}
          autoFocus
        />

        <InputField
          name="password"
          label="Secure Password"
          type="password"
          icon={<Lock size={18} />}
          placeholder="Enter authorization key"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={isError}
        />

        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: -8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="text-red-500 text-sm font-medium mb-4 text-center overflow-hidden"
            >
              <div className="py-2 inline-flex gap-2 items-center bg-red-50 px-3 rounded-lg border border-red-100">
                <ShieldCheck size={16} />
                {errorMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          disabled={!isValidSubmit || isLoading}
          className={`w-full h-14 bg-[#101010] hover:bg-black rounded-xl text-white font-semibold text-lg shadow-xl shadow-black/10 transition-all duration-300 ${!isValidSubmit ? "opacity-50 grayscale" : "active:scale-[0.98]"}`}
        >
          {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Authenticate"}
        </Button>

        <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-center gap-2 text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
          <Lock size={12} />
          Authorized personnel only
        </div>
      </form>
    </motion.div>
  );
}
