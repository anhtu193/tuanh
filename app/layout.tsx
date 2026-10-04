import type { Metadata } from "next";
import { Caveat, Geist, Geist_Mono } from "next/font/google";
import ClickSpark from "@/components/ClickSpark";
import PullCordToggle from "@/components/PullCordToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const themeBoot = `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;

export const metadata: Metadata = {
  title: "tuanh",
  description: "Projects and experiments by tuanh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <ClickSpark className="flex min-h-dvh flex-1 flex-col">
          <PullCordToggle />
          {children}
        </ClickSpark>
      </body>
    </html>
  );
}
