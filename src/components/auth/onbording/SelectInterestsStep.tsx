"use client";

import { Button } from "@/components/ui/button";
import { setInterests } from "@/redux/allSlice/onboardingSlice";
import { useSetupProfileMutation } from "@/redux/api/userApi";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SelectInterestsStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
}


const convertFeetInchToCm = (value?: string): number => {
  if (!value) return 0;

  const [feet, inches] = value.split("-").map(Number);

  if (isNaN(feet) || isNaN(inches)) return 0;

  const cm = feet * 30.48 + inches * 2.54;
  return Math.round(cm); // rounded for clean API value
};


export default function SelectInterestsStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: SelectInterestsStepProps) {
  const dispatch = useAppDispatch();
  const interestsData = useAppSelector((state) => state.onboarding.interests);
  const onboardingData = useAppSelector((state) => state.onboarding);
  
  const [selected, setSelected] = useState<string[]>(
    interestsData.selectedInterests.value || ["karaoke", "sports"]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [setupProfileFn] = useSetupProfileMutation();

  const interests = [
    { value: "travel", label: "Travel", icon: "✈️" },
    { value: "shopping", label: "Shopping", icon: "🛍️" },
    { value: "astrology", label: "Astrology", icon: "⭐" },
    { value: "music", label: "Music", icon: "🎵" },
    { value: "yoga", label: "Yoga", icon: "🧘" },
    { value: "swimming", label: "Swimming", icon: "🏊" },
    { value: "running", label: "Running", icon: "🏃" },
    { value: "photography", label: "Photography", icon: "📷" },
    { value: "hiking", label: "Hiking", icon: "🥾" },
    { value: "wine", label: "Wine", icon: "🍷" },
    { value: "karaoke", label: "Karaoke", icon: "🎤" },
    { value: "sports", label: "Sports", icon: "⚽" },
    { value: "beer", label: "Beer", icon: "🍺" },
    { value: "board-games", label: "Board Games", icon: "🎲" },
    { value: "working-out", label: "Working Out", icon: "💪" },
    { value: "fashion", label: "Fashion", icon: "👗" },
    { value: "videogames", label: "Videogames", icon: "🎮" },
    { value: "dancing", label: "Dancing", icon: "💃" },
    { value: "coffee", label: "Coffee", icon: "☕" },
    { value: "instagram", label: "Instagram", icon: "📱" },
    { value: "media", label: "Media", icon: "📰" },
    { value: "politics", label: "Politics", icon: "🗳️" },
    { value: "art", label: "Art", icon: "🎨" },
    { value: "writing", label: "Writing", icon: "✍️" },
    { value: "cooking", label: "Cooking", icon: "🍳" },
    { value: "outdoors", label: "Outdoors", icon: "🌲" },
    { value: "tea", label: "Tea", icon: "🍵" },
    { value: "gardening", label: "Gardening", icon: "🌺" },
  ];

  const toggleSelection = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];

    setSelected(newSelected);

    // Update Redux immediately
    dispatch(
      setInterests({
        value: newSelected,
        visible: true,
      })
    );

    if (errors.interests) {
      setErrors((prev) => ({ ...prev, interests: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selected.length === 0) {
      newErrors.interests = "Please select at least one interest";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to format data according to API requirements
  const formatDataForApi = () => {
    const { profileInfo, datingPreferences, relationship, ethnicity, religion, interests } = onboardingData;

    return {
      fullName: profileInfo.fullName.value || "",
      phoneNumber: "0174564554", // Get from user context
      gender: profileInfo.gender.value || "",
      visibleGender: profileInfo.gender.visible,
      dob: profileInfo.dob.value || "", // Get from user context
      visibleDob: profileInfo.dob.visible,
      profession: profileInfo.profession.value || "",
      visibleProfession: profileInfo.profession.visible,
      bio: profileInfo.bio.value || "",
      visibleBio: profileInfo.bio.visible,
      address: profileInfo.location.value || "",
      visibleAddress: profileInfo.location.visible,
      religiousBeliefs: profileInfo.religiousBeliefs.value || "",
      visibleReligiousBeliefs: profileInfo.religiousBeliefs.visible,
      politics: profileInfo.politics.value || "",
      visiblePolitics: profileInfo.politics.visible,
      languages: profileInfo.languageSpoken.value || "",
      visibleLanguages: profileInfo.languageSpoken.visible,
      intention: profileInfo.datingIntentions.value || "",
      visibleIntention: profileInfo.datingIntentions.visible,
     height: convertFeetInchToCm(profileInfo.height.value),
      visibleHeight: profileInfo.height.visible,
      myEthnicity: profileInfo.ethnicity.value || "",
      visibleMyEthnicity: profileInfo.ethnicity.visible,
      myChildren: profileInfo.children.value || "",
      visibleMyChildren: profileInfo.children.visible,
      familyPlans: profileInfo.familyPlans.value || "",
      visibleFamilyPlans: profileInfo.familyPlans.visible,
      vices: [
        { Alcohol: "No" },
        { Smoking: "No" },
        { Marijuana: "No" },
        { Drugs: "No" }
      ],
      visibleVices: profileInfo.vices.visible,
      maxDistance: 50,
      interestedIn: datingPreferences.interestedIn.value as string || "",
      minAge: datingPreferences.preferredMinAge.value as number || 18,
      maxAge: datingPreferences.preferredMaxAge.value as number || 100,
      relationship: relationship.relationshipType.value[0] || "",
      ethinicity: ethnicity.ethnicPreferences.value || [],
      isEthnicityBreak: ethnicity.isDealbreaker || false,
      religion: religion.religiousPreferences.value || [],
      isReligionBreak: religion.isDealbreaker || false,
      interests: interests.selectedInterests.value || [],
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const dataToSubmit = formatDataForApi();
      console.log("Submitting data:", dataToSubmit);
      
      const response = await setupProfileFn(dataToSubmit).unwrap();
      console.log("API Response:", response);
      
      // Proceed to next step on success
      onNext();
    } catch (error: any) {
      console.error("Failed to submit:", error);
      setErrors((prev) => ({
        ...prev,
        submit: error?.data?.message || "Failed to submit profile data",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      handleSubmit();
    }
  };

  useEffect(() => {
    // Initialize with Redux data if available
    if (interestsData.selectedInterests.value.length > 0) {
      setSelected(interestsData.selectedInterests.value);
    }
  }, [interestsData.selectedInterests.value]);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900 transition-colors"
        disabled={isSubmitting}
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Select Interests
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

      {errors.interests && (
        <p className="text-red-500 text-sm mb-4">{errors.interests}</p>
      )}
      
      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-500 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Interests Grid */}
      <div className="flex flex-wrap gap-3 mb-8">
        {interests.map((interest) => (
          <button
            key={interest.value}
            onClick={() => toggleSelection(interest.value)}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
              selected.includes(interest.value)
                ? "bg-[#FF6EC7] border-[#FF6EC7] text-white"
                : "bg-white border-gray-200 text-gray-700 hover:border-pink-200"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span>{interest.icon}</span>
            <span className="text-sm font-medium">{interest.label}</span>
          </button>
        ))}
      </div>

      {/* Selection Count */}
      <div className="text-sm text-gray-500 mb-6 text-center">
        {selected.length} interest{selected.length !== 1 ? "s" : ""} selected
      </div>

      {/* Next Button */}
      <Button
        onClick={handleNext}
        disabled={isSubmitting}
        className="w-full h-12 bg-gradient-to-r from-[#FF6EC7] to-[#FF8FDB] hover:from-[#FF5BB8] hover:to-[#FF7CCB] text-white font-medium rounded-full text-base shadow-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Next"
        )}
      </Button>
    </div>
  );
}