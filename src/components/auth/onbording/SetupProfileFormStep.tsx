"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { setProfileInfo } from "@/redux/allSlice/onboardingSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { ArrowLeft, FileEdit } from "lucide-react";
import { useState } from "react";
import VicesModal from "./VicesModal";

interface SetupProfileFormStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
}

export default function SetupProfileFormStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: SetupProfileFormStepProps) {
  const dispatch = useAppDispatch();
  const profileInfo = useAppSelector((state) => state.onboarding.profileInfo);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVicesModal, setShowVicesModal] = useState(false);
  const [tempVices, setTempVices] = useState(profileInfo.vices.value);
  const [tempDate, setTempDate] = useState(
    profileInfo.dob.value ? profileInfo.dob.value.split("T")[0] : ""
  );

  // Define all form fields with their Redux field names
  const formFields = [
    {
      id: "fullName",
      label: "Full Name",
      type: "input" as const,
      placeholder: "Type full name",
      required: true,
    },
    {
      id: "dob",
      label: "Date of Birth",
      type: "date" as const,
      placeholder: "Select your date of birth",
      required: true,
    },
    {
      id: "gender",
      label: "Gender",
      type: "select" as const,
      placeholder: "Select your gender",
      options: [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
        { value: "Other", label: "Other" }, 
      ],
      required: true,
    },
    {
      id: "location",
      label: "Location",
      type: "input" as const,
      placeholder: "Type your location",
      required: true,
    },
    {
      id: "education",
      label: "Education",
      type: "select" as const,
      placeholder: "Select education",
      options: [
        { value: "high-school", label: "High School" },
        { value: "bachelors", label: "Bachelor's Degree" },
        { value: "masters", label: "Master's Degree" },
        { value: "phd", label: "PhD" },
      ],
      required: true,
    },
    {
      id: "religiousBeliefs",
      label: "Religious Beliefs",
      type: "select" as const,
      placeholder: "Select religion",
      options: [
        { value: "christian", label: "Christian" },
        { value: "muslim", label: "Muslim" },
        { value: "hindu", label: "Hindu" },
        { value: "buddhist", label: "Buddhist" },
        { value: "other", label: "Other" },
      ],
      required: true,
    },
    {
      id: "profession",
      label: "Profession",
      type: "input" as const,
      placeholder: "Enter your Profession",
      required: true,
    },
    {
      id: "politics",
      label: "Politics",
      type: "select" as const,
      placeholder: "Select politics stance",
      options: [
        { value: "liberal", label: "Liberal" },
        { value: "conservative", label: "Conservative" },
        { value: "moderate", label: "Moderate" },
        { value: "other", label: "Other" },
      ],
      required: true,
    },
    {
      id: "languageSpoken",
      label: "Language Spoken",
      type: "select" as const,
      placeholder: "Select language",
      options: [
        { value: "english", label: "English" },
        { value: "spanish", label: "Spanish" },
        { value: "french", label: "French" },
        { value: "other", label: "Other" },
      ],
      required: true,
    },
    {
      id: "datingIntentions",
      label: "Dating Intentions",
      type: "select" as const,
      placeholder: "Select intents",
      options: [
        { value: "casual", label: "Casual Dating" },
        { value: "serious", label: "Serious Relationship" },
        { value: "marriage", label: "Marriage" },
      ],
      required: true,
    },
    {
      id: "height",
      label: "Height",
      type: "select" as const,
      placeholder: "Select height",
      options: [
        { value: "5-0", label: "5'0\"" },
        { value: "5-6", label: "5'6\"" },
        { value: "6-0", label: "6'0\"" },
      ],
      required: true,
    },
    {
      id: "ethnicity",
      label: "Ethnicity",
      type: "select" as const,
      placeholder: "Select ethnicity",
      options: [
        { value: "asian", label: "Asian" },
        { value: "black", label: "Black" },
        { value: "white", label: "White" },
        { value: "hispanic", label: "Hispanic" },
      ],
      required: true,
    },
    {
      id: "children",
      label: "Children",
      type: "select" as const,
      placeholder: "Select children",
      options: [
        { value: "none", label: "None" },
        { value: "one", label: "One" },
        { value: "two-plus", label: "Two or more" },
      ],
      required: true,
    },
    {
      id: "familyPlans",
      label: "Family Plans",
      type: "select" as const,
      placeholder: "Select family plans",
      options: [
        { value: "yes", label: "Want children" },
        { value: "no", label: "Don't want children" },
        { value: "maybe", label: "Not sure" },
      ],
      required: true,
    },
    {
      id: "bio",
      label: "Bio",
      type: "textarea" as const,
      placeholder: "Say something about you...",
      required: true,
    },
  ];

  const handleFieldChange = (
    fieldId: keyof typeof profileInfo,
    value: string
  ) => {
    dispatch(
      setProfileInfo({
        field: fieldId,
        value,
        visible: profileInfo[fieldId]?.visible ?? true,
      })
    );

    // Clear error for this field if value is provided
    if (value.trim() && errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: "" }));
    }
  };

  // Special handler for date field
  const handleDateChange = (dateString: string) => {
    // Update local state for the input
    setTempDate(dateString);
    
    if (dateString) {
      // Convert to ISO format with time at 00:00:00.000Z
      const dateObj = new Date(dateString);
      const isoDate = dateObj.toISOString(); // This gives format: "1993-07-10T00:00:00.000Z"
      
      dispatch(
        setProfileInfo({
          field: "dob",
          value: isoDate,
          visible: profileInfo.dob?.visible ?? true,
        })
      );

      // Clear error if exists
      if (errors.dob) {
        setErrors((prev) => ({ ...prev, dob: "" }));
      }
    }
  };

  const handleVisibilityChange = (
    fieldId: keyof typeof profileInfo,
    checked: boolean
  ) => {
    dispatch(
      setProfileInfo({
        field: fieldId,
        value: profileInfo[fieldId]?.value || "",
        visible: checked,
      })
    );
  };

  const handleOpenVicesModal = () => {
    setTempVices(profileInfo.vices.value);
    setShowVicesModal(true);
  };

  const handleSaveVices = (vices: {
    Alcohol: string;
    Smoking: string;
    Marijuana: string;
    Drugs: string;
  }) => {
    dispatch(
      setProfileInfo({
        field: "vices",
        value: vices,
        visible: profileInfo.vices.visible,
      })
    );
    setShowVicesModal(false);
  };

  const getVicesDisplayText = () => {
    const vices = profileInfo.vices.value;
    const selectedVices = [];

    if (vices.Alcohol !== "No") selectedVices.push(`Alcohol: ${vices.Alcohol}`);
    if (vices.Smoking !== "No") selectedVices.push(`Smoking: ${vices.Smoking}`);
    if (vices.Marijuana !== "No")
      selectedVices.push(`Marijuana: ${vices.Marijuana}`);
    if (vices.Drugs !== "No") selectedVices.push(`Drugs: ${vices.Drugs}`);

    return selectedVices.length > 0
      ? selectedVices.join(", ")
      : "No vices selected";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    formFields.forEach((field) => {
      if (field.id === "dob") {
        const dobValue = profileInfo.dob.value;
        if (field.required && !dobValue.trim()) {
          newErrors[field.id] = `${field.label} is required`;
        } else if (dobValue) {
          // Validate date is not in the future
          const dateObj = new Date(dobValue);
          const today = new Date();
          if (dateObj > today) {
            newErrors[field.id] = "Date of birth cannot be in the future";
          }
        }
      } else {
        const fieldValue =
          profileInfo[field.id as keyof typeof profileInfo]?.value || "";
        if (
          field.required &&
          typeof fieldValue === "string" &&
          !fieldValue.trim()
        ) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const renderField = (field: (typeof formFields)[0]) => {
    const fieldData = profileInfo[field.id as keyof typeof profileInfo];
    const value = fieldData?.value || "";
    const isVisible = fieldData?.visible ?? true;
    const error = errors[field.id];

    if (field.type === "date") {
      return (
        <div key={field.id}>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          <input
            type="date"
            placeholder={field.placeholder}
            className={`w-full rounded-full h-12 px-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 ${
              error ? "border-red-500" : ""
            }`}
            value={tempDate}
            onChange={(e) => handleDateChange(e.target.value)}
            max={new Date().toISOString().split("T")[0]} // Prevent future dates
          />

          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                checked={isVisible}
                onChange={(e) =>
                  handleVisibilityChange(field.id as any, e.target.checked)
                }
              />
              Visible on profile
            </label>
          </div>
        </div>
      );
    }

    return (
      <div key={field.id}>
        <Label className="text-sm font-medium text-gray-900 mb-2 block">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {field.type === "input" && (
          <Input
            placeholder={field.placeholder}
            className={`rounded-full h-12 ${error ? "border-red-500" : ""}`}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => handleFieldChange(field.id as any, e.target.value)}
          />
        )}

        {field.type === "select" && (
          <Select
            value={typeof value === "string" ? value : ""}
            onValueChange={(val) => handleFieldChange(field.id as any, val)}
          >
            <SelectTrigger
              className={`rounded-full h-12 ${error ? "border-red-500" : ""}`}
            >
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options!.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === "textarea" && (
          <textarea
            placeholder={field.placeholder}
            className={`w-full rounded-2xl border border-gray-200 p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-pink-400 ${
              error ? "border-red-500" : ""
            }`}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => handleFieldChange(field.id as any, e.target.value)}
          />
        )}

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

        <div className="pt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              checked={isVisible}
              onChange={(e) =>
                handleVisibilityChange(field.id as any, e.target.checked)
              }
            />
            Visible on profile
          </label>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Scrollable Content */}
        <div className="p-6 max-h-[95vh] overflow-y-auto">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Header */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Set Up Profile
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
                  <FileEdit className="w-5 h-5 text-white" />
                )}
              </div>
            ))}
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            {formFields.map(renderField)}

            {/* Custom Vices Field */}
            <div>
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                Vices
                <span className="text-red-500 ml-1">*</span>
              </Label>

              <button
                type="button"
                onClick={handleOpenVicesModal}
                className="w-full rounded-full h-12 px-4 border border-gray-200 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-700">{getVicesDisplayText()}</span>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    checked={profileInfo.vices.visible}
                    onChange={(e) =>
                      handleVisibilityChange("vices", e.target.checked)
                    }
                  />
                  Visible on profile
                </label>
              </div>
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
      </div>

      {/* Vices Modal */}
      <VicesModal
        isOpen={showVicesModal}
        onClose={() => setShowVicesModal(false)}
        onSave={handleSaveVices}
        currentVices={tempVices}
      />
    </>
  );
}