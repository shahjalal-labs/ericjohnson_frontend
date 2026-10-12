"use client";

import location from "@/assets/Location.png";
import { Button } from "@/components/ui/button";
import { useAddLocationMutation } from "@/redux/api/userApi";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface AllowAccessStepProps {
  onNext: () => void;
}

export default function AllowAccessStep({ onNext }: AllowAccessStepProps) {
  const [addLocationFn, { isLoading }] = useAddLocationMutation();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "granted" | "prompt" | "denied"
  >("idle");

  const getLocationAndSend = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await addLocationFn({
            latitude,
            longitude,
          }).unwrap();

          if (response.success) {
            toast.success("Location saved successfully!");
            onNext();
          }
        } catch (err: any) {
          setError(
            err?.data?.message || "Failed to save location. Please try again."
          );
        }
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(
            "Location access is blocked. Please enable it from browser settings."
          );
          setStatus("denied");
        } else {
          setError("Unable to fetch location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleAllowAccess = async () => {
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      setStatus(permission.state);

      if (permission.state === "granted") {
        getLocationAndSend();
      }

      if (permission.state === "prompt") {
        getLocationAndSend(); // browser popup appears here
      }

      if (permission.state === "denied") {
        setError(
          "Location permission is denied. Please enable it from browser settings."
        );
      }
    } catch {
      // fallback if Permissions API not supported
      getLocationAndSend();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl">
      <div className="flex flex-col items-center text-center">
        <div className="w-[280px] h-[280px] mb-10">
          <Image
            src={location}
            alt="Location Icon"
            className="object-contain w-full h-full"
            width={120}
            height={120}
          />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Allow Access</h2>

        <p className="text-sm text-gray-600 mb-4 leading-relaxed max-w-sm">
          We use your location to show nearby rides and services.
        </p>

        {status === "denied" && (
          <p className="text-xs text-orange-600 mb-3">
            Location access is blocked in your browser settings.
          </p>
        )}

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <Button
          onClick={handleAllowAccess}
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-[#FF6EC7] to-[#FF8FDB]
          hover:from-[#FF5BB8] hover:to-[#FF7CCB]
          text-white font-medium rounded-full text-base shadow-lg
          disabled:opacity-60"
        >
          {isLoading
            ? "Allowing Location..."
            : status === "granted"
            ? "Continue"
            : "Allow Access"}
        </Button>
      </div>
    </div>
  );
}
