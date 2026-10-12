"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messaging } from "@/lib/firebase";
import { useUserLoginMutation } from "@/redux/api/registerApi";
import { Modal } from "antd";
import { getToken, Messaging } from "firebase/messaging";
import Cookies from "js-cookie";
import { Bell, Eye, EyeOff, Loader2 } from "lucide-react"; // Added Loader2
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ensureFirebaseMessagingServiceWorker = async () => {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;

  // Service workers require a secure context (HTTPS) except on localhost.
  // If this throws, Firebase will later surface messaging/failed-service-worker-registration.
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/" }
  );

  // Ensure it's activated and controlling the page.
  await navigator.serviceWorker.ready;
  return registration;
};

const requestPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    try {
      if (!messaging) {
        throw new Error(
          "Firebase Messaging is not available in this browser/context"
        );
      }

      const serviceWorkerRegistration =
        await ensureFirebaseMessagingServiceWorker();

      const token = await getToken(messaging as Messaging, {
        vapidKey:
          "BB1PX6pQC8_xasY8--bagFVCPXe-0yeyhuVG9C5_QxO7mo9ImFHdXZSIgJezqEs2eVpGLef-dFtpWvPGhmD9S0M",
        ...(serviceWorkerRegistration
          ? { serviceWorkerRegistration }
          : undefined),
      });
      return token;
    } catch (err) {
      console.error("Error getting FCM token:", err);
      throw err;
    }
  } else {
    throw new Error("Notification permission denied");
  }
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Added loading state
  const [googleLoading, setGoogleLoading] = useState(false);

  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [, setNotificationEnabled] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [, setNotificationStatus] = useState<
    "pending" | "granted" | "denied" | "skipped"
  >("pending");

  const [loginUserFn, {isLoading}] = useUserLoginMutation();

  const isIOS = () =>
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const isNotificationSupported = () =>
    typeof window !== "undefined" && "Notification" in window;

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      const redirectUrl = "/"; // Default redirect URL
      window.location.href = redirectUrl;
    }
  }, []);

  // Check notification permission status on component mount
  useEffect(() => {
    if (isIOS()) {
      // iOS → skip notifications completely
      setNotificationModalVisible(false);
      return;
    }

    if (!isNotificationSupported()) return;

    if (Notification.permission === "default") {
      setNotificationModalVisible(true);
      setNotificationStatus("pending");
    } else if (Notification.permission === "granted") {
      setNotificationEnabled(true);
      setNotificationStatus("granted");
      getFcmToken();
    } else {
      setNotificationStatus("denied");
    }
  }, []);

  const getFcmToken = async () => {
    try {
      if (!messaging) return null;

      const serviceWorkerRegistration =
        await ensureFirebaseMessagingServiceWorker();

      const token = await getToken(messaging as Messaging, {
        vapidKey:
          "BB1PX6pQC8_xasY8--bagFVCPXe-0yeyhuVG9C5_QxO7mo9ImFHdXZSIgJezqEs2eVpGLef-dFtpWvPGhmD9S0M",
        ...(serviceWorkerRegistration
          ? { serviceWorkerRegistration }
          : undefined),
      });
      setFcmToken(token);
      return token;
    } catch (err) {
      console.error("Error getting FCM token:", err);
      setFcmToken(null);
      return null;
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const token = await requestPermission();
      if (token) {
        setNotificationEnabled(true);
        setFcmToken(token);
        Cookies.set("fcmToken", token);
        setNotificationStatus("granted");
        toast.success("Notifications enabled successfully!");
      }
    } catch (err) {
      console.error("Failed to enable notifications:", err);
      setFcmToken(null);
      setNotificationStatus("denied");
      toast.error(
        "Failed to enable notifications. Please check your browser settings."
      );
    } finally {
      setNotificationModalVisible(false);
    }
  };

  const handleSkipNotifications = () => {
    setNotificationModalVisible(false);
    setFcmToken(null);
    setNotificationStatus("skipped");
    toast.info("You will not get notify for any notification");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoggingIn(true); // Start loading

    try {
      const response = await loginUserFn({
        email: email,
        password: password,
        fcmToken: fcmToken,
      }).unwrap();

      if (response?.success) {
        Cookies.set("accessToken", response?.result?.accessToken);
        toast.success("Login successfully");

        // Get the appropriate redirect URL
        // const redirectUrl = getRedirectUrl();
        // console.log("Redirecting to:", redirectUrl);

        // Use window.location.href for complete page reload and state reset
        window.location.href = "/";
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Login Failed");
    } finally {
      setIsLoggingIn(false); // Stop loading regardless of success/error
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
  const isAnyLoading = isLoggingIn || googleLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030911] relative overflow-hidden p-4">
      {/* notification modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#54BB52]" />
            <span>Enable Notifications</span>
          </div>
        }
        open={notificationModalVisible}
        onCancel={handleSkipNotifications}
        footer={[
          <Button
            key="skip"
            variant="outline"
            onClick={handleSkipNotifications}
            disabled={isAnyLoading}
          >
            Skip for Now
          </Button>,
          <Button
            key="enable"
            onClick={handleEnableNotifications}
            className="bg-primary text-white ml-3"
            disabled={isAnyLoading}
          >
            Enable Notifications
          </Button>,
        ]}
        className="rounded-lg"
      >
        <div className="py-4">
          <p className="text-gray-700 mb-2">
            Stay updated with important alerts and messages by enabling
            notifications.
          </p>
          <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-md">
            <Bell className="h-5 w-5 text-[#54BB52] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#54BB52]">
                What to expect:
              </p>
              <ul className="text-xs text-[#54BB52] mt-1 list-disc pl-4">
                <li>Important account notifications</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            You can not get notify for any notification.
          </p>
        </div>
      </Modal>
      {/* Gradient blur background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6EC7] rounded-full blur-[150px] opacity-40" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Log In
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
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
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl border-gray-200 bg-gray-50/50 px-4 placeholder:text-gray-400"
              disabled={isAnyLoading} // Disable input during any loading
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
                disabled={isAnyLoading} // Disable input during any loading
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAnyLoading} // Disable button during any loading
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link
              href="/reset-password"
              className="text-sm font-medium text-gray-900 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => isAnyLoading && e.preventDefault()} // Prevent navigation during any loading
            >
              Forgot password?
            </Link>
          </div>

          {/* Log In Button */}
          <Button
            type="submit"
            disabled={isAnyLoading} // Disable button during any loading
            className="w-full h-12 bg-[#FF6EC7] hover:bg-[#FF7CCB] text-white font-medium rounded-full text-base shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log In"
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

            {/* Apple Login Button (commented out) */}
            {/* <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAnyLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">
                Continue with Apple
              </span>
            </Button> */}
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600">
            Have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#FF6EC7] hover:text-[#FF5BB8] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => isAnyLoading && e.preventDefault()} // Prevent navigation during any loading
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
