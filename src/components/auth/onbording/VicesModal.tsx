"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useState } from "react"

interface VicesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (vices: { Alcohol: string; Smoking: string; Marijuana: string; Drugs: string }) => void
  currentVices: { Alcohol: string; Smoking: string; Marijuana: string; Drugs: string }
}

interface ViceOption {
  label: string
  value: string
}

const viceOptions: ViceOption[] = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
  { label: "Sometimes", value: "Sometimes" },
  { label: "Prefer not to say", value: "Prefer not to say" },
]

export default function VicesModal({ isOpen, onClose, onSave, currentVices }: VicesModalProps) {
  const [selectedVices, setSelectedVices] = useState(currentVices)

  const handleViceChange = (viceName: keyof typeof selectedVices, value: string) => {
    setSelectedVices(prev => ({
      ...prev,
      [viceName]: value
    }))
  }

  const handleSave = () => {
    onSave(selectedVices)
    onClose()
  }

  const getViceLabel = (viceName: keyof typeof selectedVices) => {
    switch (viceName) {
      case "Alcohol": return "Alcohol"
      case "Smoking": return "Smoking"
      case "Marijuana": return "Marijuana"
      case "Drugs": return "Drugs"
      default: return viceName
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Select Vices
            </DialogTitle>
            {/* <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button> */}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {(["Alcohol", "Smoking", "Marijuana", "Drugs"] as const).map((viceName) => (
            <div key={viceName} className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">
                {getViceLabel(viceName)}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {viceOptions.map((option) => (
                  <button
                    key={`${viceName}-${option.value}`}
                    onClick={() => handleViceChange(viceName, option.value)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all text-center ${
                      selectedVices[viceName] === option.value
                        ? "border-[#FF6EC7] bg-pink-50 text-[#FF6EC7] font-medium"
                        : "border-gray-200 text-gray-700 hover:border-pink-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 h-12 bg-gradient-to-r from-[#FF6EC7] to-[#FF8FDB] hover:from-[#FF5BB8] hover:to-[#FF7CCB] text-white font-medium rounded-full"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}