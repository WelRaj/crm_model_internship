"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import IndianMobileInput, { isValidIndianMobile } from "@/components/auth/IndianMobileInput";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const router = useRouter();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    category: "",
  });

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIndianMobile(formData.phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number.");
      phoneInputRef.current?.focus();
      return;
    }
    setPhoneError("");
    setIsLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
    }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  if (step === "otp") {
    return (
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-2xl shadow-sm border border-border">
        <div className="text-center">
          <h2 className="text-2xl font-black text-text">Verify OTP</h2>
          <p className="mt-2 text-sm text-text-muted">Enter the 6-digit code sent to +91 {formData.phone}</p>
        </div>
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <Input label="OTP" placeholder="000000" required type="text" maxLength={6} />
          <Button className="w-full" isLoading={isLoading}>Verify & Register</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-surface p-8 rounded-2xl shadow-sm border border-border">
      <div className="text-center">
        <h2 className="text-3xl font-black text-text tracking-tight">Create Account</h2>
        <p className="mt-2 text-sm text-text-muted">Join our premium CRM platform</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleDetailsSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" placeholder="John" required type="text" onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
          <Input label="Last Name" placeholder="Doe" required type="text" onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
        </div>
        <Input label="Email Address" placeholder="john@example.com" required type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} />
        
        <IndianMobileInput
            ref={phoneInputRef}
            value={formData.phone}
            error={phoneError}
            onChange={(value) => {
              setFormData({...formData, phone: value});
              if (phoneError && isValidIndianMobile(value)) {
                setPhoneError("");
              }
            }}
        />
        
        <Select 
          label="Department Category" 
          required 
          options={["Lead", "Onboarding", "Accounting", "Marketing", "Projects", "Administration"]} 
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        />

        <Button className="w-full" isLoading={isLoading}>
          Continue to OTP <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted">
        Already have an account? <Link href="/auth/signin" className="font-black text-primary hover:underline">Sign In</Link>
      </p>
    </div>
  );
}
