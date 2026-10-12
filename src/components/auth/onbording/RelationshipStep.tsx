"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/redux/store"
import { setRelationshipType } from "@/redux/allSlice/onboardingSlice"


interface RelationshipStepProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export default function RelationshipStep({ currentStep, totalSteps, onNext, onBack }: RelationshipStepProps) {
  const dispatch = useAppDispatch()
  const relationship = useAppSelector((state) => state.onboarding.relationship)
  
  const [selected, setSelected] = useState<string[]>(relationship.relationshipType.value || ["non-monogamy"])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const options = [
    { value: "monogamy", label: "Monogamy" },
    { value: "non-monogamy", label: "Non-monogamy" },
    { value: "figuring-out", label: "Figuring out my relationship type" },
    { value: "open", label: "Open to all" },
    { value: "prefer-not", label: "Prefer not to say" },
  ]

  const handleSelectionChange = (value: string) => {
    // For this step, it seems like it should be single selection based on the design
    // But we'll support array for flexibility
    const newSelection = [value]
    setSelected(newSelection)
    
    dispatch(
      setRelationshipType({
        value: newSelection,
        visible: true,
      })
    )
    
    if (errors.relationship) {
      setErrors(prev => ({ ...prev, relationship: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (selected.length === 0) {
      newErrors.relationship = "Please select a relationship type"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  useEffect(() => {
    // Initialize with Redux data if available
    if (relationship.relationshipType.value.length > 0) {
      setSelected(relationship.relationshipType.value)
    }
  }, [relationship.relationshipType.value])

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl">
      {/* Back Button */}
      <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Relationship</h1>

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
            {index + 1 === currentStep && <Users className="w-5 h-5 text-white" />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">What's type of relationship are you looking for?</h2>
        <p className="text-sm text-gray-500 mb-6">Select your preferred relationship type</p>

        {errors.relationship && (
          <p className="text-red-500 text-sm mb-4">{errors.relationship}</p>
        )}

        <div className="space-y-4">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelectionChange(option.value)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-colors ${
                selected.includes(option.value)
                  ? "border-[#FF6EC7] bg-pink-50"
                  : "border-gray-100 hover:border-pink-200"
              }`}
            >
              <span className="text-gray-900 font-medium text-left">{option.label}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected.includes(option.value) ? "border-[#FF6EC7] bg-[#FF6EC7]" : "border-gray-300"
                }`}
              >
                {selected.includes(option.value) && <div className="w-3 h-3 rounded-full bg-white" />}
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
  )
}