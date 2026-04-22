"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthRole, RoleCards } from "./role-cards";
import { AuthFlow, AuthTabs } from "./auth-tabs";
import { PhoneInput } from "./phone-input";
import { OTPInput } from "./otp-input";
import { PasswordForm } from "./password-form";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

export function AuthCard() {
  const [role, setRole] = useState<AuthRole>("admin");
  const [flow, setFlow] = useState<AuthFlow>("signup");
  
  // Steps for signup: 1 = Phone, 2 = OTP, 3 = Password
  // Steps for signin: 1 = Phone & Password
  const [step, setStep] = useState<1 | 2 | 3>(1); 
  
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  // State for the role change confirmation modal
  const [pendingRole, setPendingRole] = useState<AuthRole | null>(null);

  const resetFlowState = () => {
    setStep(1);
    setPhone("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setOtpError(false);
    setOtpSuccess(false);
  };

  const handleFlowChange = (newFlow: AuthFlow) => {
    if (newFlow === flow) return;
    setFlow(newFlow);
    resetFlowState();
  };

  const handleRoleSelection = (newRole: AuthRole) => {
    if (newRole === role) return;

    // Check if there is any ongoing progress
    const hasProgress = step > 1 || phone.length > 0 || password.length > 0 || otp.length > 0;
    
    if (hasProgress) {
      setPendingRole(newRole);
    } else {
      setRole(newRole);
      resetFlowState();
    }
  };

  const confirmRoleChange = () => {
    if (pendingRole) {
      setRole(pendingRole);
      resetFlowState();
      setPendingRole(null);
    }
  };

  const cancelRoleChange = () => {  
    setPendingRole(null);
  };

  const handleNext = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    if (flow === "signin") {
      if (phone.length < 10) return setError("Please enter a valid mobile number.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      // Do Login
      alert(`Logging in as ${role} with ${phone}`);
      return;
    }

    // SIGNUP FLOW Let's go through steps
    if (step === 1) {
      if (phone.length < 10) return setError("Please enter a valid mobile number.");
      setStep(2);
    } 
    else if (step === 2) {
      if (otp.length < 4) return;
      // Mock validation
      if (otp === "0000") {
        setOtpError(true);
        setTimeout(() => setOtpError(false), 1000); // reset shake
        return;
      }
      setOtpSuccess(true);
      setTimeout(() => {
        setStep(3);
      }, 800);
    }
    else if (step === 3) {
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      if (password !== confirmPassword) return setError("Passwords do not match.");
      alert(`Created ${role} account!`);
    }
  };

  const getHeading = () => {
    if (flow === "signup") {
      return `Join as ${role === "admin" ? "Event Admin" : "Worker"}`;
    }
    return `Welcome back, ${role === "admin" ? "Event Admin" : "Worker"}`;
  };

  const getSubheading = () => {
    if (flow === "signup") {
      return role === "admin" 
        ? "Create events, manage teams, and scale your operations."
        : "Find gigs, track hours, and join exciting events.";
    }
    return "Enter your details to access your dashboard.";
  };

  return (
    <div className="w-full max-w-[440px] mx-auto bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.04] p-8 md:p-10 relative overflow-hidden">
      
      {/* Confirmation Modal */}
      <AnimatePresence>
        {pendingRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white p-7 rounded-3xl shadow-2xl border border-black/5 text-center max-w-[320px] mx-4"
            >
              <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">Change Role?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Changing your role will reset your current progress. Switch to{" "}
                <strong className="text-foreground font-semibold">
                  {pendingRole === "admin" ? "Event Admin" : "Worker"}
                </strong>?
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={cancelRoleChange} 
                  className="flex-1 h-11 rounded-xl border-black/10 hover:bg-black/5 font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmRoleChange} 
                  className="flex-1 h-11 rounded-xl bg-[#101010] hover:bg-black text-white font-medium"
                >
                  Switch Role
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Selection */}
      <RoleCards role={role} onChange={handleRoleSelection} />
      
      {/* Dynamic Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2 transition-colors duration-300">
          {getHeading()}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed px-4 transition-colors duration-300">
          {getSubheading()}
        </p>
      </div>

      {/* Auth Tabs */}
      <AuthTabs flow={flow} onChange={handleFlowChange} />

      {/* Main Form Area */}
      <div className="relative">
        <form onSubmit={handleNext}>
          <AnimatePresence mode="wait" initial={false}>
            {flow === "signin" ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-5"
              >
                <PhoneInput value={phone} onChange={setPhone} error={error && !password ? error : undefined} />
                <PasswordForm 
                  isLogin 
                  value={password} 
                  onChange={setPassword} 
                  confirmValue="" 
                  onConfirmChange={() => {}} 
                  error={error && password ? error : undefined} 
                />
                <Button type="submit" className="w-full h-12 bg-[#101010] hover:bg-black rounded-xl text-white font-semibold shadow-sm transition-all active:scale-[0.98] mt-2">
                  Sign In as {role === "admin" ? "Admin" : "Worker"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key={`signup-step-${step}`}
                initial={{ opacity: 0, x: 15, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -15, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-6"
              >
                {step === 1 && (
                  <div className="space-y-6">
                    <PhoneInput value={phone} onChange={setPhone} error={error} />
                    <Button type="submit" disabled={phone.length < 10} className="w-full h-12 bg-[#101010] disabled:bg-[#101010]/50 hover:bg-black rounded-xl text-white font-semibold shadow-sm transition-all active:scale-[0.98]">
                      Continue
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <OTPInput 
                      length={4} 
                      value={otp} 
                      onChange={setOtp} 
                      onSubmit={() => handleNext()}
                      isError={otpError}
                      isSuccess={otpSuccess}
                      errorMessage="Incorrect OTP. Try 1234."
                      onResend={() => alert("Resent!")}
                    />
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 w-12 rounded-xl shrink-0 p-0 border-black/10 hover:bg-black/5">
                        <ArrowLeft size={18} />
                      </Button>
                      <Button type="submit" disabled={otp.length < 4} className="flex-1 h-12 bg-[#2563eb] disabled:bg-[#2563eb]/50 hover:bg-blue-700 rounded-xl text-white font-semibold shadow-sm transition-all active:scale-[0.98]">
                        Verify OTP
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <PasswordForm 
                      value={password} 
                      onChange={setPassword} 
                      confirmValue={confirmPassword} 
                      onConfirmChange={setConfirmPassword} 
                      error={error} 
                    />
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-12 w-12 rounded-xl shrink-0 p-0 border-black/10 hover:bg-black/5">
                        <ArrowLeft size={18} />
                      </Button>
                      <Button type="submit" disabled={password.length < 6 || !confirmPassword} className="flex-1 h-12 bg-[#101010] disabled:bg-[#101010]/50 hover:bg-black rounded-xl text-white font-semibold shadow-sm transition-all active:scale-[0.98]">
                        Sign Up as {role === "admin" ? "Admin" : "Worker"}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

    </div>
  );
}

