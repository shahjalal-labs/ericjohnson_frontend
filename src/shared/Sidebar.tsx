import logo from "@/assets/logo.png";
import { Clock9, NotebookPen, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FiHome } from "react-icons/fi";
import NavLink from "./NavLink";
import { RiLogoutCircleRLine } from "react-icons/ri";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { icon: <FiHome />, href: "/dashboard", label: "Dashboard" },
  {
    icon: <NotebookPen className="w-5 h-5" />,
    href: "/dashboard/course-Selection",
    label: "Course Selection",
  },
  {
    icon: <Clock9 className="w-5 h-5" />,
    href: "/dashboard/pace-Chart-Generator",
    label: "Pace Chart Generator",
  },
  {
    icon: <Users className="w-5 h-5" />,
    href: "/dashboard/val-connect",
    label: "Val-Connect",
  },
  {
    icon: <Users className="w-5 h-5" />,
    href: "/dashboard/view-Plan",
    label: "View Plan",
  },
  {
    icon: <Users className="w-5 h-5" />,
    href: "/dashboard/help-center",
    label: "Help Center",
  },
];

function Sidebar() {
  return (
    <div className="flex px-5 flex-col h-full bg-[#FFE7CC]">
      <div className="px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-32 h-32 relative">
            <Image
              src={logo}
              alt="Logo"
              fill
              className="object-contain object-center"
              priority
            />
          </div>
        </Link>
      </div>
      <nav className="flex justify-between h-full mb-10 flex-col">
        <div className="flex-1 h-full flex flex-col gap-4 pb-4">
          <div className="flex flex-col gap-1">
            {navLinks.map((link, index) => (
              <NavLink key={index} icon={link.icon} href={link.href}>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
        <div>
          {/* logout */}
          <Button
            onClick={() => {
              signOut({ callbackUrl: "/api/auth/login" });
            }}
            className="flex items-center justify-start gap-2 text-[#D00E11] hover:text-red-500 transition-colors rounded-md bg-[#D00E111A] hover:bg-[#EF444433] w-full py-2 px-4"
          >
            <RiLogoutCircleRLine size={18} />
            <p className="text-[#D00E11] text-lg">Logout</p>
          </Button>
        </div>
      </nav>
    </div>
  );
}

export default Sidebar;
