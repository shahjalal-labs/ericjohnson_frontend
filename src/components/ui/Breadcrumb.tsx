"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const Breadcrumb = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean); 

  return (
    <div className="bg-gray-100 pt-12 pb-4 px-5 rounded-lg shadow-md text-center">
      <h2 className="text-[48px] font-bold text-white capitalize">
        {pathSegments[pathSegments.length - 1]?.replace("-", " ") || "Home"}
      </h2>
      <nav className="text-gray-600 text-sm mt-2">
        <Link href="/" className="">Home</Link>
        {pathSegments.map((segment, index) => (
          <span key={index} className="mx-2">
            &gt;
            <Link
              href={`/${pathSegments.slice(0, index + 1).join("/")}`}
              className="ml-2 capitalize"
            >
              {segment.replace("-", " ")}
            </Link>
          </span>
        ))}
      </nav>
    </div>
  );
};

export default Breadcrumb;
