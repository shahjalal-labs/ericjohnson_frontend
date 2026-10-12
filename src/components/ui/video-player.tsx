"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
  Maximize,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Slider } from "./Slider"

interface VideoPlayerProps {
  videoSrc?: string
  title?: string
  currentLesson?: string
  nextLesson?: string
  previousLesson?: string
  onNext?: () => void
  onPrevious?: () => void
  onMarkComplete?: () => void
}

export default function VideoPlayer({
  videoSrc = "/placeholder-video.mp4",
  /* title = "Mathematics Lesson",
  currentLesson = "03 ValAcademy", */
  nextLesson = "04 ValAcademy",
  previousLesson = "02 ValAcademy",
  onNext,
  onPrevious,
  onMarkComplete,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(308) // 5:08 in seconds
  const [duration, setDuration] = useState(1200) // 20:00 in seconds
  const [volume, setVolume] = useState(100)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleProgressChange = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100
    }
  }

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10)
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10)
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, duration))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Video Player Container */}
      <div
        className="relative bg-black rounded-lg overflow-hidden aspect-video group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Background Image (since we can't use actual video) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-KOL41rK7LzdnVnM3RW2qI3ha4RBJ0n.png')",
          }}
        />

        {/* Video Element (hidden but functional) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-0"
          src={videoSrc}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration)
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime)
            }
          }}
        />

        {/* Play Button Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              onClick={handlePlayPause}
            >
              <Play className="w-8 h-8 text-white ml-1" />
            </Button>
          </div>
        )}

        {/* Video Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleProgressChange}
              className="w-full"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={handleSkipBack}>
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={handleSkipForward}>
                <SkipForward className="w-4 h-4" />
              </Button>

              <div className="flex items-center space-x-2 ml-4">
                <Volume2 className="w-4 h-4 text-white" />
                <div className="w-20">
                  <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="w-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                <Settings className="w-4 h-4" />
              </Button>

              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={handleFullscreen}>
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Complete Button */}
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
        onClick={onMarkComplete}
      >
        Mark as Complete
      </Button>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-transparent"
          onClick={onPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous ({previousLesson})</span>
        </Button>

        <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={onNext}>
          <span>Next ({nextLesson})</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
