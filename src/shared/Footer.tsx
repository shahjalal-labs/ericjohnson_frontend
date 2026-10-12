import logo from "@/assets/logo.png";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-[#9B4DFF1A] text-white">
      <div className="px-6 py-12  lg:py-20">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 container mx-auto px-4">
          {/* Left section - Brand */}
          <div className="space-y-6">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <Image
                src={logo}
                alt="Play Spark Logo"
                className="w-10 h-10 object-contain rounded-full"
                width={24}
                height={24}
              />

              <div>
                <h3 className="text-xl font-bold">Play</h3>
                <p className="text-sm text-gray-400">Spark</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 leading-relaxed max-w-sm text-sm sm:text-base">
              Class aptent taciti sociosqu ad litora torquem conubla
              nostrahimenaeo. Phasellus metus Euismod eget tacit sociosqu
              aditorа torquеn.
            </p>

            {/* Social icons */}
            <div className="flex gap-4">
              <a
                href="#"
                className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors duration-300"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right section - Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Game
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-8"></div>

        {/* Copyright */}
        <div className="text-center text-gray-500 text-sm">
          <p>©2025 Play Spark . All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
