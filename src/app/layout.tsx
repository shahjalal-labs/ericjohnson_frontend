// import logo from "@/assets/home/logo.png";
// import { AuthSync } from "@/components/auth/AuthSync";
import type { Metadata } from "next";
// import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "./providers/providers";
import { WebSocketProvider } from "@/utilities/websocket/WebSocketProvider";
import { AuthSync } from "@/components/auth/AuthSync";
// import { AuthSync } from "@/components/auth/AuthSync";

// import logo from "@/assets/home/kkk-logo.png";

// const popins = Poppins({
//   variable: "--font-popins",
//   subsets: ["latin"],
//   weight: ["100", "200", "300", "400", "500", "600", "700"],
// });

export const metadata: Metadata = {
  title: "Eric Johnson",
  description: "This is the gaming website",
  icons: {
    // icon: logo.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // _app.js or root layout
  if (typeof window !== "undefined") {
    window.addEventListener("error", (e) => {
      const chunkFailed = /Loading chunk \d+ failed/.test(e.message);
      if (chunkFailed) {
        console.warn("Chunk load failed, reloading...");
        window.location.reload();
      }
    });
  }

  return (
    <html lang="en">
      <body>
        {/* <NavBar /> */}
        {/* <AuthSync /> */}
        <Providers>
          <AuthSync />
          <WebSocketProvider>{children}</WebSocketProvider>
        </Providers>
        <Toaster />

        {/* <Footer /> */}
      </body>
    </html>
  );
}
