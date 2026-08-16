import { Shadows_Into_Light } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import TabTitleWatcher from "@/components/layout/TabTitleWatcher";
import GoogleAnalyticsTracker from "@/components/analytics/GoogleAnalyticsTracker";
const shadows = Shadows_Into_Light({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-shadows',
});

const coolvetica = localFont({
  src: "../../public/fonts/Coolvetica Rg.otf",
  variable: "--font-coolvetica",
  display: "swap",
});

const coolveticaItalic = localFont({
  src: "../../public/fonts/Coolvetica Rg It.otf",
  variable: "--font-coolvetica-italic",
  display: "swap",
});

const satoshi = localFont({
  src: "../../public/fonts/Satoshi-Variable.ttf",
  variable: "--font-satoshi",
  display: "swap",
});

const sueEllenFrancisco = localFont({
  src: "../../public/fonts/SueEllenFrancisco-Regular.ttf",
  variable: "--font-sue-ellen",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
const siteName = "Anirudha Kapileshwari";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-1N7X8DBHKY";

const globalJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": siteUrl ? `${siteUrl}#website` : "#website",
      name: siteName,
      url: siteUrl || "/",
      inLanguage: "en",
    },
    {
      "@type": "Person",
      "@id": siteUrl ? `${siteUrl}#person` : "#person",
      name: "Anirudha Kapileshwari",
      jobTitle: "Software Engineer",
      url: siteUrl || "/",
      image: siteUrl ? `${siteUrl}/images/25.jpg` : "/images/25.jpg",
      sameAs: [
        "https://www.linkedin.com/in/anirudha-kapileshwari-293826202/",
        "https://github.com/andoniit",
        "https://www.behance.net/aniruddkapiles1",
      ],
      worksFor: {
        "@type": "Organization",
        name: "Independent",
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Anirudha Kapileshwari - Software Engineer",
    template: "%s | Anirudha Kapileshwari",
  },
  description:
    "Portfolio of Anirudha Kapileshwari - software engineer building performant web experiences, product-focused projects, and practical engineering solutions.",
  keywords: [
    "Anirudha Kapileshwari",
    "software engineer",
    "portfolio",
    "web developer",
    "frontend",
    "full stack",
    "projects",
    "blog",
  ],
  authors: [{ name: "Anirudha Kapileshwari" }],
  creator: "Anirudha Kapileshwari",
  publisher: "Anirudha Kapileshwari",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Anirudha Kapileshwari",
    title: "Anirudha Kapileshwari - Software Engineer",
    description:
      "Explore projects, experience, and articles by Anirudha Kapileshwari.",
    url: siteUrl || undefined,
    images: [
      {
        url: "/images/25.jpg",
        width: 1200,
        height: 630,
        alt: "Anirudha Kapileshwari portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anirudha Kapileshwari - Software Engineer",
    description:
      "Explore projects, experience, and articles by Anirudha Kapileshwari.",
    images: ["/images/25.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
      <html
        lang="en"
        className={`${shadows.variable} ${satoshi.variable} ${sueEllenFrancisco.variable} ${coolvetica.variable} ${coolveticaItalic.variable}`}
      >
      {/* Extensions (Grammarly et al.) stamp attributes onto <body> before React
          hydrates, which trips the attribute-mismatch warning. Suppressing here
          covers only this element's own attributes, not its children. */}
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          strategy="afterInteractive"
        />
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', { send_page_view: false });
            `,
          }}
        />
        <Suspense fallback={null}>
          <GoogleAnalyticsTracker measurementId={gaMeasurementId} />
        </Suspense>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }}
        />
        <TabTitleWatcher />
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
        <SiteChrome />
      </body>
      
    </html>
  );
}
