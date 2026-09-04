import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CivicVision",
  description: "AI-Powered Civic Action",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <style>{`
          /* Hide the google translate banner */
          .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
          .goog-te-banner-frame { display: none !important; }
          body { top: 0px !important; }
          /* Hide the original widget */
          #google_translate_element { display: none !important; }
          /* Fix Google Translate adding a space at the top */
          html { height: 100%; }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <div id="google_translate_element"></div>
        {children}
        <Script 
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" 
          strategy="lazyOnload" 
        />
        <Script id="google-translate-init" strategy="lazyOnload">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({pageLanguage: 'en', autoDisplay: false}, 'google_translate_element');
            }
          `}
        </Script>
      </body>
    </html>
  );
}
