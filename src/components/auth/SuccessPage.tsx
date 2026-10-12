"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SuccessPage() {
  const router = useRouter()

  const handleDone = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030911] relative overflow-hidden p-4">
      {/* Gradient blur background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6EC7] rounded-full blur-[150px] opacity-40" />
      </div>

      {/* Success Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center space-y-6">
          {/* Success Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-pink-100 rounded-full blur-xl opacity-70" />
            <div className="relative bg-gradient-to-br from-pink-100 to-pink-50 rounded-full p-6">
              <CheckCircle2 className="w-16 h-16 text-[#FF6EC7]" strokeWidth={2} />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Password Changed</h1>
            <h2 className="text-2xl font-bold text-gray-900">Successfully</h2>
          </div>

          {/* Done Button */}
          <Button
            onClick={handleDone}
            className="w-full h-12 bg-gradient-to-r from-[#FF6EC7] to-[#FF8FDB] hover:from-[#FF5BB8] hover:to-[#FF7CCB] text-white font-medium rounded-full text-base shadow-lg"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
