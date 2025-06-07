import type { Metadata } from "next";
import { ThirdwebProvider } from "thirdweb/react";
import { FarcasterProvider } from "./context/Farcaster";

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
    <html lang="en" data-theme="sunset">
      <body>
        <ThirdwebProvider>
          <FarcasterProvider>
            {children}
          </FarcasterProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
