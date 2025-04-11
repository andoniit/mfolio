import { Tajawal,Shadows_Into_Light } from "next/font/google";
import "./globals.css";
// Optimized Google fonts
const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
});

const shadows = Shadows_Into_Light({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-shadows',
});

export const metadata = {
  title: 'Anirudha Kapileshwari',
  description: 'Potefolio website of me ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
      <html lang="en" className={`${tajawal.variable} ${shadows.variable}`}>
      <head>
        
        {/* Boldonse must be added via <link> because it's not supported by next/font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Boldonse&display=swap"
          rel="stylesheet"
        />
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
      
      <body>  {children}</body>
      
    </html>
  );
}
