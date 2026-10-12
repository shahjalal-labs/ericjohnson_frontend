"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserRegistrationMutation } from "@/redux/api/registerApi";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Added Loader2
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [googleLoading, setGoogleLoading] = useState(false);

  const [createUserFn] = useUserRegistrationMutation();

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic form validation
    if (!fullName || !email || !phone || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true); // Start loading

    try {
      const userData = {
        fullName,
        email,
        phoneNumber: phone,
        password,
      };

      const response = await createUserFn(userData).unwrap();
      console.log("User created successfully:", response);

      if (response.success) {
        toast.success(
          "Account created successfully! Please check your email for verification."
        );
        router.push(`/verification?email=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      console.error("Error creating user:", error);

      // Show specific error messages if available
      if (error?.data?.message) {
        toast.error(error.data.message);
      } else if (error?.status === 409) {
        toast.error("User with this email already exists");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Handle Google Login with redirect preservation
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    // Disable other inputs during Google login
    localStorage.setItem("googleSignIn", "true");

    try {
      await signIn("google", {
        callbackUrl: "/",
        redirect: true,
      });
      // Note: signIn will redirect, so we don't need to set loading to false here
      // If it fails, the catch block will handle it
    } catch (err) {
      console.error("Google login error:", err);
      toast.error("Google login failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  // Check if either form or Google is loading
  const isAnyLoading = isLoading || isLoading || googleLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030911] relative overflow-hidden p-4">
      {/* Gradient blur background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6EC7] rounded-full blur-[150px] opacity-40" />
      </div>

      {/* Signup Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Create Your Account
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Create account and enjoy all services
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-900"
            >
              Full Name
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-12 rounded-xl border-gray-200 bg-gray-50/50 px-4 placeholder:text-gray-400"
              disabled={isLoading} // Disable input when loading
            />
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl border-gray-200 bg-gray-50/50 px-4 placeholder:text-gray-400"
              disabled={isLoading} // Disable input when loading
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-900"
            >
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-12 rounded-xl border-gray-200 bg-gray-50/50 px-4 placeholder:text-gray-400"
              disabled={isLoading} // Disable input when loading
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-900"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="• • • • • •"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 rounded-xl border-gray-200 bg-gray-50/50 px-4 pr-12 placeholder:text-gray-400"
                disabled={isLoading} // Disable input when loading
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading} // Disable button when loading
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Sign Up Button with Loading */}
          <Button
            type="submit"
            disabled={isLoading} // Disable button when loading
            className="w-full h-12 bg-[#FF6EC7] hover:bg-[#FF7CCB] text-white font-medium rounded-full text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Or login with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium text-gray-900">
                    Connecting to Google...
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">
                    Continue with Google
                  </span>
                </>
              )}
            </Button>

            {/* <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="h-12 rounded-xl border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">
                Continue with Apple
              </span>
            </Button> */}
          </div>

          {/* Log In Link */}
          <p className="text-center text-sm text-gray-600">
            Have an account?{" "}
            <Link
              href="/login"
              className={`font-medium text-[#FF6EC7] hover:text-[#FF5BB8] ${
                isLoading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
