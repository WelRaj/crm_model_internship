"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { login, requestPasswordReset, resetPassword } from "@/services/auth-api";
import { ArrowLeft, ArrowRight, CheckCircle, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type AuthMode = "signin" | "forgot" | "reset";

export default function SigninForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [identifier, setIdentifier] = useState("admin@crmproduct.local");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
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

  const clearFeedback = () => {
    setFormError("");
    setFormMessage("");
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setDevOtp("");
    clearFeedback();
    window.setTimeout(() => identifierInputRef.current?.focus(), 50);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setFormError("Enter your email or mobile number.");
      identifierInputRef.current?.focus();
      return;
    }

    clearFeedback();
    setIsLoading(true);

    try {
      const result = await requestPasswordReset(identifier.trim());
      setIsLoading(false);
      setMode("reset");
      setDevOtp(result.otp || "");
      setFormMessage(
        result.otp
          ? "OTP generated for local testing. Enter it below with your new password."
          : "If this account exists, a reset OTP has been sent."
      );
    } catch (error) {
      setIsLoading(false);
      setFormError(error instanceof Error ? error.message : "Unable to start password reset.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || otp.length !== 6 || !newPassword || !confirmPassword) {
      setFormError("Enter identifier, 6-digit OTP, new password, and confirm password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("New password and confirm password do not match.");
      return;
    }

    clearFeedback();
    setIsLoading(true);

    try {
      await resetPassword(identifier.trim(), otp, newPassword);
      setIsLoading(false);
      setMode("signin");
      setPassword("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setDevOtp("");
      setFormMessage("Password reset successful. Sign in with your new password.");
    } catch (error) {
      setIsLoading(false);
      setFormError(error instanceof Error ? error.message : "Unable to reset password.");
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
        <h2 className="text-3xl font-black tracking-tighter text-primary uppercase">
          {mode === "signin" ? "Welcome Back" : mode === "forgot" ? "Reset Password" : "Verify OTP"}
        </h2>
        <p className="mt-2 text-sm text-secondary font-medium">
          {mode === "signin"
            ? "Sign in with your CRM account"
            : mode === "forgot"
              ? "Enter your email or mobile to receive OTP"
              : "Set a new password for your CRM account"}
        </p>
      </div>

      <div className="mt-8">
        {mode === "signin" ? (
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
              if (formError || formMessage) clearFeedback();
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
              if (formError || formMessage) clearFeedback();
            }}
          />
          {formMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {formMessage}
            </div>
          )}
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
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            className="w-full text-center text-xs font-black uppercase tracking-widest text-primary hover:underline"
          >
            Forgot password?
          </button>
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
            <KeyRound className="h-3.5 w-3.5" />
            Secure backend authentication
          </div>
        </form>
        ) : mode === "forgot" ? (
        <form className="space-y-5" onSubmit={handleForgotPassword}>
          <Input
            ref={identifierInputRef}
            label="Email or mobile"
            value={identifier}
            autoComplete="username"
            required
            showEditIcon
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (formError || formMessage) clearFeedback();
            }}
          />
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {formError}
            </div>
          )}
          <Button type="submit" className="w-full group bg-primary h-12" isLoading={isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            Send Reset OTP
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="flex w-full items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </button>
        </form>
        ) : (
        <form className="space-y-5" onSubmit={handleResetPassword}>
          <Input
            ref={identifierInputRef}
            label="Email or mobile"
            value={identifier}
            autoComplete="username"
            required
            showEditIcon
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (formError || formMessage) clearFeedback();
            }}
          />
          {devOtp && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              <span>Local testing OTP</span>
              <span className="font-black tracking-widest">{devOtp}</span>
            </div>
          )}
          <Input
            label="OTP"
            value={otp}
            inputMode="numeric"
            maxLength={6}
            required
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (formError || formMessage) clearFeedback();
            }}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            autoComplete="new-password"
            required
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (formError || formMessage) clearFeedback();
            }}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            required
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (formError || formMessage) clearFeedback();
            }}
          />
          {formMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {formMessage}
            </div>
          )}
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {formError}
            </div>
          )}
          <Button type="submit" className="w-full group bg-primary h-12" isLoading={isLoading}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Reset Password
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-xs font-black uppercase tracking-widest text-primary hover:underline"
          >
            Resend OTP
          </button>
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="flex w-full items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
