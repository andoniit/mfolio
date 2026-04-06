import { Shadows_Into_Light } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import ConditionalFooter from "@/components/layout/footer/ConditionalFooter";

const shadows = Shadows_Into_Light({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-shadows',
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

export const metadata = {
  title: 'Anirudha Kapileshwari - Software Engineer',
  description: 'Potefolio website of me ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
      <html
        lang="en"
        className={`${shadows.variable} ${satoshi.variable} ${sueEllenFrancisco.variable}`}
      >
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-1N7X8DBHKY"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag() { dataLayer.push(arguments); }
              gtag('js', new Date());
              gtag('config', 'G-1N7X8DBHKY');
            `,
          }}
        />
      </head>
      
      <body className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
        <ConditionalFooter />
      </body>
      
    </html>
  );
}
