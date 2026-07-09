"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { login } from "@/services/auth-api";
import { ArrowRight, CheckCircle, KeyRound, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SigninForm() {
  const [identifier, setIdentifier] = useState("admin@crmproduct.local");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const identifierInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      identifierInputRef.current?.focus();
    }, 50);

    return () => window.clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      setFormError("Enter your email/mobile and password.");
      identifierInputRef.current?.focus();
      return;
    }

    setFormError("");
    setIsLoading(true);

    try {
      await login(identifier.trim(), password);
      setIsLoading(false);
      setIsSuccess(true);
      window.setTimeout(() => router.push("/dashboard"), 500);
    } catch (error) {
      setIsLoading(false);
      setFormError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };


  if (isSuccess) {
    return (
      <div className="w-full max-w-md text-center space-y-4 bg-white p-12 rounded-xl shadow-lg border border-border animate-in zoom-in-95">
        <CheckCircle className="h-16 w-16 text-accent mx-auto animate-bounce" />
        <h2 className="text-2xl font-bold text-primary">Login Successful!</h2>
        <p className="text-secondary font-medium">Accessing your operations dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-2xl border border-border animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tighter text-primary uppercase">Welcome Back</h2>
        <p className="mt-2 text-sm text-secondary font-medium">Sign in with your CRM account</p>
      </div>

      <div className="mt-8">
        <form className="space-y-5" onSubmit={handleLogin}>
          <Input
            ref={identifierInputRef}
            label="Email or mobile"
            value={identifier}
            autoComplete="username"
            required
            showEditIcon
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (formError) setFormError("");
            }}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            autoComplete="current-password"
            required
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError("");
            }}
          />
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {formError}
            </div>
          )}
          <Button type="submit" className="w-full group bg-primary h-12" isLoading={isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            Sign In
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
            <KeyRound className="h-3.5 w-3.5" />
            Secure backend authentication
          </div>
        </form>
      </div>
    </div>
  );
}
