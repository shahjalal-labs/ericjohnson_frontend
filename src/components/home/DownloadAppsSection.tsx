import Image from "next/image"
import earthImage from "@/assets/download/earth.png"
import rightImage from "@/assets/download/right.png"
import apple from "@/assets/download/apple.png"
import google from "@/assets/download/google-play.png"

export default function DownloadAppsSection() {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl container mx-auto bg-[#693F9F]">
      {/* Background with gradient and world map pattern */}
      <div className="absolute inset-0 right-0">
        <Image
          src={earthImage}
          alt="World map pattern"
          fill
          className="object-contain opacity-60 flex items-center justify-end"
          priority
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 px-[60px] pt-10">
        {/* Left content section */}
        <div className="w-full lg:w-[70%] space-y-6">
          <h1 className="text-4xl font-semibold text-white leading-tight">Download Mobile Apps</h1>

          <p className="text-base sm:text-lg text-gray-100 leading-relaxed max-w-lg">
            This section promotes a mobile app with download buttons for iOS and Android. It features a repeated user
            testimonial praising the app's smooth and clear process. A smartphone preview and City Adventure Dating
            apps.
          </p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {/* Apple Store Button */}
            <button className="inline-flex items-center justify-center gap-3 bg-[#21201F] hover:bg-gray-800 text-white px-6 py-3 rounded-[12px] transition-colors duration-300">
              <Image src={apple} alt="Apple Store" width={24} height={24} />
              <div className="text-left">
                <div className="text-xs opacity-90">Download on the</div>
                <div className="text-sm font-semibold">Apple Store</div>
              </div>
            </button>

            {/* Google Play Button */}
            <button className="inline-flex items-center justify-center gap-3 bg-[#21201F] hover:bg-gray-800 text-white px-6 py-3 rounded-[12px] transition-colors duration-300">
              <Image src={google} alt="Google Play" width={24} height={24} />
              <div className="text-left">
                <div className="text-xs opacity-90">Get it On</div>
                <div className="text-sm font-semibold">Google Play</div>
              </div>
            </button>
          </div>
        </div>

        {/* Right phone mockup section */}
        <div className="w-full  flex justify-end items-center">
          <div className="relative w-full max-w-sm">
            <Image
              src={rightImage}
              alt="Mobile app screenshot showing Souzi 25 profile"
              width={280}
              height={460}
              className="w-full h-[480px] object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
