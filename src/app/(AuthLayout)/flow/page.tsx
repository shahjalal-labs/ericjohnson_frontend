"use client";

import AccountVerifiedStep from "@/components/auth/onbording/AccountVerifiedStep";
import AgeRangeStep from "@/components/auth/onbording/AgeRangeStep";
import AllowAccessStep from "@/components/auth/onbording/AllowAccessStep";
import DatingPreferencesStep from "@/components/auth/onbording/DatingPreferencesStep";
import EthnicityStep from "@/components/auth/onbording/EthnicityStep";
import RelationshipStep from "@/components/auth/onbording/RelationshipStep";
import ReligionStep from "@/components/auth/onbording/ReligionStep";
import SelectInterestsStep from "@/components/auth/onbording/SelectInterestsStep";
import SetupProfileFormStep from "@/components/auth/onbording/SetupProfileFormStep";
import SetupProfilePhotoStep from "@/components/auth/onbording/SetupProfilePhotoStep";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const steps = [
  { id: 0, component: AllowAccessStep },
  { id: 1, component: SetupProfilePhotoStep },
  { id: 2, component: SetupProfileFormStep },
  { id: 3, component: DatingPreferencesStep },
  { id: 4, component: AgeRangeStep },
  { id: 5, component: RelationshipStep },
  { id: 6, component: EthnicityStep },
  { id: 7, component: ReligionStep },
  { id: 8, component: SelectInterestsStep },
  { id: 9, component: AccountVerifiedStep },
];

export default function OnboardingFlowPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const handleNext = () => {
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const CurrentStepComponent = steps[currentStep].component;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030911] relative overflow-hidden p-4">
      {/* Gradient blur background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6EC7] rounded-full blur-[150px] opacity-40" />
      </div>

      {/* Step Container */}
      <div className="relative w-full max-w-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <CurrentStepComponent
              currentStep={currentStep + 1}
              totalSteps={steps.length}
              onNext={handleNext}
              onBack={handleBack}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
