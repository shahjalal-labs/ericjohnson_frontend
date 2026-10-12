"use client";

import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function AllowAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030911] relative overflow-hidden p-4">
      {/* Gradient blur background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6EC7] rounded-full blur-[150px] opacity-40" />
      </div>

      {/* Permission Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl">
        {/* Map Icon with Concentric Circles */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Outer circle */}
            <div className="absolute inset-0 w-40 h-40 bg-[#FF6EC7]/20 rounded-full animate-pulse" />
            {/* Middle circle */}
            <div className="absolute inset-0 w-40 h-40 flex items-center justify-center">
              <div className="w-32 h-32 bg-[#FF6EC7]/30 rounded-full" />
            </div>
            {/* Inner circle */}
            <div className="absolute inset-0 w-40 h-40 flex items-center justify-center">
              <div className="w-24 h-24 bg-[#FF6EC7]/40 rounded-full" />
            </div>
            {/* Center with icon */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF6EC7] to-[#FF8FDB] rounded-full flex items-center justify-center shadow-lg">
                <MapPin className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Allow Access
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed px-4">
            To enjoy your experience Please allow us the following permissions.
            Enable Background Location - to give you ride request even if your
            app is in background
          </p>
        </div>

        {/* Allow Access Button */}
        <Button className="w-full h-12 bg-gradient-to-r from-[#FF6EC7] to-[#FF8FDB] hover:from-[#FF5BB8] hover:to-[#FF7CCB] text-white font-medium rounded-full text-base shadow-lg">
          Allow Access
        </Button>
      </div>
    </div>
  );
}
