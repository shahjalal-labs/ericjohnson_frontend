"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { useUserVerifyOtpMutation } from "@/redux/api/registerApi";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react"; // Added Loader2
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function VerificationPage() {
  const [code, setCode] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [userVerifyOtpFn] = useUserVerifyOtpMutation();

  const handleChange = (index: number, value: string) => {
    if (value.length > 1 || isLoading) return; // Prevent input when loading

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (isLoading) return; // Prevent keyboard interactions when loading
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all digits are filled
    if (code.some((digit) => digit === "")) {
      toast.error("Please enter the complete verification code");
      return;
    }

    setIsLoading(true);

    try {
      const response = await userVerifyOtpFn({
        email,
        otp: code.join(""),
      }).unwrap();

      if (response.success) {
        Cookies.set("accessToken", response?.result?.accessToken);
        toast.success("Verification successful! Redirecting...");
        router.push("/flow");
      }
    } catch (error: any) {
      console.error("Verification error:", error);

      // Show specific error messages
      if (error?.data?.message) {
        toast.error(error.data.message);
      } else if (error?.status === 400) {
        toast.error("Invalid verification code");
      } else if (error?.status === 404) {
        toast.error("User not found");
      } else {
        toast.error("Verification failed. Please try again.");
      }

      // Clear the code for re-entry
      setCode(["", "", "", ""]);
      inputRefs.current[0]?.focus(); // Focus first input for re-entry
    } finally {
      setIsLoading(false);
    }
  };

  // Handle paste event for OTP
  const handlePaste = (e: React.ClipboardEvent) => {
    if (isLoading) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split("");
      while (newCode.length < 4) newCode.push("");
      setCode(newCode);

      // Focus the next empty input or last input
      const nextIndex = Math.min(pastedData.length, 3);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030911] relative overflow-hidden p-4">
      {/* Gradient blur background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6EC7] rounded-full blur-[150px] opacity-40" />
      </div>

      {/* Verification Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Verification code
        </h1>
        <p className="text-center text-sm text-gray-500 mb-8">
          We sent a four digit code to your email address
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Input */}
          <div className="flex justify-center gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined} // Only handle paste on first input
                disabled={isLoading} // Disable inputs when loading
                className={`w-14 h-14 text-center text-xl font-semibold rounded-xl border-2 ${
                  digit
                    ? "border-gray-200 bg-gray-50/50"
                    : index === code.findIndex((d) => !d)
                    ? "border-[#FF6EC7] bg-pink-50/30"
                    : "border-gray-200 bg-gray-50/50"
                } focus:outline-none focus:border-[#FF6EC7] focus:ring-2 focus:ring-[#FF6EC7]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          {/* Submit Button with Loading */}
          <Button
            type="submit"
            disabled={isLoading || code.some((digit) => digit === "")}
            className="w-full h-12 bg-[#FF6EC7] hover:bg-[#FF7CCB] text-white font-medium rounded-full text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Submit"
            )}
          </Button>

          {/* Alternative button style - Just spinner without text */}
          {/* <Button
            type="submit"
            disabled={isLoading || code.some(digit => digit === "")}
            className="w-full h-12 bg-[#FF6EC7] hover:bg-[#FF7CCB] text-white font-medium rounded-full text-base shadow-lg disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Submit"
            )}
          </Button> */}

          {/* Resend Code Section */}
          {/* <div className="text-center">
           
            <p className="text-sm text-gray-500 mb-2">
              Didn&apos;t receive the code?
            </p>
            <button
              type="button"
              onClick={() => {
              
                toast.info("Resend functionality to be implemented");
              }}
              disabled={isLoading}
              className="text-sm font-medium text-[#FF6EC7] hover:text-[#FF5BB8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend code
            </button>
          </div> */}

          {/* Help Text */}
          <p className="text-center text-sm text-gray-500">
            Can&apos;t find the email? Check your spam folder.
          </p>
        </form>
      </div>
    </div>
  );
}
