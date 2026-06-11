"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import IndianMobileInput, { isValidIndianMobile } from "@/components/auth/IndianMobileInput";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SigninForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (step === "phone") {
        phoneInputRef.current?.focus();
      } else {
        document.getElementById("otp-0")?.focus();
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, [step]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIndianMobile(phoneNumber)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number.");
      phoneInputRef.current?.focus();
      return;
    }
    
    setPhoneError("");
    setIsLoading(true);
    // Simulating API Call
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
    }, 1000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    }, 1500);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md text-center space-y-4 bg-white p-12 rounded-xl shadow-lg border border-border animate-in zoom-in-95">
        <CheckCircle className="h-16 w-16 text-accent mx-auto animate-bounce" />
        <h2 className="text-2xl font-bold text-primary">Login Successful!</h2>
        <p className="text-secondary font-medium">Accessing your premium dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-2xl border border-border animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tighter text-primary uppercase">Welcome Back</h2>
        <p className="mt-2 text-sm text-secondary font-medium">
          {step === "phone" ? "Enter your mobile to sign in" : `OTP sent to +91 ${phoneNumber}`}
        </p>
      </div>

      <div className="mt-8">
        {step === "phone" ? (
          <form className="space-y-6" onSubmit={handleSendOTP}>
            <IndianMobileInput
              ref={phoneInputRef}
              value={phoneNumber}
              error={phoneError}
              autoFocus
              onChange={(value) => {
                setPhoneNumber(value);
                if (phoneError && isValidIndianMobile(value)) {
                  setPhoneError("");
                }
              }}
            />
            <Button type="submit" className="w-full group bg-primary h-12" isLoading={isLoading}>
              Send OTP <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleVerifyOTP}>
            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  required
                  value={digit}
                  className="w-12 h-14 text-center text-2xl font-black border-2 border-border rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none transition-all"
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                />
              ))}
            </div>
            <Button type="submit" className="w-full bg-primary h-12 font-bold" isLoading={isLoading}>
              Verify & Sign In
            </Button>
            <button 
              type="button" 
              onClick={() => {
                setStep("phone");
                setOtp(["", "", "", "", "", ""]);
              }} 
              className="w-full text-center text-xs font-bold text-accent hover:underline uppercase tracking-widest"
            >
              Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
