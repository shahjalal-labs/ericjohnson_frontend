"use client";

import { Button } from "@/components/ui/button";
import { setDatingPreferences } from "@/redux/allSlice/onboardingSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { ArrowLeft, Heart } from "lucide-react";
import { useState } from "react";

interface DatingPreferencesStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
}

export default function DatingPreferencesStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: DatingPreferencesStepProps) {
  const dispatch = useAppDispatch();
  const datingPreferences = useAppSelector(
    (state) => state.onboarding.datingPreferences
  );

  const [selected, setSelected] = useState<string>(
    datingPreferences.interestedIn.value || "woman"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const options = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Others", label: "Others" },
  ];

  const handleSelectionChange = (value: string) => {
    setSelected(value);
    dispatch(
      setDatingPreferences({
        field: "interestedIn",
        value,
        visible: true,
      })
    );
    // Clear error if exists
    if (errors.interestedIn) {
      setErrors((prev) => ({ ...prev, interestedIn: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selected) {
      newErrors.interestedIn = "Please select who you're interested in";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Dating Preferences
      </h1>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`transition-all duration-300 ${
              index + 1 === currentStep
                ? "w-10 h-10 bg-gradient-to-br from-[#FF6EC7] to-[#FF8FDB] rounded-full flex items-center justify-center shadow-md"
                : index + 1 < currentStep
                ? "w-3 h-3 bg-[#FF6EC7] rounded-full"
                : "w-3 h-3 bg-gray-300 rounded-full"
            }`}
          >
            {index + 1 === currentStep && (
              <Heart className="w-5 h-5 text-white fill-white" />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Interested In
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Select who you're interested in dating
        </p>

        {errors.interestedIn && (
          <p className="text-red-500 text-sm mb-4">{errors.interestedIn}</p>
        )}

        <div className="space-y-4">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelectionChange(option.value)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-colors ${
                selected === option.value
                  ? "border-[#FF6EC7] bg-pink-50"
                  : "border-gray-100 hover:border-pink-200"
              }`}
            >
              <span className="text-gray-900 font-medium">{option.label}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected === option.value
                    ? "border-[#FF6EC7] bg-[#FF6EC7]"
                    : "border-gray-300"
                }`}
              >
                {selected === option.value && (
                  <div className="w-3 h-3 rounded-full bg-white" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <Button
        onClick={handleNext}
        className="w-full h-12 bg-gradient-to-r from-[#FF6EC7] to-[#FF8FDB] hover:from-[#FF5BB8] hover:to-[#FF7CCB] text-white font-medium rounded-full text-base shadow-lg"
      >
        Next
      </Button>
    </div>
  );
}
