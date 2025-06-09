import type { Metadata } from "next";
import { ThirdwebProvider } from "thirdweb/react";
import { FarcasterProvider } from "./context/Farcaster";
import { ToastProvider } from "./providers/Toast";
import { ThemeProvider } from "./providers/Theme";
import { BottomNav } from "~/app/components/BottomNav";

import "~/app/globals.css";

export const metadata: Metadata = {
  title: "Farcaster Frames v2 Demo",
  description: "A Farcaster Frames v2 demo app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="black">
      <body className="pb-20">
        <ThirdwebProvider>
          <FarcasterProvider>
            <ThemeProvider>
              {children}
              <BottomNav />
              <ToastProvider />
            </ThemeProvider>
          </FarcasterProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
