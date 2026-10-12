// src/app/404.tsx

import Image from "next/image";
import Link from "next/link";
// import logo from "@/assets/home/c-logo.jpeg";
// import Image from "next/image";

// import Link from "next/link";

// import Link from &apos;next/link&apos;;

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="text-center">
        <Image
          src="https://yemca-services.net/404.png"
          alt="404 Illustration"
          width={320}
          height={320}
          className="mx-auto animate-bounce ease-in-out shadow-xl rounded-lg"
        />
        <h1 className="text-5xl md:text-7xl font-extrabold text-blue-700 mt-6">
          Looks Like You&apos;re Lost!
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mt-2">
          We can&apos;t seem to find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transform transition hover:scale-105 hover:bg-blue-700"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
