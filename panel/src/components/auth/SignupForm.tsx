"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import IndianMobileInput, { isValidIndianMobile } from "@/components/auth/IndianMobileInput";
import { signup } from "@/services/auth-api";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");
  const router = useRouter();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    category: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIndianMobile(formData.phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number.");
      phoneInputRef.current?.focus();
      return;
    }
    if (formData.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!formData.category) {
      setFormError("Select a department category.");
      return;
    }

    setPhoneError("");
    setFormError("");
    setIsLoading(true);

    try {
      await signup({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        mobile: formData.phone,
        department: formData.category,
        password: formData.password,
      });
      setIsLoading(false);
      router.push("/auth/signin");
    } catch (error) {
      setIsLoading(false);
      setFormError(error instanceof Error ? error.message : "Unable to create account.");
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-surface p-8 rounded-2xl shadow-sm border border-border">
      <div className="text-center">
        <h2 className="text-3xl font-black text-text tracking-tight">Create Account</h2>
        <p className="mt-2 text-sm text-text-muted">Create access for the DeMatade Algo operations panel</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSignupSubmit}>
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
          options={["Client Operations", "People Operations", "Finance Control", "Growth Marketing", "Delivery Projects", "Admin Control"]} 
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        />

        <Input label="Password" required type="password" minLength={8} autoComplete="new-password" onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <Input label="Confirm Password" required type="password" minLength={8} autoComplete="new-password" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />

        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {formError}
          </div>
        )}

        <Button className="w-full" isLoading={isLoading}>
          Create Account <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted">
        Already have an account? <Link href="/auth/signin" className="font-black text-primary hover:underline">Sign In</Link>
      </p>
    </div>
  );
}
