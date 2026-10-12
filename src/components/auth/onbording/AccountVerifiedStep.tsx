"use client";

import successImage from "@/assets/Success.png";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AccountVerifiedStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
}

export default function AccountVerifiedStep({}: AccountVerifiedStepProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl">
      {/* Content */}
      <div className="flex flex-col items-center text-center py-8">
        {/* Checkmark Icon with Concentric Circles */}
        <div className="w-[100px] h-[100px] mb-10">
          <Image
            src={successImage}
            alt="Success Icon"
            className="object-contain w-full h-full "
            width={120}
            height={120}
          />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Account Verified Successfully!
        </h2>
        <p className="text-sm text-gray-600 mb-8 leading-relaxed max-w-sm">
          Your account is ready to use. You will be redirected to the home page
          in a few seconds
        </p>

        {/* Done Button */}
        <Button
          onClick={() => router.push("/")}
          className="w-full max-w-xs h-12 bg-gradient-to-r from-[#FF6EC7] to-[#FF8FDB] hover:from-[#FF5BB8] hover:to-[#FF7CCB] text-white font-medium rounded-full text-base shadow-lg"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
