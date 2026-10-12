"use client";

import heroImage from "@/assets/heroImage.png";
import lefetVector from "@/assets/left.png";
import rightVector from "@/assets/right.png";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const heroSlides = [
  {
    id: 1,
    title: "Play games & get matches!",
    subtitle: "Play games and find your perfect match!",
    image: heroImage,
  },
  {
    id: 2,
    title: "Connect through gaming!",
    subtitle: "Share your passion for games with someone special!",
    image: heroImage,
  },
  {
    id: 3,
    title: "Find your player two!",
    subtitle: "Your perfect gaming partner is waiting for you!",
    image: heroImage,
  },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen relative overflow-hidden ">
      <div className="absolute left-[264px] top-0 transform w-[564px]   h-[464px] pointer-events-none opacity-80 z-0">
        <Image
          src={lefetVector}
          alt="Left decorative vector"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute right-[124px]  w-[464px] h-[564px] translate-x-6 pointer-events-none opacity-80 z-0">
        <Image
          src={rightVector}
          alt="Right decorative vector"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="container mx-auto">
          <div className="relative min-h-[600px] flex flex-col items-center">
            {/* Hero Content with Carousel */}
            <div className="w-full flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="w-full flex flex-col items-center"
                >
                  {/* Heading */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white text-center mb-6 leading-tight">
                    {heroSlides[currentSlide].title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-base sm:text-lg lg:text-xl text-gray-300 text-center mb-12 max-w-2xl">
                    {heroSlides[currentSlide].subtitle}
                  </p>

                  {/* Hero Illustration */}
                  <div className="relative w-full max-w-4xl aspect-[16/9] flex items-center justify-center">
                    <motion.img
                      src={heroSlides[currentSlide].image.src}
                      alt="VR Gaming Illustration"
                      className="w-full h-auto object-contain rounded-3xl"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Carousel Dots */}
              <div className="flex items-center gap-3 mt-12">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all ${
                      index === currentSlide
                        ? "w-3 h-3 bg-[#FF6EC7] rounded-full shadow-lg"
                        : "w-2.5 h-2.5 bg-white/50 rounded-full hover:bg-white/80"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
