"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/Checkbox"
import { ArrowLeft, Church } from "lucide-react"
import { ScrollArea } from "@/components/ui/ScrollArea"
import { useAppDispatch, useAppSelector } from "@/redux/store"
import { setReligionPreferences } from "@/redux/allSlice/onboardingSlice"


interface ReligionStepProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export default function ReligionStep({ currentStep, totalSteps, onNext, onBack }: ReligionStepProps) {
  const dispatch = useAppDispatch()
  const religion = useAppSelector((state) => state.onboarding.religion)
  
  const [selected, setSelected] = useState<string[]>(religion.religiousPreferences.value || ["muslim", "hindu", "jewish", "catholic"])
  const [isDealbreaker, setIsDealbreaker] = useState<boolean>(religion.isDealbreaker || false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const options = [
    { value: "christian", label: "Christian" },
    { value: "muslim", label: "Muslim" },
    { value: "hindu", label: "Hindu" },
    { value: "jewish", label: "Jewish" },
    { value: "catholic", label: "Catholic" },
    { value: "spiritual", label: "Spiritual" },
  ]

  const toggleSelection = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    
    setSelected(newSelected)
    
    // Update Redux immediately
    dispatch(
      setReligionPreferences({
        value: newSelected,
        visible: true,
        isDealbreaker,
      })
    )
    
    if (errors.religion) {
      setErrors(prev => ({ ...prev, religion: "" }))
    }
  }

  const handleDealbreakerChange = (checked: boolean) => {
    setIsDealbreaker(checked)
    
    // Update Redux immediately
    dispatch(
      setReligionPreferences({
        value: selected,
        visible: true,
        isDealbreaker: checked,
      })
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (selected.length === 0) {
      newErrors.religion = "Please select at least one religious preference"
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
    if (religion.religiousPreferences.value.length > 0) {
      setSelected(religion.religiousPreferences.value)
    }
    setIsDealbreaker(religion.isDealbreaker)
  }, [religion.religiousPreferences.value, religion.isDealbreaker])

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl max-h-[90vh] flex flex-col">
      {/* Back Button */}
      <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Religion</h1>

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
            {index + 1 === currentStep && <Church className="w-5 h-5 text-white" />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">What are your religious beliefs?</h2>
        <p className="text-sm text-gray-500 mb-6">Select religion you want to meet</p>

        {errors.religion && (
          <p className="text-red-500 text-sm mb-4">{errors.religion}</p>
        )}

        <ScrollArea className="h-64 pr-4">
          <div className="space-y-4 mb-6">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleSelection(option.value)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-colors ${
                  selected.includes(option.value)
                    ? "border-[#FF6EC7] bg-pink-50"
                    : "border-gray-100 hover:border-pink-200"
                }`}
              >
                <span className="text-gray-900 font-medium">{option.label}</span>
                <div
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    selected.includes(option.value) ? "border-[#FF6EC7] bg-[#FF6EC7]" : "border-gray-300"
                  }`}
                >
                  {selected.includes(option.value) && (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 mt-4">
          <Checkbox
            id="dealbreaker"
            checked={isDealbreaker}
            onCheckedChange={handleDealbreakerChange}
          />
          <label htmlFor="dealbreaker" className="text-sm text-gray-600 cursor-pointer">
            This is a dealbreaker
          </label>
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