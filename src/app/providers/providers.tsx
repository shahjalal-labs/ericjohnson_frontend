"use client";

import ReduxProvider from "@/redux/ReduxProvider";
// import ReduxProvider from "@/redux/ReduxProvider";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const location = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isGameRoute = location === "/game" || location.startsWith("/game/");
    if (!isGameRoute) {
      window.sessionStorage?.clear();
    }
  }, [location]);

  return (
    <SessionProvider>
      <ReduxProvider>
        {children}
        <Toaster />
      </ReduxProvider>
    </SessionProvider>
  );
}
