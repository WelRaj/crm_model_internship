"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import IndianMobileInput, { isValidIndianMobile } from "@/components/auth/IndianMobileInput";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => phoneInputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setIsSuccess(true);
      // Redirect to signin after 2 seconds
      setTimeout(() => router.push("/auth/signin"), 2000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md text-center space-y-4 bg-white p-12 rounded-xl shadow-lg border border-border">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-accent animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-primary">Registration Successful!</h2>
        <p className="text-secondary">Welcome to the premium CRM. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-border">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Create Account</h2>
        <p className="mt-2 text-sm text-secondary">Join our premium CRM platform</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input label="Full Name" placeholder="John Doe" required type="text" />
          <Input label="Email Address" placeholder="john@example.com" required type="email" />
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
          
          <div className="flex items-start space-x-2 py-2">
            <input id="terms" type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" required />
            <label htmlFor="terms" className="text-sm text-secondary leading-tight">
              I agree to the <Link href="#" className="text-accent font-medium hover:underline">Terms & Conditions</Link>
            </label>
          </div>
        </div>

        <Button className="w-full" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-secondary">
        Already have an account? <Link href="/auth/signin" className="font-semibold text-primary hover:underline">Sign In</Link>
      </p>
    </div>
  );
}
